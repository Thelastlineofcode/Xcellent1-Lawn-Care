import { serverTest } from "./test-config.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";

serverTest("Lead form submission returns 201 and created id", async () => {
  const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8000";
  const res = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Lead",
      phone: "555-0123",
      email: "lead@example.com",
    }),
  });
  const json = await res.json();
  assertEquals(res.status, 201);
  assertEquals(json.ok, true);
  // Response contains id
  if (json.id) {
    // pass
  } else {
    throw new Error("No id returned");
  }
});
