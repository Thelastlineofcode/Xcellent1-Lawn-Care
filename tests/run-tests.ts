// Test Runner - Following test-quality.md patterns
// Executes tests with proper setup/teardown and reporting

import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from "./test-config.ts";

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  console.log(`Waiting for server at ${url}...`);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // ignore connection error
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function runTests() {
  console.log("🚀 Starting Xcellent1 Lawn Care E2E Test Suite");
  console.log("==============================================");

  let serverProcess: Deno.ChildProcess | null = null;
  const externalUrl = Deno.env.get("BASE_URL");
  const baseUrl = externalUrl || "http://localhost:8000";

  try {
    // Global setup
    await setupTestEnvironment();

    if (externalUrl) {
      console.log(`🌍 Running against external environment: ${externalUrl}`);
      console.log("ℹ️  Skipping local server startup");
    } else {
      // 1. Start Server locally
      console.log("Starting local server...");
      const serverCommand = new Deno.Command("deno", {
        args: [
          "run",
          "--allow-net",
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "server.ts",
        ],
        stdout: "null",
        stderr: "inherit",
      });
      serverProcess = serverCommand.spawn();

      // 2. Wait for Server
      const ready = await waitForServer("http://localhost:8000/health");
      if (!ready) {
        throw new Error("Server failed to start within timeout.");
      }
      console.log("✅ Local server is up!");
    }

    // 3. Run Deno Tests
    console.log(`Running Deno tests against ${baseUrl}...`);
    const testCommand = new Deno.Command("deno", {
      args: [
        "test",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        // Run all standard test locations
        "tests/",
        "web/tests/",
        "bmad/agents/tests/",
      ],
      stdout: "inherit",
      stderr: "inherit",
      env: {
        "BASE_URL": baseUrl,
        "TEST_BASE_URL": baseUrl, // Some tests might use this
      },
    });

    const { code: testCode } = await testCommand.output();

    // 4. Run User Journey Test (Standalone Script)
    console.log("Running User Journey Test...");
    const journeyCommand = new Deno.Command("deno", {
      args: ["run", "--allow-net", "--allow-env", "user_journey_test.js"],
      stdout: "inherit",
      stderr: "inherit",
      env: { "BASE_URL": baseUrl },
    });
    const { code: journeyCode } = await journeyCommand.output();

    const finalCode = (testCode === 0 && journeyCode === 0) ? 0 : 1;

    if (finalCode === 0) {
      console.log("✅ All tests passed!");
    } else {
      console.log("❌ Some tests failed. Check output above for details.");
    }

    return finalCode;
  } catch (error) {
    console.error("💥 Test execution failed:", error);
    return 1;
  } finally {
    // Teardown
    if (serverProcess) {
      console.log("Stopping local server...");
      try {
        serverProcess.kill();
        await serverProcess.status; // Wait for exit
      } catch (e) {
        // ignore
      }
    }
    await teardownTestEnvironment();
  }
}

// Run tests if this script is executed directly
if (import.meta.main) {
  const exitCode = await runTests();
  Deno.exit(exitCode);
}

export { runTests };
