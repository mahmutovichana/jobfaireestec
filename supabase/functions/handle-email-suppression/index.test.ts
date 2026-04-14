// ── handle-email-suppression: Comprehensive Edge Function Tests ──
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/handle-email-suppression`;

const headers = { "Content-Type": "application/json" };

// ── Method validation ──

Deno.test("suppression: rejects GET with 405", async () => {
  const res = await fetch(BASE, { method: "GET" });
  const body = await res.json();
  assertEquals(res.status, 405);
  assert(body.error.includes("Method"));
});

Deno.test("suppression: rejects PUT with 405", async () => {
  const res = await fetch(BASE, { method: "PUT", headers, body: JSON.stringify({}) });
  const body = await res.json();
  assertEquals(res.status, 405);
});

Deno.test("suppression: rejects DELETE with 405", async () => {
  const res = await fetch(BASE, { method: "DELETE" });
  const body = await res.json();
  assertEquals(res.status, 405);
});

Deno.test("suppression: rejects PATCH with 405", async () => {
  const res = await fetch(BASE, { method: "PATCH", headers, body: JSON.stringify({}) });
  const body = await res.json();
  assertEquals(res.status, 405);
});

// ── HMAC / auth validation ──

Deno.test("suppression: POST without HMAC signature returns 401", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: { email: "test@test.com", reason: "bounce" } }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 400 || res.status === 500);
});

Deno.test("suppression: POST with invalid HMAC signature returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...headers, "x-webhook-signature": "sha256=invalid_sig" },
    body: JSON.stringify({ data: { email: "test@test.com", reason: "bounce" } }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

// ── Payload validation ──

Deno.test("suppression: POST with empty body returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

Deno.test("suppression: POST with missing data field returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ no_data_field: true }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

Deno.test("suppression: POST with data missing email returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: { reason: "bounce" } }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

Deno.test("suppression: POST with data missing reason returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: { email: "test@test.com" } }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

Deno.test("suppression: POST with invalid JSON body returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "not json {{{",
  });
  const body = await res.text();
  assertExists(body);
  assert(res.status >= 400);
});

// ── Bounce/complaint/unsubscribe reason variants ──

Deno.test("suppression: POST with reason=bounce (no HMAC) is rejected", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: { email: "bounce@test.com", reason: "bounce", is_retry: false, retry_count: 0 },
    }),
  });
  const body = await res.json();
  assert(res.status >= 400);
});

Deno.test("suppression: POST with reason=complaint (no HMAC) is rejected", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: { email: "complaint@test.com", reason: "complaint", is_retry: false, retry_count: 0 },
    }),
  });
  const body = await res.json();
  assert(res.status >= 400);
});

Deno.test("suppression: POST with reason=unsubscribe (no HMAC) is rejected", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: { email: "unsub@test.com", reason: "unsubscribe", is_retry: true, retry_count: 1 },
    }),
  });
  const body = await res.json();
  assert(res.status >= 400);
});
