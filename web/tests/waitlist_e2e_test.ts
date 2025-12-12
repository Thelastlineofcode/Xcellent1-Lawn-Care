import { serverTest } from "../../tests/test-config.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { getTestUrl } from "../../tests/test-config.ts";

serverTest("E2E: waitlist form posts correct payload to API", async () => {
  // Load static HTML and parse DOM
  const txt = await Deno.readTextFile(
    new URL("../../web/static/home.html", import.meta.url).pathname,
  );
  const doc = new DOMParser().parseFromString(txt, "text/html");
  assert(doc, "home.html parsed");
  const form = doc.querySelector("#waitlist-form");
  assert(form, "waitlist-form exists");
  const nameInput = doc.querySelector('[name="name"]');
  const emailInput = doc.querySelector('[name="email"]');
  const serviceInput = doc.querySelector('[name="service"]');
  const phoneInput = doc.querySelector('[name="phone"]');
  const addressInput = doc.querySelector('[name="property_address"]');
  assert(
    nameInput && emailInput && serviceInput && phoneInput && addressInput,
    "all waitlist fields present",
  );

  // Construct payload as the client would
  const payload = {
    name: "E2E Test User",
    email: "e2e-waitlist@example.com",
    phone: "555-0001",
    property_address: "456 E2E Drive",
    service: "weekly",
  };

  const res = await fetch(getTestUrl("/api/waitlist"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  assertEquals(res.status, 201);
  assertEquals(json.ok, true);
  assert(json.id, "response contains id");
});
