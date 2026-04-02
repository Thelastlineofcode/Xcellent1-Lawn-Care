// Minimal acceptance test to validate migrations and schema existence
import { assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";

Deno.test("DB migrations exist and include core tables", async () => {
  const migrationPath = "./db/migrations/2025-12-10-0001-initial-schema.sql";
  const txt = await Deno.readTextFile(migrationPath);

  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS users"),
    "users table not found in migration",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS clients"),
    "clients table not found in migration",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS jobs"),
    "jobs table not found in migration",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS invoices"),
    "invoices table not found in migration",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS outbox_events"),
    "outbox_events table not found in migration",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS owner_invitations"),
    "owner_invitations table not found in migration",
  );
});

Deno.test("Primary schema includes webapp platform tables", async () => {
  const schemaPath = "./db/schema.sql";
  const txt = await Deno.readTextFile(schemaPath);

  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS worker_applications"),
    "worker_applications table not found in db/schema.sql",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS performance_scores"),
    "performance_scores table not found in db/schema.sql",
  );
  assert(
    txt.includes("CREATE TABLE IF NOT EXISTS notifications_log"),
    "notifications_log table not found in db/schema.sql",
  );
});
