import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash, createHmac } from "node:crypto";
import { once } from "node:events";
import path from "node:path";
import os from "node:os";
import { pool } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";
import { config } from "../src/config.mjs";
import { resourceQuery } from "../src/resources.mjs";
import { storagePath } from "../src/storage.mjs";
import { processMailBatch } from "../src/worker.mjs";
import { OAuth2Client } from "google-auth-library";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Tests require an isolated _test database");
const testFiles = path.join(os.tmpdir(), "jobfair-test-" + randomUUID());
config.STORAGE_ROOT = path.join(testFiles, "storage");
config.OUTBOX_ROOT = path.join(testFiles, "outbox");
const admin = {
  id: randomUUID(),
  email: `admin-${randomUUID()}@example.test`,
  admin: true,
  board: true,
  approved: true,
  canCv: true,
};
const company = {
  id: randomUUID(),
  email: `company-${randomUUID()}@example.test`,
  admin: false,
  board: false,
  approved: true,
  canCv: true,
};
const outsider = {
  id: randomUUID(),
  email: `outsider-${randomUUID()}@example.test`,
  admin: false,
  board: false,
  approved: false,
  canCv: false,
};
let server, origin, adminCookie;
const visitorEmail = `visitor-${randomUUID()}@example.test`;
test.before(async () => {
  for (const u of [admin, company, outsider])
    await pool.query("INSERT INTO identity.users(id,email) VALUES($1,$2)", [
      u.id,
      u.email,
    ]);
  await pool.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')", [
    admin.id,
  ]);
  const token = randomBytes(32).toString("hex");
  await pool.query(
    "INSERT INTO identity.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
    [createHash("sha256").update(token).digest("hex"), admin.id],
  );
  adminCookie = "jobfair_session=" + token;
  server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = "http://127.0.0.1:" + server.address().port;
});
test.after(async () => {
  await new Promise((r) => server.close(r));
  await pool.end();
});
test("mail events require signatures and deduplicate valid deliveries", async () => {
  const previous = config.MAIL_WEBHOOK_SECRET;
  config.MAIL_WEBHOOK_SECRET = randomBytes(32).toString("hex");
  try {
    const body = JSON.stringify({
      id: randomUUID(),
      email: randomUUID() + "@example.test",
      type: "bounce",
    });
    const timestamp = String(Date.now());
    const signature = createHmac("sha256", config.MAIL_WEBHOOK_SECRET)
      .update(timestamp + "." + body)
      .digest("hex");
    const send = (sig) =>
      fetch(origin + "/api/v1/mail/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-jobfair-timestamp": timestamp,
          "x-jobfair-signature": sig,
        },
        body,
      });
    assert.equal((await send("invalid")).status, 401);
    assert.equal((await send(signature)).status, 200);
    assert.equal((await send(signature)).status, 200);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int count FROM suppressed_emails WHERE email=$1",
          [JSON.parse(body).email],
        )
      ).rows[0].count,
      1,
    );
  } finally {
    config.MAIL_WEBHOOK_SECRET = previous;
  }
});
test("bulk reorder is restricted and rolls back incomplete batches", async () => {
  const headers = {
    "content-type": "application/json",
    origin: config.APP_ORIGIN,
    "x-jobfair-request": "1",
  };
  const body = JSON.stringify({ table: "partners", ids: [randomUUID()] });
  assert.equal(
    (
      await fetch(origin + "/api/v1/rpc/reorder_entities", {
        method: "POST",
        headers,
        body,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(origin + "/api/v1/rpc/reorder_entities", {
        method: "POST",
        headers: { ...headers, cookie: adminCookie },
        body,
      })
    ).status,
    400,
  );
  const invalid = JSON.stringify({ table: "identity.users", ids: [] });
  assert.equal(
    (
      await fetch(origin + "/api/v1/rpc/reorder_entities", {
        method: "POST",
        headers: { ...headers, cookie: adminCookie },
        body: invalid,
      })
    ).status,
    400,
  );
});
test("untrusted resource names and fields cannot become SQL", async () => {
  await assert.rejects(() =>
    resourceQuery("events; DROP TABLE events", {}, null),
  );
  await assert.rejects(() =>
    resourceQuery(
      "events",
      { filters: [{ column: "id OR true", op: "eq", value: "x" }] },
      null,
    ),
  );
});
test("anonymous reads cannot expose CVs or access requests", async () => {
  assert.deepEqual((await resourceQuery("cv_submissions", {}, null)).data, []);
  assert.deepEqual((await resourceQuery("access_requests", {}, null)).data, []);
});
test("anonymous and company callers cannot grant roles", async () => {
  await assert.rejects(() =>
    resourceQuery(
      "user_roles",
      { operation: "insert", values: { user_id: outsider.id, role: "admin" } },
      null,
    ),
  );
  await assert.rejects(() =>
    resourceQuery(
      "user_roles",
      { operation: "insert", values: { user_id: company.id, role: "admin" } },
      company,
    ),
  );
});
test("public requests cannot self-approve", async () => {
  await assert.rejects(() =>
    resourceQuery(
      "access_requests",
      {
        operation: "insert",
        values: {
          email: "one@example.test",
          full_name: "One",
          status: "approved",
        },
      },
      null,
    ),
  );
  const r = await resourceQuery(
    "access_requests",
    {
      operation: "insert",
      values: { email: "one@example.test", full_name: "One" },
    },
    null,
  );
  assert.equal(r.data[0].status, "pending");
});
test("cross-origin and missing CSRF headers are rejected", async () => {
  assert.equal(
    (await fetch(origin + "/api/v1/auth/logout", { method: "POST" })).status,
    403,
  );
  assert.equal(
    (
      await fetch(origin + "/api/v1/auth/logout", {
        method: "POST",
        headers: { origin: "https://attacker.test", "x-jobfair-request": "1" },
      })
    ).status,
    403,
  );
});
test("Google login fails closed without configured credentials", async () => {
  assert.equal(
    (await fetch(origin + "/api/v1/auth/google/start", { redirect: "manual" }))
      .status,
    503,
  );
});
test("storage traversal and anonymous private signing are rejected", async () => {
  assert.throws(() => storagePath("cv-uploads", "../secret"));
  assert.throws(() => storagePath("cv-uploads", "folder/../../secret"));
  const r = await fetch(origin + "/api/v1/storage/sign", {
    method: "POST",
    headers: {
      origin: config.APP_ORIGIN,
      "x-jobfair-request": "1",
      "content-type": "application/json",
    },
    body: JSON.stringify({ bucket: "cv-uploads", path: "x.pdf" }),
  });
  assert.equal(r.status, 403);
});
test("drafts stay private and ownership is enforced", async () => {
  const r = await resourceQuery(
    "events",
    {
      operation: "insert",
      values: {
        user_id: company.id,
        name: "Private event",
        slug: randomUUID(),
        status: "draft",
      },
    },
    company,
  );
  const id = r.data[0].id;
  assert.equal(
    (
      await resourceQuery(
        "events",
        { filters: [{ column: "id", op: "eq", value: id }] },
        null,
      )
    ).data.length,
    0,
  );
  const update = await resourceQuery(
    "events",
    {
      operation: "update",
      values: { name: "stolen" },
      filters: [{ column: "id", op: "eq", value: id }],
    },
    { ...outsider, approved: true },
  );
  assert.equal(update.data.length, 0);
});
test("simultaneous registrations respect capacity and enqueue once", async () => {
  const event = (
    await resourceQuery(
      "events",
      {
        operation: "insert",
        values: {
          user_id: admin.id,
          name: "Capacity test",
          slug: randomUUID(),
          status: "live",
          capacity: 1,
        },
      },
      admin,
    )
  ).data[0];
  const register = () =>
    fetch(origin + "/api/v1/rpc/register_for_event", {
      method: "POST",
      headers: {
        origin: config.APP_ORIGIN,
        "x-jobfair-request": "1",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        p_event_id: event.id,
        p_data: { Email: visitorEmail, Name: "Visitor" },
      }),
    });
  const results = await Promise.all([register(), register()]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
  const rows = (
    await pool.query(
      "SELECT count(*)::int n FROM registrations WHERE event_id=$1",
      [event.id],
    )
  ).rows;
  assert.equal(rows[0].n, 1);
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM identity.mail_jobs WHERE recipient=$1",
        [visitorEmail],
      )
    ).rows[0].n,
    1,
  );
});
test("SMTP failures retain jobs for retry instead of losing email", async () => {
  await processMailBatch(async () => {
    throw Error("simulated network outage");
  });
  const job = (
    await pool.query(
      "SELECT status,attempts FROM identity.mail_jobs WHERE recipient=$1",
      [visitorEmail],
    )
  ).rows[0];
  assert.equal(job.status, "retry");
  assert.equal(job.attempts, 1);
});
test("financial fields are not in public partner participations", async () => {
  const rows = await resourceQuery(
    "partner_participations",
    { columns: "id,custom_price" },
    null,
  ).catch((e) => e);
  assert.ok(rows instanceof Error);
});
test("missing filters cannot erase a whole resource", async () => {
  await assert.rejects(() =>
    resourceQuery("events", { operation: "delete" }, admin),
  );
});
test("partner prices, participation embeds and upserts preserve privacy", async () => {
  const key = "test-" + randomUUID();
  await resourceQuery(
    "package_types",
    { operation: "insert", values: { key, label: "Test" } },
    admin,
  );
  const partner = (
    await resourceQuery(
      "partners",
      {
        operation: "insert",
        values: {
          user_id: admin.id,
          name: "Test partner",
          package: key,
          visible: true,
        },
      },
      admin,
    )
  ).data[0];
  await resourceQuery(
    "partner_participations",
    {
      operation: "upsert",
      onConflict: "partner_id,year",
      values: {
        partner_id: partner.id,
        year: 2026,
        package: key,
        custom_price: 500,
        currency: "BAM",
      },
    },
    admin,
  );
  const filter = [{ column: "id", op: "eq", value: partner.id }];
  const publicRow = (
    await resourceQuery(
      "partners",
      {
        columns: "id, participations:partner_participations(id, year, package)",
        filters: filter,
      },
      null,
    )
  ).data[0];
  assert.equal(publicRow.participations.length, 1);
  assert.equal(publicRow.participations[0].custom_price, undefined);
  const privateRow = (
    await resourceQuery(
      "partners",
      {
        columns:
          "id, participations:partner_participations(id, year, custom_price)",
        filters: filter,
      },
      admin,
    )
  ).data[0];
  assert.equal(Number(privateRow.participations[0].custom_price), 500);
});
test("CV upload, submission and signed download stay on our server", async () => {
  const key = "submissions/" + randomUUID() + "/cv.pdf";
  const response = await fetch(
    origin + "/api/v1/storage/cv-uploads?path=" + encodeURIComponent(key),
    {
      method: "PUT",
      headers: {
        origin: config.APP_ORIGIN,
        "x-jobfair-request": "1",
        "Content-Type": "application/pdf",
      },
      body: "%PDF-1.4\n%%EOF",
    },
  );
  assert.equal(response.status, 201);
  const submitted = await resourceQuery(
    "cv_submissions",
    {
      operation: "insert",
      values: {
        full_name: "Test Candidate",
        email: "candidate@example.test",
        cv_url: key,
      },
    },
    null,
  );
  assert.equal(submitted.data[0].cv_url, key);
  const signed = await fetch(origin + "/api/v1/storage/sign", {
    method: "POST",
    headers: {
      origin: config.APP_ORIGIN,
      "x-jobfair-request": "1",
      "Content-Type": "application/json",
      cookie: adminCookie,
    },
    body: JSON.stringify({ bucket: "cv-uploads", path: key, expiresIn: 60 }),
  });
  assert.equal(signed.status, 200);
  const url = (await signed.json()).data.signedUrl;
  assert.equal((await fetch(origin + url)).status, 200);
  assert.equal((await fetch(origin + url + "tampered")).status, 403);
  assert.equal(
    (await fetch(origin + "/api/v1/storage/public/cv-uploads/" + key)).status,
    403,
  );
});
test("inquiries atomically enqueue one confirmation and unsubscribe tokens are idempotent", async () => {
  const email = "inquiry-" + randomUUID() + "@example.test";
  await resourceQuery(
    "company_inquiries",
    {
      operation: "insert",
      values: {
        company_name: "Example",
        contact_person: "Test Person",
        email,
        message: "Interested in the fair",
      },
    },
    null,
  );
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM identity.mail_jobs WHERE recipient=$1",
        [email],
      )
    ).rows[0].n,
    1,
  );
  const token = randomUUID();
  await pool.query(
    "INSERT INTO email_unsubscribe_tokens(email,token) VALUES($1,$2)",
    [email, token],
  );
  const before = await fetch(
    origin + "/api/v1/services/handle-email-unsubscribe?token=" + token,
  );
  assert.equal((await before.json()).valid, true);
  const submit = () =>
    fetch(origin + "/api/v1/services/handle-email-unsubscribe", {
      method: "POST",
      headers: {
        origin: config.APP_ORIGIN,
        "x-jobfair-request": "1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
  assert.equal((await submit()).status, 200);
  assert.equal((await submit()).status, 200);
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM suppressed_emails WHERE email=$1",
        [email],
      )
    ).rows[0].n,
    1,
  );
});
test("Google state, PKCE, existing UUID, HttpOnly session and logout work with a simulated identity provider", async () => {
  const oldConfig = {
    GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: config.GOOGLE_CALLBACK_URL,
  };
  const getToken = OAuth2Client.prototype.getToken,
    verify = OAuth2Client.prototype.verifyIdToken;
  Object.assign(config, {
    GOOGLE_CLIENT_ID: "local-test-client",
    GOOGLE_CLIENT_SECRET: "test-only",
    GOOGLE_CALLBACK_URL: origin + "/api/v1/auth/google/callback",
  });
  OAuth2Client.prototype.getToken = async () => ({
    tokens: { id_token: "simulated-id-token" },
  });
  OAuth2Client.prototype.verifyIdToken = async () => ({
    getPayload: () => ({
      email_verified: true,
      email: company.email,
      sub: "google-" + company.id,
      name: "Example Company",
    }),
  });
  try {
    await pool.query(
      "INSERT INTO access_requests(email,full_name,status,approved_at) VALUES($1,'Company Contact','approved',now())",
      [company.email],
    );
    const start = await fetch(
      origin + "/api/v1/auth/google/start?returnTo=/dashboard/home",
      { redirect: "manual" },
    );
    assert.equal(start.status, 302);
    const location = new URL(start.headers.get("location"));
    assert.equal(location.searchParams.get("code_challenge_method"), "S256");
    const oauthCookie = start.headers.get("set-cookie").split(";")[0];
    const state = location.searchParams.get("state");
    const invalid = await fetch(
      origin + "/api/v1/auth/google/callback?state=wrong&code=test",
      { headers: { cookie: oauthCookie }, redirect: "manual" },
    );
    assert.equal(invalid.status, 400);
    const callback = await fetch(
      origin + "/api/v1/auth/google/callback?state=" + state + "&code=test",
      { headers: { cookie: oauthCookie }, redirect: "manual" },
    );
    assert.equal(callback.status, 302);
    assert.equal(
      callback.headers.get("location"),
      config.APP_ORIGIN + "/dashboard/home",
    );
    assert.ok(!callback.headers.get("location").includes("token="));
    const cookies = callback.headers.getSetCookie();
    const session = cookies.find((c) => c.startsWith("jobfair_session="));
    assert.match(session, /HttpOnly/i);
    const sessionCookie = session.split(";")[0];
    const me = await fetch(origin + "/api/v1/auth/session", {
      headers: { cookie: sessionCookie },
    });
    assert.equal((await me.json()).data.session.user.id, company.id);
    await fetch(origin + "/api/v1/auth/logout", {
      method: "POST",
      headers: {
        cookie: sessionCookie,
        origin: config.APP_ORIGIN,
        "x-jobfair-request": "1",
      },
    });
    const loggedOut = await fetch(origin + "/api/v1/auth/session", {
      headers: { cookie: sessionCookie },
    });
    assert.equal((await loggedOut.json()).data.session, null);
  } finally {
    Object.assign(config, oldConfig);
    OAuth2Client.prototype.getToken = getToken;
    OAuth2Client.prototype.verifyIdToken = verify;
  }
});
test("two workers lease a notification once and include a usable unsubscribe link", async () => {
  const recipient = "worker-" + randomUUID() + "@example.test";
  await pool.query(
    "INSERT INTO identity.mail_jobs(recipient,template,payload,created_at) VALUES($1,'contact-inquiry-confirmation','{}','2000-01-01')",
    [recipient],
  );
  let sends = 0;
  const simulatedSend = async (message) => {
    if (message.to === recipient) {
      sends++;
      assert.match(message.text, /unsubscribe\?token=/);
      assert.match(message.html, /Odjava sa email liste/);
    }
  };
  await Promise.all([
    processMailBatch(simulatedSend),
    processMailBatch(simulatedSend),
  ]);
  assert.equal(sends, 1);
  assert.equal(
    (
      await pool.query(
        "SELECT status FROM identity.mail_jobs WHERE recipient=$1",
        [recipient],
      )
    ).rows[0].status,
    "sent",
  );
});
