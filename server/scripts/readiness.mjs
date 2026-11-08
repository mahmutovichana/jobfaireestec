import { pool } from "../src/db.mjs";
import { config } from "../src/config.mjs";
const checks = {
  https: config.APP_ORIGIN.startsWith("https://"),
  google: !!(
    config.GOOGLE_CLIENT_ID &&
    config.GOOGLE_CLIENT_SECRET &&
    config.GOOGLE_CALLBACK_URL
  ),
  smtp: config.MAIL_TRANSPORT === "smtp" && !!config.SMTP_HOST,
  ai: !!config.GEMINI_API_KEY,
  instagram: !!config.RAPIDAPI_KEY,
};
try {
  const report = (
    await pool.query(
      "SELECT report FROM identity.migration_imports ORDER BY imported_at DESC LIMIT 1",
    )
  ).rows[0]?.report;
  checks.imported = !!report;
  checks.allStorageImported = !!report && !report.storage.missing.length;
  checks.databaseOnline = (await pool.query("SELECT 1")).rowCount === 1;
  for (const [check, ok] of Object.entries(checks))
    console.log(ok ? "PASS" : "BLOCKED", check);
  process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
} finally {
  await pool.end();
}
