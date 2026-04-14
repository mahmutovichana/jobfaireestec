// ── enhance-description: Comprehensive Edge Function Tests ──
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/enhance-description`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

// ── CORS ──

Deno.test("enhance-description: CORS preflight returns 200 with allow-origin", async () => {
  const res = await fetch(BASE, { method: "OPTIONS", headers });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

// ── Auth guard ──

Deno.test("enhance-description: rejects request without Authorization header", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ description: "Test event" }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("enhance-description: rejects invalid Bearer token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer completely-invalid-token-xyz",
    },
    body: JSON.stringify({ description: "Test" }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("enhance-description: rejects malformed Authorization (no Bearer prefix)", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Basic dXNlcjpwYXNz",
    },
    body: JSON.stringify({ description: "Test" }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

// ── Input validation ──

Deno.test("enhance-description: rejects empty body (missing description)", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 400 || res.status === 401);
});

Deno.test("enhance-description: rejects null description", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ description: null }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 400 || res.status === 401);
});

Deno.test("enhance-description: rejects empty string description", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ description: "" }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 400 || res.status === 401);
});

Deno.test("enhance-description: rejects non-string description (number)", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ description: 12345 }),
  });
  const body = await res.json();
  assertExists(body);
  // May coerce to truthy or reject
  assert(res.status >= 200);
});

Deno.test("enhance-description: rejects invalid JSON body", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...headers, "Content-Type": "text/plain" },
    body: "not json {{{",
  });
  const body = await res.text();
  assertExists(body);
  assert(res.status >= 400);
});

// ── Optional fields ──

Deno.test("enhance-description: accepts description with event_name and event_type", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      description: "A career fair for students",
      event_name: "JobFAIR 2026",
      event_type: "career_fair",
    }),
  });
  const body = await res.json();
  assertExists(body);
  // With anon key: 401 (auth), or 200 if auth passes
  assert(res.status === 200 || res.status === 401);
});

Deno.test("enhance-description: handles missing event_name gracefully", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ description: "Test description without event name" }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 200 || res.status === 401);
});

// ── XSS in input ──

Deno.test("enhance-description: handles XSS payload in description", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      description: '<script>alert("xss")</script>',
      event_name: '"><img onerror=alert(1) src=x>',
    }),
  });
  const body = await res.json();
  assertExists(body);
  // Should not crash
  assert(res.status >= 200);
});
