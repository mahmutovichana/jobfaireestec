import { Router, raw } from "express";
import { rateLimit } from "express-rate-limit";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "./config.mjs";
import { transaction, problem } from "./db.mjs";
const router = Router();
const eventSchema = z
  .object({
    id: z.string().min(1).max(200),
    email: z.string().email().max(320),
    type: z.enum(["bounce", "complaint", "unsubscribe"]),
  })
  .strict();
router.post(
  "/mail/events",
  rateLimit({ windowMs: 60000, limit: 60 }),
  raw({ type: "application/json", limit: "64kb" }),
  async (req, res) => {
    if (!config.MAIL_WEBHOOK_SECRET)
      throw problem(503, "Mail webhook nije konfiguriran");
    const timestamp = String(req.get("x-jobfair-timestamp") ?? ""),
      signature = String(req.get("x-jobfair-signature") ?? "");
    if (
      !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() - Number(timestamp)) > 300000 ||
      !Buffer.isBuffer(req.body)
    )
      throw problem(401, "Invalid event signature");
    const expected = createHmac("sha256", config.MAIL_WEBHOOK_SECRET)
      .update(timestamp + ".")
      .update(req.body)
      .digest("hex");
    if (
      !/^[a-f0-9]{64}$/.test(signature) ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw problem(401, "Invalid event signature");
    const event = eventSchema.parse(JSON.parse(req.body.toString("utf8")));
    await transaction(null, async (db) => {
      if (
        !(
          await db.query(
            "INSERT INTO identity.mail_webhook_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
            [event.id],
          )
        ).rowCount
      )
        return;
      await db.query(
        "INSERT INTO suppressed_emails(email,reason,metadata) SELECT $1,$2,$3 WHERE NOT EXISTS(SELECT 1 FROM suppressed_emails WHERE lower(email)=$1)",
        [
          event.email.toLowerCase(),
          event.type,
          JSON.stringify({ event_id: event.id }),
        ],
      );
    });
    res.json({ accepted: true });
  },
);
export default router;
