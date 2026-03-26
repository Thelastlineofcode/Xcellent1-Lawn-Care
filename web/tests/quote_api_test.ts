// QA scaffold: Quote API and service area validation tests
// Run with: deno test --allow-net web/tests/quote_api_test.ts

import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const API_URL = "http://localhost:8000/api/v1/quotes/estimate";

Deno.test(
  "Quote API: valid River Parishes address returns estimate",
  async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "123 Main St, LaPlace, LA",
        lawn_size: 2500,
        service_type: "weekly",
      }),
    });
    const json = await res.json();
    assertEquals(res.status, 200);
    assertEquals(json.ok, true);
    // Optionally: check price_low, price_high
  },
);

Deno.test("Quote API: outside River Parishes returns error", async () => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: "123 Canal St, New Orleans, LA",
      lawn_size: 2500,
      service_type: "weekly",
    }),
  });
  const json = await res.json();
  assertEquals(res.status, 400);
  assertEquals(json.ok, false);
  // Optionally: check error message
});

Deno.test("Quote API: missing fields returns error", async () => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: "",
      lawn_size: 0,
      service_type: "",
    }),
  });
  const json = await res.json();
  assertEquals(res.status, 400);
  assertEquals(json.ok, false);
});
