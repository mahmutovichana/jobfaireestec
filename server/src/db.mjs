import pg from "pg";
import { config } from "./config.mjs";
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 15000,
});
export async function transaction(user, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.user_id',$1,true),set_config('request.jwt.claims',$2,true)",
      [user?.id ?? "", JSON.stringify({ sub: user?.id, email: user?.email })],
    );
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export function problem(status, message) {
  return Object.assign(new Error(message), { status });
}
