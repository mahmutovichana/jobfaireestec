import { Router } from "express";
import { z } from "zod";
import { pool, problem } from "./db.mjs";
const router = Router();
let cache,
  until = 0;
async function load() {
  if (!cache || Date.now() > until) {
    cache =
      (
        await pool.query(
          "SELECT value FROM identity.settings WHERE key='public_site'",
        )
      ).rows[0]?.value ?? {};
    until = Date.now() + 60000;
  }
  return cache;
}
router.get("/site-config.js", async (_req, res) =>
  res
    .set("Cache-Control", "public,max-age=60")
    .type("application/javascript")
    .send(
      "window.__JOBFAIR_CONFIG__=" +
        JSON.stringify(await load()).replaceAll("<", "\\u003c") +
        ";",
    ),
);
router.get("/settings/site", async (_req, res) =>
  res.json({ data: await load(), error: null }),
);
const site = z
  .object({
    name: z.string().min(1).max(100),
    year: z.number().int().min(2000).max(2200),
    eventDate: z.string().max(200),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("bs", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
    siteUrl: z.string().url(),
    socials: z.record(z.string(), z.string().url()),
    stats: z
      .array(
        z.object({ value: z.string().max(30), label: z.string().max(100) }),
      )
      .max(10),
  })
  .strict();
router.patch("/settings/site", async (req, res) => {
  if (!req.user?.admin) throw problem(403, "Samo administrator");
  const value = site.parse(req.body);
  await pool.query(
    "UPDATE identity.settings SET value=$1 WHERE key='public_site'",
    [JSON.stringify(value)],
  );
  until = 0;
  res.json({ data: await load(), error: null });
});
export default router;
