// Authentication and Authorization Tests
// Run with: deno test --allow-net --allow-env tests/auth_test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";

Deno.test("Health endpoint returns OK", async () => {
  const res = await fetch(`${BASE_URL}/health`);
  const json = await res.json();

  assertEquals(res.status, 200);
  assertEquals(json.ok, true);
  assertExists(json.supabase);
});

Deno.test("Config.js endpoint returns Supabase credentials", async () => {
  const res = await fetch(`${BASE_URL}/config.js`);
  const text = await res.text();

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/javascript");
  assertEquals(text.includes("window.__ENV"), true);
  assertEquals(text.includes("NEXT_PUBLIC_SUPABASE_URL"), true);
  assertEquals(text.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), true);
});

Deno.test("Owner invitation validation - invalid token returns 404", async () => {
  const res = await fetch(`${BASE_URL}/api/owner/invite/invalid-token-123`);
  const json = await res.json();

  assertEquals(res.status, 404);
  assertEquals(json.ok, false);
});

Deno.test("Owner invitation validation - requires valid format", async () => {
  const res = await fetch(`${BASE_URL}/api/owner/invite/`);
  const json = await res.json();

  assertEquals(res.status, 404);
  assertEquals(json.ok, false);
});

Deno.test("Protected endpoint requires authentication", async () => {
  const res = await fetch(`${BASE_URL}/api/v1/quotes/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: "123 Main St, LaPlace, LA",
      lawn_size: 2500,
      service_type: "weekly",
    }),
  });

  await res.text(); // Consume response body
  // Should return 401 Unauthorized without proper auth
  assertEquals(res.status, 401);
});

Deno.test("Static files are served with no-cache headers", async () => {
  const res = await fetch(`${BASE_URL}/static/login.html`);
  await res.text(); // Consume response body

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("cache-control"), "no-cache, no-store, must-revalidate");
  assertEquals(res.headers.get("pragma"), "no-cache");
  assertEquals(res.headers.get("expires"), "0");
});

Deno.test("CORS headers are present", async () => {
  const res = await fetch(`${BASE_URL}/health`);
  await res.text(); // Consume response body

  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assertExists(res.headers.get("access-control-allow-methods"));
  assertExists(res.headers.get("access-control-allow-headers"));
});

Deno.test("Root path redirects to home", async () => {
  const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
  await res.text(); // Consume response body

  assertEquals(res.status, 302);
  const location = res.headers.get("location");
  assertEquals(location?.includes("/static/home.html"), true);
});
