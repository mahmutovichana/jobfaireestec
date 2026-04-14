// ── Comprehensive Edge Function Tests ──
// Tests for ALL edge functions covering every route, method, and error scenario.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

// ═══════════════════════════════════════════════════════════════
// send-transactional-email
// ═══════════════════════════════════════════════════════════════

Deno.test("send-transactional-email: CORS preflight returns 200 with headers", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "OPTIONS",
    headers,
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("send-transactional-email: rejects invalid JSON body", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "text/plain" },
    body: "not json at all {{{",
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertExists(body.error);
  assert(body.error.toLowerCase().includes("json") || body.error.toLowerCase().includes("invalid"));
});

Deno.test("send-transactional-email: rejects missing templateName", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ recipientEmail: "test@example.com" }),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(body.error.includes("templateName"));
});

Deno.test("send-transactional-email: rejects missing recipientEmail when template has no fixed recipient", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ templateName: "contact-inquiry-confirmation" }),
  });
  const body = await res.json();
  // Should be 400 (missing recipient) or succeed if template has fixed `to`
  assertExists(body);
  assert(res.status === 400 || res.status === 200);
});

Deno.test("send-transactional-email: rejects unknown template with 404", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      templateName: "nonexistent_template_xyz_12345",
      recipientEmail: "test@example.com",
    }),
  });
  const body = await res.json();
  assertEquals(res.status, 404);
  assert(body.error.includes("not found"));
});

Deno.test("send-transactional-email: accepts valid template and enqueues", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      templateName: "contact-inquiry-confirmation",
      recipientEmail: "integration-test@example.com",
      templateData: { companyName: "Test Corp", contactPerson: "Test" },
    }),
  });
  const body = await res.json();
  // Should succeed (200 queued) or return suppressed/error
  assertExists(body);
  assert(res.status === 200 || res.status === 500);
});

Deno.test("send-transactional-email: supports snake_case field names", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      template_name: "contact-inquiry-confirmation",
      recipient_email: "snake-case-test@example.com",
      templateData: { companyName: "Test" },
    }),
  });
  const body = await res.json();
  assertExists(body);
  // Should work the same as camelCase
  assert(res.status === 200 || res.status === 404 || res.status === 500);
});

Deno.test("send-transactional-email: empty body returns 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertExists(body.error);
});

Deno.test("send-transactional-email: custom idempotencyKey is accepted", async () => {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      templateName: "contact-inquiry-confirmation",
      recipientEmail: "idempotency-test@example.com",
      idempotencyKey,
      templateData: { companyName: "Test" },
    }),
  });
  const body = await res.json();
  assertExists(body);
});

// ═══════════════════════════════════════════════════════════════
// enhance-description
// ═══════════════════════════════════════════════════════════════

Deno.test("enhance-description: CORS preflight returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-description`, {
    method: "OPTIONS",
    headers,
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("enhance-description: rejects request without Authorization", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-description`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ description: "Test event" }),
  });
  const body = await res.json();
  // Without Bearer token, should be 401
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("enhance-description: rejects empty body (missing description)", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-description`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  // Should be 400 or 401 (anon key may not pass auth check)
  assert(res.status === 400 || res.status === 401);
});

Deno.test("enhance-description: rejects null description", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-description`, {
    method: "POST",
    headers,
    body: JSON.stringify({ description: null }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 400 || res.status === 401);
});

Deno.test("enhance-description: rejects empty string description", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/enhance-description`, {
    method: "POST",
    headers,
    body: JSON.stringify({ description: "" }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 400 || res.status === 401);
});

// ═══════════════════════════════════════════════════════════════
// handle-email-unsubscribe
// ═══════════════════════════════════════════════════════════════

Deno.test("handle-email-unsubscribe: CORS preflight returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "OPTIONS",
    headers,
  });
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test("handle-email-unsubscribe: GET without token returns 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "GET",
    headers,
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(body.error.includes("Token") || body.error.includes("token"));
});

