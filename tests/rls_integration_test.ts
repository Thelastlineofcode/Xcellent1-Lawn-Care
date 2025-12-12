import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { testFixture } from "./support/fixtures/test-fixture.ts";
import { databaseTest } from "./test-config.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

databaseTest("RLS integration - owners and crew access", async () => {
  await testFixture.connect();

  // Create test accounts
  const ownerA = await testFixture.createTestUser("owner");
  const ownerB = await testFixture.createTestUser("owner");
  const crew = await testFixture.createTestUser("crew");

  // Create a client owned by ownerA
  const clientA = await testFixture.createTestClientForOwner(ownerA.id!);

  // Create a job for clientA assigned to crew
  const jobA = await testFixture.createTestJob(clientA.id, {
    crew_id: crew.id,
  });

  // Connect directly to the DB for RLS validation using request.jwt.claims.sub
  const DATABASE_URL = Deno.env.get("DATABASE_URL")!;
  const db = new Client(DATABASE_URL);
  await db.connect();

  // OwnerB should NOT see ownerA's jobs
  await db.queryObject("BEGIN");
  await db.queryObject("SET LOCAL request.jwt.claims.sub = $1", [ownerB.id]);
  const resB = await db.queryObject(
    `SELECT id FROM jobs WHERE client_id = $1`,
    [clientA.id],
  );
  await db.queryObject("COMMIT");
  assertEquals(resB.rows.length, 0);

  // OwnerA should see the job
  await db.queryObject("BEGIN");
  await db.queryObject("SET LOCAL request.jwt.claims.sub = $1", [ownerA.id]);
  const resA = await db.queryObject(
    `SELECT id FROM jobs WHERE client_id = $1`,
    [clientA.id],
  );
  await db.queryObject("COMMIT");
  assertEquals(resA.rows.length > 0, true);

  // Crew should only see assigned jobs when crew_id matches
  await db.queryObject("BEGIN");
  await db.queryObject("SET LOCAL request.jwt.claims.sub = $1", [crew.id]);
  const resCrew = await db.queryObject(
    `SELECT id FROM jobs WHERE crew_id = $1`,
    [crew.id],
  );
  await db.queryObject("COMMIT");
  assertEquals(resCrew.rows.length > 0, true);

  // Cleanup
  await db.end();
  await testFixture.cleanup();
  await testFixture.disconnect();
});
