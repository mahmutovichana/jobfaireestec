// ── sync-instagram: Comprehensive Edge Function Tests ──
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/sync-instagram`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

// ── CORS ──

Deno.test("sync-instagram: CORS preflight returns 200 with allow-origin", async () => {
  const res = await fetch(BASE, { method: "OPTIONS", headers });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

// ── POST: sync trigger ──

Deno.test("sync-instagram: POST triggers sync or returns API error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  if (res.status === 200) {
    assertExists(body.success);
    assertExists(body.message);
    assert(typeof body.total_fetched === "number");
    assert(typeof body.already_existed === "number");
  } else {
    assertEquals(res.status, 500);
    assertExists(body.error);
  }
});

// ── GET: should also work (Deno.serve handles all methods) ──

Deno.test("sync-instagram: GET triggers sync or returns API error", async () => {
  const res = await fetch(BASE, { method: "GET", headers });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 200 || res.status === 500);
});

// ── Response shape validation ──

Deno.test("sync-instagram: response has correct content-type", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  await res.json();
  const ct = res.headers.get("content-type");
  assert(ct?.includes("application/json"));
});

// ── Concurrent requests ──

Deno.test("sync-instagram: handles concurrent requests without crash", async () => {
  const promises = Array.from({ length: 3 }, () =>
    fetch(BASE, { method: "POST", headers, body: JSON.stringify({}) })
  );
  const responses = await Promise.all(promises);
  for (const res of responses) {
    const body = await res.json();
    assertExists(body);
    assert(res.status === 200 || res.status === 500);
  }
});
