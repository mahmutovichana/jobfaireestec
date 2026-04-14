// ── process-email-queue: Comprehensive Edge Function Tests ──
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/process-email-queue`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

// ── Auth: verify_jwt + service_role check ──

Deno.test("process-queue: rejects without any Authorization header", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("process-queue: rejects anon key (not service_role) with 403", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 403);
  assertEquals(body.error, "Forbidden");
});

Deno.test("process-queue: rejects invalid JWT token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid.jwt.token",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("process-queue: rejects empty Bearer", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer ",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("process-queue: rejects Basic auth scheme", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic dXNlcjpwYXNz",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

// ── CORS (verify_jwt=true means OPTIONS handled by gateway) ──

Deno.test("process-queue: OPTIONS returns response", async () => {
  const res = await fetch(BASE, { method: "OPTIONS", headers });
  await res.text();
  // Gateway handles CORS; various status codes are acceptable
  assert(res.status >= 200 && res.status < 500);
});

// ── GET method ──

Deno.test("process-queue: GET with anon key returns 403 (not service_role)", async () => {
  const res = await fetch(BASE, { method: "GET", headers });
  const body = await res.json();
  assertEquals(res.status, 403);
});
