import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config } from "./config.mjs";
import { pool } from "./db.mjs";
import auth, { loadUser, csrf } from "./auth.mjs";
import resources from "./resources.mjs";
import storage from "./storage.mjs";
import services from "./services.mjs";
import settings from "./settings.mjs";
import mailEvents from "./mail-events.mjs";
export function createApp() {
  const app = express();
  app.use(compression({ threshold: 1024 }));
  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY_HOPS);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'"],
          frameSrc: ["'self'", "https://www.google.com"],
          workerSrc: ["'self'", "blob:"],
          upgradeInsecureRequests: config.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/api/v1/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.use("/api/v1", mailEvents);
  app.use(
    "/api/v1",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) =>
        req.method === "GET" && req.path.startsWith("/storage/public/"),
      message: {
        data: null,
        error: { message: "Previše zahtjeva. Pokušajte kasnije." },
      },
    }),
    cookieParser(config.SESSION_SECRET),
    csrf,
    express.json({ limit: "1mb" }),
    (req, res, next) => {
      const publicRead =
        (req.method === "GET" || req.method === "HEAD") &&
        (req.path.startsWith("/storage/public/") || req.path === "/site-config.js");
      return publicRead ? next() : loadUser(req, res, next);
    },
  );
  app.use("/api/v1/auth", rateLimit({ windowMs: 60000, limit: 60 }), auth);
  app.use(
    "/api/v1/storage",
    rateLimit({
      windowMs: 60000,
      limit: 10,
      skip: (req) => req.method !== "PUT",
      message: {
        data: null,
        error: { message: "Previše zahtjeva za upload. Pokušajte kasnije." },
      },
    }),
    storage,
  );
  app.use("/api/v1/data", resources);
  app.use("/api/v1", services);
  app.use("/api/v1", settings);
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: { message: "Unknown endpoint" } }),
  );
  const dist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../dist",
  );
  app.use(
    express.static(dist, {
      maxAge: "1h",
      index: false,
      setHeaders(res, file) {
        if (path.basename(file) === "index.html")
          res.setHeader("Cache-Control", "no-cache");
        else if (file.startsWith(path.join(dist, "assets") + path.sep))
          res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
      },
    }),
  );
  app.use("/assets", (_req, res) => res.status(404).end());
  app.get("/{*path}", (_req, res) =>
    res
      .set("Cache-Control", "no-cache")
      .sendFile(path.join(dist, "index.html")),
  );
  app.use((err, _req, res, _next) => {
    const status =
      err.status ??
      (err.code === "23505"
        ? 409
        : err.name === "ZodError" || ["23503", "22P02", "23502", "23514", "P0001"].includes(err.code)
          ? 400
          : err.code === "ENOENT"
            ? 404
            : 500);
    if (status >= 500) console.error("Request failed:", err.code ?? err.name);
    res.status(status).json({
      data: null,
      error: {
        message: status >= 500 ? "Servis trenutno nije dostupan" :
          err.name === "ZodError" ? "Neispravni podaci zahtjeva" : err.message,
      },
    });
  });
  return app;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const app = createApp();
  const server = app.listen(config.PORT, config.HOST, () =>
    console.log(`JobFAIR API listening on ${config.HOST}:${config.PORT}`),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () =>
      server.close(async () => {
        await pool.end();
        process.exit(0);
      }),
    );
}
