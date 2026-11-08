import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { pool } from "./db.mjs";
import { config } from "./config.mjs";
import { renderMail } from "./notifications.mjs";
export async function processMailBatch(sendOverride) {
  await pool.query(
    "UPDATE identity.mail_jobs SET status='pending',lease=NULL,locked_at=NULL WHERE status='processing' AND locked_at < now()-interval '15 minutes'",
  );
  const quota = (
    await pool.query(
      "SELECT count(*) FILTER(WHERE available_at>now()-interval '24 hours')::int daily,count(*)::int monthly FROM identity.mail_jobs WHERE status='sent' AND available_at>now()-interval '30 days'",
    )
  ).rows[0];
  if (
    quota.daily >= Number(config.MAIL_DAILY_LIMIT ?? 700) ||
    quota.monthly >= Number(config.MAIL_MONTHLY_LIMIT ?? 9500)
  )
    return { processed: 0, quota: true };
  const lease = randomUUID();
  const jobs = (
    await pool.query(
      `WITH ready AS (SELECT id FROM identity.mail_jobs WHERE status IN ('pending','retry') AND available_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1) UPDATE identity.mail_jobs j SET status='processing',lease=$2,locked_at=now(),attempts=attempts+1 FROM ready WHERE j.id=ready.id RETURNING j.*`,
      [
        Math.min(
          config.WORKER_BATCH,
          Number(config.MAIL_DAILY_LIMIT ?? 700) - quota.daily,
          Number(config.MAIL_MONTHLY_LIMIT ?? 9500) - quota.monthly,
        ),
        lease,
      ],
    )
  ).rows;
  const smtp =
    config.MAIL_TRANSPORT === "smtp"
      ? nodemailer.createTransport({
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
          secure: config.SMTP_PORT === 465,
          requireTLS: config.SMTP_PORT !== 465,
          auth: config.SMTP_USER
            ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
            : undefined,
          pool: true,
          maxConnections: 2,
        })
      : null;
  for (const job of jobs) {
    try {
      if (
        (
          await pool.query(
            "SELECT 1 FROM suppressed_emails WHERE lower(email)=lower($1)",
            [job.recipient],
          )
        ).rowCount
      ) {
        await pool.query(
          "UPDATE identity.mail_jobs SET status='suppressed',lease=NULL WHERE id=$1 AND lease=$2",
          [job.id, lease],
        );
        continue;
      }
      let unsubscribeToken = (
        await pool.query(
          "SELECT token FROM email_unsubscribe_tokens WHERE lower(email)=lower($1) AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
          [job.recipient],
        )
      ).rows[0]?.token;
      if (!unsubscribeToken) {
        unsubscribeToken = randomUUID();
        await pool.query(
          "INSERT INTO email_unsubscribe_tokens(email,token) VALUES($1,$2)",
          [job.recipient, unsubscribeToken],
        );
      }
      const renderedJob = {
        ...job,
        payload: {
          ...job.payload,
          unsubscribe_url:
            config.APP_ORIGIN +
            "/unsubscribe?token=" +
            encodeURIComponent(unsubscribeToken),
        },
      };
      const message = {
        ...renderMail(renderedJob, config.APP_ORIGIN),
        from: config.MAIL_FROM,
        to: job.recipient,
        messageId: `<${job.id}@${new URL(config.APP_ORIGIN).hostname}>`,
      };
      if (sendOverride) await sendOverride(message);
      else if (smtp) await smtp.sendMail(message);
      else {
        await fs.mkdir(config.OUTBOX_ROOT, { recursive: true });
        const output = await nodemailer
          .createTransport({
            streamTransport: true,
            buffer: true,
            newline: "unix",
          })
          .sendMail(message);
        await fs.writeFile(
          path.join(config.OUTBOX_ROOT, job.id + ".eml"),
          output.message,
        );
      }
      await pool.query(
        "UPDATE identity.mail_jobs SET status='sent',lease=NULL,locked_at=NULL,available_at=now(),last_error=NULL WHERE id=$1 AND lease=$2",
        [job.id, lease],
      );
      await pool.query(
        "INSERT INTO email_send_log(message_id,template_name,recipient_email,status) VALUES($1,$2,$3,'sent')",
        [job.id, job.template, job.recipient],
      );
    } catch (e) {
      const final = job.attempts >= 5;
      await pool.query(
        "UPDATE identity.mail_jobs SET status=$3,lease=NULL,locked_at=NULL,last_error=$4,available_at=now()+($5*interval '1 second') WHERE id=$1 AND lease=$2",
        [
          job.id,
          lease,
          final ? "dlq" : "retry",
          String(e.message).slice(0, 500),
          Math.min(3600, 30 * 2 ** job.attempts),
        ],
      );
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  smtp?.close();
  return { processed: jobs.length };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let stopping = false;
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => {
      stopping = true;
    });
  while (!stopping) {
    try {
      await processMailBatch();
    } catch (e) {
      console.error("Mail worker failed:", e.code ?? e.name);
    }
    await new Promise((r) => setTimeout(r, config.WORKER_POLL_MS));
  }
  await pool.end();
}
