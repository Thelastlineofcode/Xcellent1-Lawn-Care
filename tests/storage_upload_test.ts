import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { testFixture } from "./support/fixtures/test-fixture.ts";
import { databaseTest } from "./test-config.ts";
import {
  createAuthHeaders,
  generateTestToken,
} from "./support/helpers/auth-helper.ts";

databaseTest(
  "Storage upload target: returns storagePath and optional publicUrl",
  async () => {
    await testFixture.connect();

    // Create owner and crew and client and job
    const owner = await testFixture.createTestUser("owner");
    const crew = await testFixture.createTestUser("crew");
    const client = await testFixture.createTestClientForOwner(owner.id!);
    const job = await testFixture.createTestJob(client.id!);

    // Generate a test token for crew
    const token = (await generateTestToken("crew", crew.id!)).token;
    const headers = createAuthHeaders(token);

    const res = await fetch(
      `${
        Deno.env.get("TEST_BASE_URL") || "http://localhost:8000"
      }/api/jobs/${job.id}/photo/upload-target`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: "image/jpeg", type: "after" }),
      },
    );

    const json = await res.json();
    assertEquals(res.status, 200);
    assertEquals(json.ok, true);
    assertExists(json.storagePath);
    // If Supabase is configured, publicUrl should exist
    if (json.publicUrl) assertExists(json.publicUrl);

    await testFixture.cleanup();
    await testFixture.disconnect();
  },
);
