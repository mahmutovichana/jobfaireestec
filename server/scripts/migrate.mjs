import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { pool } from "../src/db.mjs";
const db = await pool.connect();
try {
  await db.query("SELECT pg_advisory_lock(73011811)");
  await db.query(
    "CREATE SCHEMA IF NOT EXISTS identity;CREATE TABLE IF NOT EXISTS identity.schema_migrations(name text PRIMARY KEY,digest text NOT NULL,applied_at timestamptz DEFAULT now())",
  );
  for (const name of (
    await fs.readdir(new URL("../migrations/", import.meta.url))
  )
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const sql = await fs.readFile(
      new URL("../migrations/" + name, import.meta.url),
      "utf8",
    );
    const digest = createHash("sha256").update(sql).digest("hex");
    const old = (
      await db.query(
        "SELECT digest FROM identity.schema_migrations WHERE name=$1",
        [name],
      )
    ).rows[0];
    if (old) {
      if (old.digest !== digest)
        throw Error("Applied migration changed: " + name);
      continue;
    }
    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query(
        "INSERT INTO identity.schema_migrations(name,digest) VALUES($1,$2)",
        [name, digest],
      );
      await db.query("COMMIT");
      console.log("Applied", name);
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    }
  }
} finally {
  await db.query("SELECT pg_advisory_unlock(73011811)");
  db.release();
  await pool.end();
}
