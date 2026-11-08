import { Router } from "express";
import { pool, transaction, problem } from "./db.mjs";
import { onRecordWritten, renderMail } from "./notifications.mjs";
import { config } from "./config.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { storagePath } from "./storage.mjs";
import { randomUUID } from "node:crypto";
const router = Router();
router.post("/rpc/reorder_entities", async (req, res) => {
  if (!req.user?.board) throw problem(403, "Nemate ovlasti");
  const { table, ids } = req.body;
  if (
    !["partners", "team_members"].includes(table) ||
    !Array.isArray(ids) ||
    ids.length > 1000 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id))
  )
    throw problem(400, "Invalid order");
  const data = await transaction(req.user, async (db) => {
    const rows = (
      await db.query(
        `UPDATE public."${table}" t SET display_order=(sorted.position-1)::int FROM unnest($1::uuid[]) WITH ORDINALITY sorted(id,position) WHERE t.id=sorted.id RETURNING t.id`,
        [ids],
      )
    ).rows;
    if (rows.length !== ids.length)
      throw problem(400, "Jedan od zapisa više ne postoji");
    return rows;
  });
  res.json({ data, error: null });
});
router.post("/services/preview-transactional-email", (req, res) => {
  if (!req.user?.admin) throw problem(403, "Samo administrator");
  if (
    ![
      "event-registration-confirmation",
      "contact-inquiry-confirmation",
      "access-approved",
    ].includes(req.body.templateName)
  )
    throw problem(400, "Unknown template");
  res.json({
    data: renderMail(
      { template: req.body.templateName, payload: req.body.templateData ?? {} },
      config.APP_ORIGIN,
    ),
    error: null,
  });
});
router.get("/services/mail-status", async (req, res) => {
  if (!req.user?.admin) throw problem(403, "Samo administrator");
  res.json({
    data: (
      await pool.query(
        "SELECT status,count(*)::int count FROM identity.mail_jobs GROUP BY status",
      )
    ).rows,
    error: null,
  });
});
router.post("/services/retry-email", async (req, res) => {
  if (!req.user?.admin) throw problem(403, "Samo administrator");
  const rows = (
    await pool.query(
      "UPDATE identity.mail_jobs SET status='pending',attempts=0,available_at=now(),last_error=NULL WHERE id=$1 AND status='dlq' RETURNING id",
      [req.body.id],
    )
  ).rows;
  res.json({ data: rows, error: null });
});
router.get("/services/handle-email-unsubscribe", async (req, res) => {
  const token = String(req.query.token ?? "");
  if (!token || token.length > 200) return res.json({ valid: false });
  const row = (
    await pool.query(
      "SELECT email,used_at FROM email_unsubscribe_tokens WHERE token=$1",
      [token],
    )
  ).rows[0];
  if (!row) return res.json({ valid: false });
  const suppressed = (
    await pool.query(
      "SELECT 1 FROM suppressed_emails WHERE lower(email)=lower($1)",
      [row.email],
    )
  ).rowCount;
  res.set("Cache-Control", "no-store").json({
    valid: !row.used_at && !suppressed,
    reason: row.used_at || suppressed ? "already_unsubscribed" : undefined,
  });
});
router.post("/rpc/:name", async (req, res) => {
  const p = req.body ?? {};
  const user = req.user;
  let data;
  if (req.params.name === "register_for_event")
    data = await transaction(user, async (db) => {
      const id = (
        await db.query("SELECT register_for_event($1,$2::jsonb) id", [
          p.p_event_id,
          JSON.stringify(p.p_data),
        ])
      ).rows[0].id;
      const row = (
        await db.query("SELECT * FROM registrations WHERE id=$1", [id])
      ).rows[0];
      await onRecordWritten(db, "registrations", "insert", row, user);
      return id;
    });
  else if (req.params.name === "get_registration_count")
    data = (
      await pool.query("SELECT get_registration_count($1) value", [
        p.p_event_id,
      ])
    ).rows[0].value;
  else if (req.params.name === "is_email_approved") {
    if (!user || p.check_email?.toLowerCase() !== user.email)
      throw problem(403, "Nije dozvoljena provjera tuđeg naloga");
    data = user.approved;
  } else throw problem(404, "Unknown function");
  res.json({ data, error: null });
});
router.post("/services/handle-email-unsubscribe", async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== "string" || token.length > 200)
    throw problem(400, "Neispravan token");
  const data = await transaction(req.user, async (db) => {
    const row = (
      await db.query(
        "SELECT * FROM email_unsubscribe_tokens WHERE token=$1 FOR UPDATE",
        [token],
      )
    ).rows[0];
    if (!row) return { success: false, error: "Link nije važeći" };
    await db.query(
      "INSERT INTO suppressed_emails(email,reason) SELECT $1,'unsubscribe' WHERE NOT EXISTS(SELECT 1 FROM suppressed_emails WHERE lower(email)=lower($1))",
      [row.email],
    );
    await db.query(
      "UPDATE email_unsubscribe_tokens SET used_at=coalesce(used_at,now()) WHERE id=$1",
      [row.id],
    );
    return { success: true };
  });
  res.json({ data, error: null });
});
router.post("/services/enhance-description", async (req, res) => {
  if (!req.user?.board) throw problem(403, "Nemate ovlasti");
  if (!config.GEMINI_API_KEY)
    throw problem(503, "AI servis još nije konfiguriran");
  const description = String(req.body.description ?? "");
  if (description.length > 20000) throw problem(400, "Opis je predug");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Poboljšaj opis događaja na bosanskom jeziku, zadrži sve činjenice i vrati samo opis:\n${description}`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) throw problem(502, "AI servis trenutno nije dostupan");
  const output = await response.json();
  const enhanced = output.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!enhanced) throw problem(502, "AI odgovor je prazan");
  res.json({ data: { enhanced, description: enhanced }, error: null });
});
async function saveInstagramImage(url, key) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !["cdninstagram.com", "fbcdn.net"].some(
      (host) =>
        parsed.hostname === host || parsed.hostname.endsWith("." + host),
    )
  )
    throw problem(400, "Nepodržan izvor slike");
  const response = await fetch(parsed, {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw problem(502, "Slika nije dostupna");
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > config.MAX_UPLOAD_BYTES)
    throw problem(413, "Slika je prevelika");
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > config.MAX_UPLOAD_BYTES) {
      await response.body.cancel().catch(() => {});
      throw problem(413, "Slika je prevelika");
    }
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);
  const mime = response.headers.get("content-type")?.split(";")[0];
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
    throw problem(415, "Neispravan format");
  const file = storagePath("news-images", key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data, { flag: "wx" });
  await pool.query(
    "INSERT INTO identity.storage_objects(bucket,path,size,mime) VALUES($1,$2,$3,$4)",
    ["news-images", key, data.length, mime],
  );
  return "/api/v1/storage/public/news-images/" + key;
}
router.post("/services/sync-instagram", async (req, res) => {
  if (!req.user?.board) throw problem(403, "Nemate ovlasti");
  if (!config.RAPIDAPI_KEY)
    throw problem(503, "Instagram servis još nije konfiguriran");
  const response = await fetch(
    "https://instagram120.p.rapidapi.com/api/instagram/posts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "x-rapidapi-key": config.RAPIDAPI_KEY,
      },
      body: JSON.stringify({ username: config.INSTAGRAM_USERNAME, maxId: "" }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) throw problem(502, "Instagram servis nije dostupan");
  const result = await response.json();
  const posts = (result?.result?.edges ?? result?.data?.edges ?? [])
    .slice(0, 30)
    .map((e) => e.node ?? e);
  let synced = 0;
  for (const post of posts) {
    const id = String(post.code ?? post.id ?? post.pk ?? "");
    if (
      !id ||
      (
        await pool.query(
          "SELECT 1 FROM news_posts WHERE instagram_post_id=$1",
          [id],
        )
      ).rowCount
    )
      continue;
    const media = post.carousel_media ?? [post];
    const gallery = [];
    for (const item of media.slice(0, 10)) {
      const url =
        item.image_versions2?.candidates?.[0]?.url ??
        item.display_url ??
        item.thumbnail_url;
      if (url)
        gallery.push(
          await saveInstagramImage(url, "instagram/" + randomUUID() + ".jpg"),
        );
    }
    if (!gallery.length) continue;
    const content =
      post.caption?.text ??
      post.edge_media_to_caption?.edges?.[0]?.node?.text ??
      "";
    await transaction(req.user, (db) =>
      db.query(
        "INSERT INTO news_posts(user_id,title,content,summary,thumbnail_url,gallery_urls,published,published_at,instagram_post_id) VALUES($1,$2,$3,$4,$5,$6,true,now(),$7)",
        [
          req.user.id,
          content.slice(0, 120) || "Instagram objava",
          content,
          content.slice(0, 250),
          gallery[0],
          JSON.stringify(gallery.slice(1)),
          id,
        ],
      ),
    );
    synced++;
  }
  res.json({ data: { synced, refreshed: 0 }, error: null });
});
router.post("/services/backfill-news-images", async (req, res) => {
  if (!req.user?.board) throw problem(403, "Nemate ovlasti");
  let refreshed = 0;
  for (const row of (
    await pool.query("SELECT id,thumbnail_url,gallery_urls FROM news_posts")
  ).rows) {
    const urls = [row.thumbnail_url, ...(row.gallery_urls ?? [])];
    let changed = false;
    for (let i = 0; i < urls.length; i++)
      if (urls[i] && String(urls[i]).startsWith("https://")) {
        urls[i] = await saveInstagramImage(
          urls[i],
          "instagram/" + randomUUID() + ".jpg",
        );
        changed = true;
      }
    if (changed) {
      await pool.query(
        "UPDATE news_posts SET thumbnail_url=$2,gallery_urls=$3 WHERE id=$1",
        [row.id, urls[0], JSON.stringify(urls.slice(1))],
      );
      refreshed++;
    }
  }
  res.json({ data: { refreshed }, error: null });
});
export default router;
