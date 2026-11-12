import "dotenv/config";
import path from "node:path";
import { z } from "zod";
const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    APP_ORIGIN: z.string().url().default("http://localhost:8081"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HOST: z.string().default("127.0.0.1"),
    SESSION_SECRET: z.string().min(32),
    SESSION_DAYS: z.coerce.number().min(1).max(90).default(30),
    STORAGE_ROOT: z.string().default("./var/storage"),
    OUTBOX_ROOT: z.string().default("./var/outbox"),
    MAIL_TRANSPORT: z.enum(["file", "smtp"]).default("file"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().default("JobFAIR <noreply@jobfair.ba>"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    RAPIDAPI_KEY: z.string().optional(),
    INSTAGRAM_USERNAME: z.string().default("jobfair.sarajevo"),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    MAX_UPLOAD_BYTES: z.coerce
      .number()
      .int()
      .min(1024)
      .max(52428800)
      .default(10485760),
    WORKER_BATCH: z.coerce.number().int().min(1).max(100).default(10),
    WORKER_POLL_MS: z.coerce.number().min(1000).default(5000),
  })
  .passthrough()
  .parse(process.env);
if (
  env.NODE_ENV === "production" &&
  (env.MAIL_TRANSPORT !== "smtp" ||
    !env.SMTP_HOST ||
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_CALLBACK_URL ||
    !env.APP_ORIGIN.startsWith("https://"))
)
  throw Error("Production requires HTTPS, SMTP and Google OAuth configuration");
if (
  env.NODE_ENV === "production" &&
  /REPLACE|CHANGE_ME|example|continuous-integration/i.test(env.SESSION_SECRET)
)
  throw Error("Production requires a generated session secret");
export const config = {
  ...env,
  STORAGE_ROOT: path.resolve(env.STORAGE_ROOT),
  OUTBOX_ROOT: path.resolve(env.OUTBOX_ROOT),
};
