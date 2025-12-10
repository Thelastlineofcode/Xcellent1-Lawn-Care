// Test Runner - Following test-quality.md patterns
// Executes tests with proper setup/teardown and reporting

import { setupTestEnvironment, teardownTestEnvironment } from "./test-config.ts";

async function runTests() {
  console.log("🚀 Starting Xcellent1 Lawn Care E2E Test Suite");
  console.log("==============================================");
  
  try {
    // Global setup
    await setupTestEnvironment();
    
    // Run the tests
    const testCommand = new Deno.Command("deno", {
      args: ["test", "--allow-all", "tests/e2e/", "tests/api_test.ts", "tests/auth_test.ts", "tests/e2e_scenarios.ts"],
      stdout: "inherit",
      stderr: "inherit",
    });
    
    const { code } = await testCommand.output();
    
    if (code === 0) {
      console.log("✅ All tests passed!");
    } else {
      console.log("❌ Some tests failed. Check output above for details.");
    }
    
    return code;
    
  } catch (error) {
    console.error("💥 Test execution failed:", error);
    return 1;
  } finally {
    // Global teardown
    await teardownTestEnvironment();
  }
}

// Run tests if this script is executed directly
if (import.meta.main) {
  const exitCode = await runTests();
  Deno.exit(exitCode);
}

export { runTests };
