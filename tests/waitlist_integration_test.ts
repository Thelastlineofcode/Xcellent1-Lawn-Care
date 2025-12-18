import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { serverTest } from "./test-config.ts";
import { testFixture } from "./support/fixtures/test-fixture.ts";

serverTest("Waitlist submission returns 201 and created id", async () => {
  const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";
  const uniqueId = Date.now();
  const res = await fetch(`${BASE_URL}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Waitlist",
      phone: "555-0123",
      email: `waitlist-${uniqueId}@example.com`,
      property_address: "123 Main St",
      service: "weekly",
    }),
  });
  const json = await res.json();
  assertEquals(res.status, 201);
  assertEquals(json.ok, true);
  if (!json.id) throw new Error("No id returned from waitlist API");
  testFixture.trackWaitlist(json.id);
});
