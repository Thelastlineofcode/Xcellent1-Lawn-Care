import { serverTest } from "../../tests/test-config.ts";
import { assert, assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

serverTest("GSAP presence check on home.html", async () => {
  const txt = await Deno.readTextFile(new URL("../../web/static/home.html", import.meta.url).pathname);
  const doc = new DOMParser().parseFromString(txt, "text/html");
  assert(doc, "home.html parsed");
  const scripts = Array.from(doc.querySelectorAll('script'));
  const hasGsapScript = scripts.some((s) => s.getAttribute('src') && s.getAttribute('src').includes('gsap'));
  assert(hasGsapScript, 'GSAP script should be included on home.html');
  // Verify animation usage
  const bodyText = doc.body.innerHTML;
  assert(bodyText.includes("gsap.from('.waitlist-form'"), "Expected gsap.from on .waitlist-form");
});
