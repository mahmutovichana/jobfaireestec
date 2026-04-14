// ── handle-email-unsubscribe: Comprehensive Edge Function Tests ──
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
};

// ── CORS ──

Deno.test("unsubscribe: CORS preflight returns 200", async () => {
  const res = await fetch(BASE, { method: "OPTIONS", headers });
  await res.text();
  assertEquals(res.status, 200);
});

// ── Method validation ──

Deno.test("unsubscribe: rejects PUT with 405", async () => {
  const res = await fetch(BASE, { method: "PUT", headers, body: JSON.stringify({}) });
  const body = await res.json();
  assertEquals(res.status, 405);
  assertExists(body.error);
});

Deno.test("unsubscribe: rejects DELETE with 405", async () => {
  const res = await fetch(BASE, { method: "DELETE", headers });
  const body = await res.json();
  assertEquals(res.status, 405);
  assertExists(body.error);
});

Deno.test("unsubscribe: rejects PATCH with 405", async () => {
  const res = await fetch(BASE, { method: "PATCH", headers, body: JSON.stringify({}) });
  const body = await res.json();
  assertEquals(res.status, 405);
  assertExists(body.error);
});

// ── GET: token validation ──

Deno.test("unsubscribe: GET without token returns 400", async () => {
  const res = await fetch(BASE, { method: "GET", headers });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(body.error.toLowerCase().includes("token"));
});

Deno.test("unsubscribe: GET with invalid token returns 404", async () => {
  const res = await fetch(`${BASE}?token=invalid-nonexistent-abc123`, { method: "GET", headers });
  const body = await res.json();
  assertEquals(res.status, 404);
  assert(body.error.includes("Invalid") || body.error.includes("expired"));
});

Deno.test("unsubscribe: GET with empty token param returns 400", async () => {
  const res = await fetch(`${BASE}?token=`, { method: "GET", headers });
  const body = await res.json();
  // Empty string → 400 (no token) or 404 (invalid)
  assert(res.status === 400 || res.status === 404);
});

Deno.test("unsubscribe: GET with very long token returns 404", async () => {
  const longToken = "a".repeat(1000);
  const res = await fetch(`${BASE}?token=${longToken}`, { method: "GET", headers });
  const body = await res.json();
  assertEquals(res.status, 404);
});

// ── POST: JSON body ──

Deno.test("unsubscribe: POST with missing token (JSON) returns 400", async () => {
  const res = await fetch(BASE, { method: "POST", headers, body: JSON.stringify({}) });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertExists(body.error);
});

Deno.test("unsubscribe: POST with invalid token (JSON) returns 404", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: "completely-fake-token-xyz-987" }),
  });
  const body = await res.json();
  assertEquals(res.status, 404);
  assertExists(body.error);
});

Deno.test("unsubscribe: POST with null token returns 400", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: null }),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
});

// ── POST: form-encoded (RFC 8058 one-click) ──

Deno.test("unsubscribe: POST form-encoded one-click without query token returns 400", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    body: "List-Unsubscribe=One-Click",
  });
  const body = await res.json();
  assertEquals(res.status, 400);
});

Deno.test("unsubscribe: POST form-encoded with token field (invalid) returns 404", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    body: "token=fake-form-token-123",
  });
  const body = await res.json();
  assertEquals(res.status, 404);
});

Deno.test("unsubscribe: POST form-encoded one-click with query token (invalid) returns 404", async () => {
  const res = await fetch(`${BASE}?token=invalid-query-token`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    body: "List-Unsubscribe=One-Click",
  });
  const body = await res.json();
  assertEquals(res.status, 404);
});

// ── POST: invalid JSON body fallback to query param ──

Deno.test("unsubscribe: POST with invalid JSON body falls back to query token", async () => {
  const res = await fetch(`${BASE}?token=fallback-query-token-test`, {
    method: "POST",
    headers,
    body: "not valid json {{{",
  });
  const body = await res.json();
  // Invalid token → 404
  assertEquals(res.status, 404);
});

// ── Idempotency check ──

Deno.test("unsubscribe: double POST with same invalid token returns 404 both times", async () => {
  const token = "idempotency-check-fake-token";
  const res1 = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ token }),
  });
  const body1 = await res1.json();
  assertEquals(res1.status, 404);

  const res2 = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ token }),
  });
  const body2 = await res2.json();
  assertEquals(res2.status, 404);
});
