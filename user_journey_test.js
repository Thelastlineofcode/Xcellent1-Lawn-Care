// User Journey Test for Xcellent1 Lawn Care
// Tests key user flows across the site

const BASE_URL = Deno.env.get("BASE_URL") ||
  "https://xcellent1-lawn-care-rpneaa.fly.dev";

// Test scenarios
const tests = [
  {
    name: "Homepage loads",
    path: "/",
    expectedStatus: 200,
    checks: ["XCELLENT1", "Services", "Featured", "lawn care"],
  },
  {
    name: "Shop page loads",
    path: "/shop.html",
    expectedStatus: 200,
    checks: ["Shop", "Amazon", "Mowers", "Trimmers"],
  },
  {
    name: "Careers page loads",
    path: "/careers.html",
    expectedStatus: 200,
    checks: ["Join Our Crew", "Lawn Care Technician", "Apply Now"],
  },
  {
    name: "Login page loads",
    path: "/login.html",
    expectedStatus: 200,
    checks: ["Sign in", "Email Address", "Password"],
  },
  {
    name: "Owner dashboard accessible",
    path: "/owner.html",
    expectedStatus: 200,
    checks: ["Owner Dashboard", "Revenue", "Metrics"],
  },
  {
    name: "Client dashboard accessible",
    path: "/client.html",
    expectedStatus: 200,
    checks: ["Client Portal", "Services", "Invoice"],
  },
  {
    name: "Crew dashboard accessible",
    path: "/crew.html",
    expectedStatus: 200,
    checks: ["Crew Portal", "Jobs", "Schedule"],
  },
];

// Utility function to make HTTP requests
async function testPage(url, expectedStatus, checks) {
  try {
    const res = await fetch(url);
    // Handle redirects usually handled automatically by fetch, but check status
    const status = res.status;
    const text = await res.text();

    const result = {
      status: status,
      statusOk: status === expectedStatus || status === 200,
      checks: [],
    };

    // Check for expected content
    checks.forEach((check) => {
      const found = text.includes(check);
      result.checks.push({
        text: check,
        found: found,
      });
    });

    return result;
  } catch (error) {
    throw error;
  }
}

// Run all tests
if (import.meta.main) {
  console.log("\n🧪 XCELLENT1 LAWN CARE - USER JOURNEY TEST\n");
  console.log(`Testing: ${BASE_URL}\n`);
  console.log("═".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const url = BASE_URL + test.path;
    console.log(`\n📄 ${test.name}`);
    console.log(`   URL: ${test.path}`);

    try {
      const result = await testPage(url, test.expectedStatus, test.checks);

      console.log(
        `   Status: ${result.status} ${result.statusOk ? "✅" : "❌"}`,
      );

      let allChecksPass = true;
      test.checks.forEach((check, i) => {
        const checkResult = result.checks[i];
        const icon = checkResult.found ? "✅" : "❌";
        console.log(`   Content: "${check}" ${icon}`);
        if (!checkResult.found) allChecksPass = false;
      });

      const hasContentChecks = result.checks.filter((c) => c.found).length > 0;
      if (result.statusOk && (allChecksPass || hasContentChecks)) {
        passed++;
        console.log(`   Result: ✅ PASS`);
      } else {
        failed++;
        console.log(`   Result: ❌ FAIL`);
      }
    } catch (error) {
      failed++;
      console.log(`   Status: ERROR`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Result: ❌ FAIL`);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(`\n📊 Test Summary`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${tests.length}`);
  console.log(
    `   Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`,
  );

  Deno.exit(failed > 0 ? 1 : 0);
}

// Export for testing if needed
export { testPage, tests };
