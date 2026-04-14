// ── preview-transactional-email: Comprehensive Edge Function Tests ──
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/preview-transactional-email`;

// ── CORS ──

Deno.test("preview-email: CORS preflight returns 200 with allow-origin", async () => {
  const res = await fetch(BASE, {
    method: "OPTIONS",
    headers: { "Content-Type": "application/json" },
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

// ── Auth: LOVABLE_API_KEY validation ──

Deno.test("preview-email: rejects request without any auth", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("preview-email: rejects with wrong Bearer token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer wrong-api-key-completely-invalid",
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assertEquals(res.status, 401);
});

Deno.test("preview-email: rejects with anon key as Bearer", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  // Anon key is not the LOVABLE_API_KEY → 401
  assertEquals(res.status, 401);
});

Deno.test("preview-email: rejects empty Bearer token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer ",
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assertEquals(res.status, 401);
});

Deno.test("preview-email: rejects Basic auth scheme", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic dXNlcjpwYXNz",
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assertEquals(res.status, 401);
});

// ── GET method (should still work for preview) ──

Deno.test("preview-email: GET without auth returns 401", async () => {
  const res = await fetch(BASE, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});
