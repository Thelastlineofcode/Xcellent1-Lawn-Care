import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildWaitlistConfirmationEmail } from "../email-service.ts";

Deno.test("buildWaitlistConfirmationEmail includes name and plan", () => {
  const html = buildWaitlistConfirmationEmail("Jordan", "biweekly");

  assertStringIncludes(html, "Jordan");
  assertStringIncludes(html, "biweekly");
  assertStringIncludes(html, "waitlist");
  assert(html.includes("Xcellent1 Lawn Care"));
});
