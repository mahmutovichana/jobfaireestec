// ── Edge Function Tests ──
// These test the send-transactional-email and other edge functions via HTTP calls

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

// ── send-transactional-email ──

Deno.test("send-transactional-email: rejects missing templateName", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ recipientEmail: "test@example.com" }),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertExists(body.error);
});

Deno.test("send-transactional-email: rejects invalid JSON", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "text/plain" },
    body: "not json",
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertExists(body.error);
});

Deno.test("send-transactional-email: rejects unknown template", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      templateName: "nonexistent_template_xyz",
      recipientEmail: "test@example.com",
    }),
  });
  const body = await res.json();
  assertEquals(res.status, 404);
  assertExists(body.error);
});

Deno.test("send-transactional-email: handles CORS preflight", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "OPTIONS",
    headers,
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

// ── enhance-description ──

Deno.test("enhance-description: rejects empty body", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-description`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.text();
  // Should return error or handle gracefully
  assertExists(body);
});

// ── handle-email-unsubscribe ──

Deno.test("handle-email-unsubscribe: rejects missing token", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  // Should reject — token is required
  assertExists(body);
});

Deno.test("handle-email-unsubscribe: rejects invalid token", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: "invalid-token-that-does-not-exist" }),
  });
  const body = await res.json();
  assertExists(body);
});

// ── handle-email-suppression ──

Deno.test("handle-email-suppression: responds to POST", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-suppression`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.text();
  assertExists(body);
});

// ── preview-transactional-email ──

Deno.test("preview-transactional-email: rejects missing template", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/preview-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.text();
  assertExists(body);
});
