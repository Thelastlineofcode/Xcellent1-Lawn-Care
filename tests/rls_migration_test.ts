// Verify presence of RLS policies in SQL migration
import { assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";

Deno.test("RLS migration contains ENABLE and CREATE POLICY statements", async () => {
  const txt = await Deno.readTextFile(
    "./db/migrations/2025-12-10-0002-rls-policies.sql",
  );
  assert(
    txt.includes("ENABLE ROW LEVEL SECURITY"),
    "RLS enable statements missing",
  );
  assert(txt.includes("CREATE POLICY"), "CREATE POLICY statements missing");
  assert(txt.includes("clients_owner_policy"), "clients_owner_policy missing");
  assert(txt.includes("jobs_crew_policy"), "jobs_crew_policy missing");
});
