import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/db.mjs";
const root = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw Error("Backup path required");
const tables = JSON.parse(
  await fs.readFile(new URL("../src/schema.json", import.meta.url), "utf8"),
);
let errors = 0;
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
try {
  for (const t of Object.keys(tables)) {
    const expected = JSON.parse(
      await fs.readFile(
        path.join(root, "database/public", t + ".json"),
        "utf8",
      ),
    );
    const actual = (
      await pool.query(`SELECT count(*)::int n FROM public."${t}"`)
    ).rows[0].n;
    const archived = (
      await pool.query(
        "SELECT count(*)::int n FROM identity.legacy_records WHERE table_name=$1",
        [t],
      )
    ).rows[0].n;
    const key = t === "package_types" ? "key" : "id";
    const differences = (
      await pool.query(
        `SELECT count(*)::int n FROM jsonb_populate_recordset(NULL::public."${t}",$1::jsonb) e LEFT JOIN public."${t}" t ON t."${key}"=e."${key}" WHERE t."${key}" IS NULL OR to_jsonb(t) IS DISTINCT FROM to_jsonb(e)`,
        [JSON.stringify(rewrite(expected))],
      )
    ).rows[0].n;
    const archiveDifferences = (
      await pool.query(
        `SELECT count(*)::int n FROM identity.legacy_records a JOIN jsonb_array_elements($2::jsonb) e ON a.id=e->>$3 WHERE a.table_name=$1 AND a.record IS DISTINCT FROM e`,
        [t, JSON.stringify(expected), key],
      )
    ).rows[0].n;
    if (
      actual < expected.length ||
      archived !== expected.length ||
      differences ||
      archiveDifferences
    )
      errors++;
    console.log(
      t,
      expected.length,
      actual,
      archived,
      "changed rows:",
      differences,
      "archive changes:",
      archiveDifferences,
    );
  }
  const imports = (
    await pool.query(
      "SELECT report FROM identity.migration_imports ORDER BY imported_at DESC LIMIT 1",
    )
  ).rows[0];
  console.log("Storage:", JSON.stringify(imports?.report.storage));
  if (imports?.report.storage.missing.length)
    console.log("CUTOVER BLOCKED: missing private objects");
  process.exitCode =
    errors ||
    (process.argv.includes("--cutover") &&
      imports?.report.storage.missing.length)
      ? 1
      : 0;
} finally {
  await pool.end();
}