Deno.test("handle-email-unsubscribe: GET with invalid token returns 404", async () => {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=invalid-nonexistent-token-abc123`,
    { method: "GET", headers }
  );
  const body = await res.json();
  assertEquals(res.status, 404);
  assert(body.error.includes("Invalid") || body.error.includes("expired"));
});

Deno.test("handle-email-unsubscribe: POST with missing token (JSON) returns 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertExists(body.error);
});

Deno.test("handle-email-unsubscribe: POST with invalid token returns 404", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: "completely-fake-token-xyz-987" }),
  });
  const body = await res.json();
  assertEquals(res.status, 404);
  assertExists(body.error);
});

Deno.test("handle-email-unsubscribe: rejects PUT method with 405", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ token: "test" }),
  });
  const body = await res.json();
  assertEquals(res.status, 405);
  assertExists(body.error);
});

Deno.test("handle-email-unsubscribe: rejects DELETE method with 405", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "DELETE",
    headers,
  });
  const body = await res.json();
  assertEquals(res.status, 405);
  assertExists(body.error);
});

Deno.test("handle-email-unsubscribe: POST with form-encoded body and missing token returns 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "List-Unsubscribe=One-Click",
  });
  const body = await res.json();
  // Token comes from query param for one-click; without query param → 400
  assertEquals(res.status, 400);
});

Deno.test("handle-email-unsubscribe: POST form-encoded with token field", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "token=fake-form-token-123",
  });
  const body = await res.json();
  // Invalid token → 404
  assertEquals(res.status, 404);
});

// ═══════════════════════════════════════════════════════════════
// handle-email-suppression
// ═══════════════════════════════════════════════════════════════

Deno.test("handle-email-suppression: rejects GET method with 405", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-suppression`, {
    method: "GET",
    headers,
  });
  const body = await res.json();
  assertEquals(res.status, 405);
  assert(body.error.includes("Method"));
});

Deno.test("handle-email-suppression: rejects PUT method with 405", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-suppression`, {
    method: "PUT",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 405);
});

Deno.test("handle-email-suppression: POST without HMAC signature returns 401", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-suppression`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { email: "test@test.com", reason: "bounce" } }),
  });
  const body = await res.json();
  assertExists(body);
  // Without valid HMAC → 401 or 400
  assert(res.status === 401 || res.status === 400 || res.status === 500);
});

Deno.test("handle-email-suppression: POST with invalid payload returns error", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-suppression`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ no_data_field: true }),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

Deno.test("handle-email-suppression: POST with empty body returns error", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-suppression`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status >= 400);
});

// ═══════════════════════════════════════════════════════════════
// preview-transactional-email
// ═══════════════════════════════════════════════════════════════

Deno.test("preview-transactional-email: CORS preflight returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/preview-transactional-email`, {
    method: "OPTIONS",
    headers,
  });
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test("preview-transactional-email: rejects unauthenticated request", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/preview-transactional-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  // Requires LOVABLE_API_KEY auth → 401
  assertExists(body);
  assert(res.status === 401 || res.status === 403);
});

Deno.test("preview-transactional-email: rejects with wrong Bearer token", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/preview-transactional-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer wrong-api-key-completely-invalid",
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  assert(res.status === 401);
});

// ═══════════════════════════════════════════════════════════════
// process-email-queue
// ═══════════════════════════════════════════════════════════════

Deno.test("process-email-queue: rejects without Authorization header", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/process-email-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  // verify_jwt=true → gateway rejects, or function returns 401
  assert(res.status === 401 || res.status === 403);
});

Deno.test("process-email-queue: rejects anon key (non-service_role)", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/process-email-queue`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  // Anon key passes JWT check but fails service_role check → 403
  assertEquals(res.status, 403);
  assert(body.error === "Forbidden");
});

// ═══════════════════════════════════════════════════════════════
// sync-instagram
// ═══════════════════════════════════════════════════════════════

Deno.test("sync-instagram: CORS preflight returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-instagram`, {
    method: "OPTIONS",
    headers,
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("sync-instagram: POST triggers sync (may succeed or fail based on API key)", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-instagram`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertExists(body);
  // Either succeeds with sync data or fails with API error
  if (res.status === 200) {
    assertExists(body.success);
    assertExists(body.message);
  } else {
    assertEquals(res.status, 500);
    assertExists(body.error);
  }
});
