import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pool } from "../src/db.mjs";
import { config } from "../src/config.mjs";
const root = path.resolve(process.argv[2] ?? "");
if (!process.argv[2])
  throw Error("Usage: npm run import -- /private/path/to/backup");
const tables = JSON.parse(
  await fs.readFile(new URL("../src/schema.json", import.meta.url), "utf8"),
);
const metadata = path.join(root, "database", "metadata");
const load = (n) =>
  fs.readFile(path.join(metadata, n + ".json"), "utf8").then(JSON.parse);
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "storage-manifest.json"), "utf8"),
);
const users = await load("auth"),
  identities = await load("identities");
const dataset = {};
for (const table of Object.keys(tables))
  dataset[table] = JSON.parse(
    await fs.readFile(
      path.join(root, "database", "public", table + ".json"),
      "utf8",
    ),
  );
const digest = createHash("sha256")
  .update(JSON.stringify({ users, dataset, manifest }))
  .digest("hex");
// Preserve every original scalar and document inside an immutable archive column;
// only runtime URL fields are rewritten to same-origin storage paths.
function rewrite(v) {
  if (typeof v === "string")
    return v.replace(
      /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//g,
      "/api/v1/storage/public/",
    );
  if (Array.isArray(v)) return v.map(rewrite);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, rewrite(x)]),
    );
  return v;
}
const db = await pool.connect();
let report = { digest, tables: {}, storage: { copied: 0, missing: [] } };
try {
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(73011812)");
  if (
    (
      await db.query(
        "SELECT 1 FROM identity.migration_imports WHERE digest=$1",
        [digest],
      )
    ).rowCount
  ) {
    console.log("Identical backup already imported");
    await db.query("ROLLBACK");
    process.exitCode = 0;
  } else {
    for (const t of Object.keys(tables))
      if ((await db.query(`SELECT 1 FROM public."${t}" LIMIT 1`)).rowCount)
        throw Error("Import requires empty target tables: " + t);
    await db.query(
      "CREATE TABLE IF NOT EXISTS identity.legacy_records(table_name text NOT NULL,id text NOT NULL,record jsonb NOT NULL,PRIMARY KEY(table_name,id))",
    );
    for (const user of users) {
      const identity = identities.find(
        (i) => i.user_id === user.id && i.provider === "google",
      );
      const meta = user.raw_user_meta_data ?? {};
      const safe = { ...user };
      for (const k of Object.keys(safe))
        if (/token|password|nonce/i.test(k)) delete safe[k];
      await db.query(
        "INSERT INTO identity.users(id,email,google_sub,full_name,avatar_url,legacy_data,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          user.id,
          user.email,
          identity?.provider_id ?? meta.sub ?? null,
          meta.full_name ?? null,
          meta.avatar_url ?? null,
          JSON.stringify(safe),
          user.created_at,
        ],
      );
    }
    // Non-FK/check constraints and triggers are kept; FK checks are deferred by import order.
    const order = [
      "package_types",
      "profiles",
      "user_roles",
      "events",
      "partners",
      "team_members",
      "news_posts",
      "job_ads",
      "gallery_images",
      "access_requests",
      "form_fields",
      "registrations",
      "package_prices",
      "partner_participations",
      "cv_submissions",
      "company_inquiries",
      "email_templates",
      "email_send_state",
      "email_send_log",
      "email_unsubscribe_tokens",
      "suppressed_emails",
      "page_views",
      "performance_metrics",
      "audit_logs",
    ];
    // Audit triggers are disabled only for the import transaction, never in the live API.
    for (const t of order)
      await db.query(`ALTER TABLE public."${t}" DISABLE TRIGGER USER`);
    for (const t of order) {
      for (const original of dataset[t]) {
        const id = original.id ?? original.key;
        await db.query(
          "INSERT INTO identity.legacy_records(table_name,id,record) VALUES($1,$2,$3)",
          [t, String(id), JSON.stringify(original)],
        );
        await db.query(
          `INSERT INTO public."${t}" SELECT * FROM jsonb_populate_record(NULL::public."${t}",$1::jsonb)`,
          [JSON.stringify(rewrite(original))],
        );
      }
      report.tables[t] = dataset[t].length;
    }
    for (const t of order)
      await db.query(`ALTER TABLE public."${t}" ENABLE TRIGGER USER`);
    for (const object of manifest) {
      if (object.status !== "downloaded") {
        report.storage.missing.push({
          bucket: object.bucket,
          path: object.name,
        });
        continue;
      }
      const source = path.resolve(root, "storage", object.bucket, object.name),
        target = path.resolve(config.STORAGE_ROOT, object.bucket, object.name);
      if (
        !source.startsWith(path.resolve(root, "storage") + path.sep) ||
        !target.startsWith(config.STORAGE_ROOT + path.sep)
      )
        throw Error("Invalid object path");
      const bytes = await fs.readFile(source);
      if (bytes.length !== object.bytes) throw Error("Storage size mismatch");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes, { flag: "wx" }).catch(async (e) => {
        if (e.code !== "EEXIST") throw e;
        const existing = await fs.readFile(target);
        if (!existing.equals(bytes))
          throw Error("Conflicting existing storage object");
      });
      await db.query(
        "INSERT INTO identity.storage_objects(bucket,path,size,mime) VALUES($1,$2,$3,$4)",
        [
          object.bucket,
          object.name,
          bytes.length,
          object.name.toLowerCase().endsWith(".png")
            ? "image/png"
            : object.name.toLowerCase().endsWith(".pdf")
              ? "application/pdf"
              : "image/jpeg",
        ],
      );
      report.storage.copied++;
    }
    await db.query(
      "INSERT INTO identity.migration_imports(digest,report) VALUES($1,$2)",
      [digest, JSON.stringify(report)],
    );
    await db.query("COMMIT");
    console.log(JSON.stringify(report));
  }
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  db.release();
  await pool.end();
}
