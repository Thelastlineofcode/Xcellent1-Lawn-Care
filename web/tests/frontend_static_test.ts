import { assert } from "https://deno.land/std@0.201.0/testing/asserts.ts";

Deno.test("index.html contains lead form", async () => {
  const txt = await Deno.readTextFile(new URL('../static/index.html', import.meta.url).pathname);
  assert(txt.includes('id="lead-form"'));
  assert(txt.includes('id="name"'));
  assert(txt.includes('id="phone"'));
});

Deno.test("dashboard.html contains upload form", async () => {
  const txt = await Deno.readTextFile(new URL('../static/dashboard.html', import.meta.url).pathname);
  assert(txt.includes('id="upload-form"'));
  assert(txt.includes('id="photo-file"'));
  assert(txt.includes('id="jobId"'));
});
