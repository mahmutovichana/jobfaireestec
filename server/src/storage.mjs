import { Router, raw } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { config } from "./config.mjs";
import { pool, problem } from "./db.mjs";
const buckets = new Set([
  "event-assets",
  "news-images",
  "partner-logos",
  "team-photos",
  "gallery",
  "cv-uploads",
]);
export function storagePath(bucket, key) {
  if (
    !buckets.has(bucket) ||
    typeof key !== "string" ||
    !key ||
    key.length > 500 ||
    /[\\:\u0000-\u001f]/.test(key) ||
    key.split("/").some((x) => !x || x === "." || x === "..")
  )
    throw problem(400, "Invalid storage path");
  const file = path.resolve(config.STORAGE_ROOT, bucket, key);
  if (!file.startsWith(path.join(config.STORAGE_ROOT, bucket) + path.sep))
    throw problem(400, "Invalid storage path");
  return file;
}
const sign = (value) =>
  createHmac("sha256", config.SESSION_SECRET).update(value).digest("base64url");
const router = Router();
router.put(
  "/:bucket",
  raw({ type: () => true, limit: config.MAX_UPLOAD_BYTES }),
  async (req, res) => {
    const bucket = req.params.bucket,
      key = String(req.query.path ?? ""),
      file = storagePath(bucket, key),
      user = req.user;
    if (
      bucket !== "cv-uploads" &&
      !user?.board &&
      !(bucket === "partner-logos" && user?.approved) &&
      !(bucket === "event-assets" && user?.approved)
    )
      throw problem(403, "Nemate ovlasti za upload");
    if (!Buffer.isBuffer(req.body) || !req.body.length)
      throw problem(400, "Empty file");
    const data = req.body;
    const mime =
      data.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
          ? "image/jpeg"
          : data
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? "image/png"
            : data.subarray(0, 4).toString() === "RIFF" &&
                data.subarray(8, 12).toString() === "WEBP"
              ? "image/webp"
              : null;
    if (
      !mime ||
      (bucket === "cv-uploads" && mime !== "application/pdf") ||
      (bucket !== "cv-uploads" && !mime.startsWith("image/"))
    )
      throw problem(415, "Nepodržan format fajla");
    if (
      bucket === "cv-uploads" &&
      !/^submissions\/[\w-]{16,}\/[\w.-]+$/.test(key)
    )
      throw problem(400, "Invalid CV path");
    if (
      bucket !== "cv-uploads" &&
      !user?.board &&
      !key.startsWith(user.id + "/")
    )
      throw problem(403, "Invalid owner path");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data, { flag: "wx", mode: 0o600 }).catch((e) => {
      if (e.code === "EEXIST") throw problem(409, "Fajl već postoji");
      throw e;
    });
    try {
      await pool.query(
        "INSERT INTO identity.storage_objects(bucket,path,owner_id,size,mime) VALUES($1,$2,$3,$4,$5)",
        [bucket, key, user?.id ?? null, data.length, mime],
      );
    } catch (e) {
      await fs.unlink(file);
      throw e;
    }
    res.status(201).json({ data: { path: key }, error: null });
  },
);
router.post("/sign", async (req, res) => {
  if (!req.user?.canCv)
    throw problem(403, "Nemate pristup dokumentima");
  const { bucket, path: key } = req.body ?? {};
  if (bucket !== "cv-uploads") throw problem(400, "Invalid private bucket");
  storagePath(bucket, key);
  const expires =
    Date.now() +
    Math.min(600, Math.max(10, Number(req.body.expiresIn) || 60)) * 1000;
  const payload = Buffer.from(
    JSON.stringify({ bucket, key, expires }),
  ).toString("base64url");
  res.json({
    data: {
      signedUrl: "/api/v1/storage/signed/" + payload + "." + sign(payload),
    },
    error: null,
  });
});
router.get("/signed/:token", async (req, res) => {
  const [payload, mac] = String(req.params.token).split(".");
  const expected = sign(payload ?? "");
  if (
    !mac ||
    !/^[A-Za-z0-9_-]{43}$/.test(mac) ||
    mac.length !== expected.length ||
    !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  )
    throw problem(403, "Invalid signature");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!Number.isFinite(data.expires) || data.expires < Date.now())
    throw problem(403, "Link je istekao");
  const file = storagePath(data.bucket, data.key);
  res.set({
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
  });
  res.type(
    data.key.endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
  );
  res.sendFile(file);
});
router.get("/public/:bucket/*key", async (req, res) => {
  if (req.params.bucket === "cv-uploads") throw problem(403, "Private bucket");
  const key = Array.isArray(req.params.key)
    ? req.params.key.join("/")
    : req.params.key;
  const file = storagePath(req.params.bucket, key);
  const meta = (
    await pool.query(
      "SELECT mime FROM identity.storage_objects WHERE bucket=$1 AND path=$2",
      [req.params.bucket, key],
    )
  ).rows[0];
  if (!meta) throw problem(404, "Fajl nije pronađen");
  res
    .set("Cache-Control", "public, max-age=3600")
    .type(meta.mime)
    .sendFile(file);
});
export default router;
