import { generateTestToken, createAuthHeaders } from "../support/helpers/auth-helper.ts";
import { databaseTest } from "../test-config.ts";

const BASE_URL = Deno.env.get("BASE_URL") || "http://localhost:8000";

databaseTest("crew performance self-view returns ok + status", async () => {
  // This test assumes the test DB has a crew user id that exists in public.users.
  // The existing test harness already provisions users for other endpoints.
  const crewUserId = "crew-test-user";
  const { token } = await generateTestToken("crew", crewUserId);

  const res = await fetch(`${BASE_URL}/api/crew/performance`, {
    method: "GET",
    headers: createAuthHeaders(token),
  });

  if (res.status !== 200) throw new Error(`Unexpected status: ${res.status}`);

  const json = await res.json();
  if (json.ok !== true) throw new Error("Expected ok=true");
  if (typeof json.status !== "string") throw new Error("Expected status string");
});
