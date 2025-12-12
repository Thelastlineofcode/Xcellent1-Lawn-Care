// Test Configuration - Following test-quality.md patterns
// Global test setup and configuration

import { testFixture } from "./support/fixtures/test-fixture.ts";

// Global test configuration
export const TEST_CONFIG = {
  BASE_URL: Deno.env.get("TEST_BASE_URL") || "http://localhost:8000",
  DATABASE_URL: Deno.env.get("DATABASE_URL"),
  SUPABASE_JWT_SECRET: Deno.env.get("SUPABASE_JWT_SECRET"),
  TEST_TIMEOUT: 30000, // 30 seconds
  RETRY_COUNT: 3,
  SLOW_TEST_THRESHOLD: 5000, // 5 seconds
};

// Global test setup
export async function setupTestEnvironment() {
  // Connect to database if available
  if (TEST_CONFIG.DATABASE_URL) {
    await testFixture.connect();
  }

  // Set up any global test state
  console.log("🧪 Test environment setup complete");
}

// Global test teardown
export async function teardownTestEnvironment() {
  // Clean up all test data
  await testFixture.cleanup();

  // Disconnect from database
  await testFixture.disconnect();

  console.log("🧹 Test environment teardown complete");
}

// Test utilities
export function getTestUrl(path: string): string {
  return `${TEST_CONFIG.BASE_URL}${path}`;
}

export function isDatabaseAvailable(): boolean {
  return !!TEST_CONFIG.DATABASE_URL;
}

export function isServerRunning(): boolean {
  return !!TEST_CONFIG.BASE_URL;
}

// Custom test wrapper for database-dependent tests
export function databaseTest(name: string, fn: () => void | Promise<void>) {
  if (!isDatabaseAvailable()) {
    Deno.test({
      name: `${name} (SKIPPED - No database connection)`,
      ignore: true,
      fn: () => {
        console.log(`⚠️  Skipping ${name} - DATABASE_URL not configured`);
      },
    });
    return;
  }

  Deno.test(name, fn);
}

// Custom test wrapper for server-dependent tests
export function serverTest(name: string, fn: () => void | Promise<void>) {
  if (!isServerRunning()) {
    Deno.test({
      name: `${name} (SKIPPED - No server connection)`,
      ignore: true,
      fn: () => {
        console.log(`⚠️  Skipping ${name} - TEST_BASE_URL not configured`);
      },
    });
    return;
  }

  Deno.test(name, fn);
}
