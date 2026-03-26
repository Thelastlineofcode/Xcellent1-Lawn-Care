// API Endpoint Tests
// Run with: deno test --allow-net --allow-env tests/api_test.ts

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";

const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";

// Quote API Tests
Deno.test("Quote API - valid River Parishes address", async () => {
  const res = await fetch(`${BASE_URL}/api/v1/quotes/estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: "123 Main St, LaPlace, LA",
      lawn_size: 2500,
      service_type: "weekly",
    }),
  });

  const json = await res.json();
  assertEquals(res.status, 200);
  assertEquals(json.ok, true);
});

Deno.test("Quote API - missing required fields", async () => {
  const res = await fetch(`${BASE_URL}/api/v1/quotes/estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: "",
      lawn_size: 0,
    }),
  });

  const json = await res.json();
  assertEquals(res.status, 400);
});

Deno.test("Quote API - invalid service type", async () => {
  // Note: Current implementation defaults strictly to known types,
  // but let's check what it does for invalid.
  // Actually the server implementation doesn't validate service type strictly against a list
  // other than for pricing. It just defaults to base price 50 if unknown?
  // Checking code: lines 214+. "let base = 50;". So it will returning 200 with base price.
  // Wait, line 170: "if (!address || !lawnSize || !serviceType) return 400"
  // So as long as service type is present string, it proceeds.
  // So this test should expect 200 unless we add validation.

  const res = await fetch(`${BASE_URL}/api/v1/quotes/estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: "123 Main St, LaPlace, LA",
      lawn_size: 2500,
      service_type: "invalid-type",
    }),
  });

  const json = await res.json();
  // Based on current server logic, it will default to base price and return 200
  assertEquals(res.status, 200);
  assertEquals(json.ok, true);
});

// Static File Tests
Deno.test("Home page loads successfully", async () => {
  const res = await fetch(`${BASE_URL}/static/home.html`);
  const text = await res.text();

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type")?.includes("text/html"), true);
  assertEquals(text.includes("XCELLENT1"), true);
  assertEquals(text.includes("LAWN CARE"), true);
});

Deno.test("Login page loads successfully", async () => {
  const res = await fetch(`${BASE_URL}/static/login.html`);
  const text = await res.text();

  assertEquals(res.status, 200);
  assertEquals(text.includes("Sign in"), true);
  assertEquals(text.includes("Supabase"), true);
});

Deno.test("Owner dashboard loads", async () => {
  const res = await fetch(`${BASE_URL}/static/owner.html`);
  const text = await res.text();

  assertEquals(res.status, 200);
  assertEquals(text.includes("Business Dashboard"), true);
  assertEquals(text.includes("payment-accounts.html"), true); // Verify recent update
});

Deno.test("Owner setup page loads", async () => {
  const res = await fetch(`${BASE_URL}/static/owner-setup.html`);
  const text = await res.text();

  assertEquals(res.status, 200);
  assertEquals(text.includes("Complete Your Setup"), true);
  assertEquals(text.includes("/api/owner/invite"), true);
});

Deno.test("Payment accounts page loads", async () => {
  const res = await fetch(`${BASE_URL}/static/payment-accounts.html`);
  const text = await res.text();

  assertEquals(res.status, 200);
  assertEquals(text.includes("Payment Accounts"), true);
});

// Error Handling Tests
Deno.test("Non-existent route returns 404", async () => {
  const res = await fetch(`${BASE_URL}/nonexistent-page-12345`);
  const json = await res.json();

  assertEquals(res.status, 404);
  assertEquals(json.ok, false);
  assertEquals(json.error, "Not found");
});

Deno.test("Invalid JSON in POST returns error", async () => {
  const res = await fetch(`${BASE_URL}/api/v1/quotes/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "invalid-json{",
  });

  await res.text(); // Consume response body
  // Should fail at JSON parsing or auth
  assertEquals([400, 401, 500].includes(res.status), true);
});

// OPTIONS (CORS Preflight) Tests
Deno.test("OPTIONS request returns CORS headers", async () => {
  const res = await fetch(`${BASE_URL}/api/v1/quotes/estimate`, {
    method: "OPTIONS",
  });

  await res.text(); // Consume response body
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assertExists(res.headers.get("access-control-allow-methods"));
  assertExists(res.headers.get("access-control-allow-headers"));
});
