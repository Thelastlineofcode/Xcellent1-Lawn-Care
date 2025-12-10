// QA Scaffold: Frontend Quote Form Tests

// Test: Quote form renders and submits
// Test: Shows error for out-of-area address
// Test: Map displays River Parishes area

// Implement with your preferred browser automation (e.g., Playwright, Cypress)
import { assert } from "https://deno.land/std@0.201.0/testing/asserts.ts";

Deno.test("index.html contains lead form", async () => {
  const txt = await Deno.readTextFile(
    decodeURIComponent(
      new URL("../static/index.html", import.meta.url).pathname
    )
  );
  assert(txt.includes('id="lead-form"'));
  assert(txt.includes('id="name"'));
  assert(txt.includes('id="phone"'));
});

Deno.test("home.html contains waitlist form", async () => {
  const txt = await Deno.readTextFile(
    decodeURIComponent(
      new URL("../static/home.html", import.meta.url).pathname
    )
  );
  assert(txt.includes('id="waitlist-form"'));
  assert(txt.includes('name="email"'));
  assert(txt.includes('name="service"'));
  assert(txt.includes('name="phone"'));
  assert(txt.includes('name="property_address"'));
});

Deno.test("dashboard.html contains upload form", async () => {
  const txt = await Deno.readTextFile(
    decodeURIComponent(
      new URL("../static/dashboard.html", import.meta.url).pathname
    )
  );
  assert(txt.includes('id="upload-form"'));
  assert(txt.includes('id="photo-file"'));
  assert(txt.includes('id="jobId"'));
});
