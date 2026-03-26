
import { assertEquals, assertExists } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

const BASE_URL = "http://localhost:" + (Deno.env.get("PORT") || "8000");

// Load env for DB connection
try {
    await load({ envPath: ".env.local", examplePath: null, export: true });
} catch (e) {
    // ignore
}

const DATABASE_URL = Deno.env.get("DATABASE_URL");
let dbClient: Client | null = null;

async function setupDB() {
    if (DATABASE_URL) {
        dbClient = new Client(DATABASE_URL);
        await dbClient.connect();
        return true;
    }
    return false;
}

async function teardownDB() {
    if (dbClient) {
        await dbClient.end();
    }
}

Deno.test("E2E: Premium AI Assistant Flow", async (t) => {
    const hasDB = await setupDB();

    if (!hasDB) {
        console.log("⚠️  Skipping E2E tests requiring DB connection");
    }

    // 1. Verify Homepage CTA
    await t.step("Guest visits homepage and sees Premium CTA", async () => {
        const res = await fetch(`${BASE_URL}/static/home.html`);
        const text = await res.text();
        assertEquals(res.status, 200);
        // Check for unique strings in the new CTA section
        // Use .includes separately as HTML tags might intervene
        assertEquals(text.includes("$9"), true, "Price ($9) not found on homepage");
        assertEquals(text.includes(".99"), true, "Price (.99) not found on homepage");
        assertEquals(text.includes("AI-Powered Lawn Assistant"), true, "Feature title not found");
    });

    // 2. Checkout Flow (Initialization)
    await t.step("Guest initiates premium checkout", async () => {
        // Tests that the endpoint is reachable and validating inputs
        const res = await fetch(`${BASE_URL}/api/premium/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "e2e_guest@test.com" })
        });

        // Expect 200 (if Stripe configured) or 500 (if "Payment system not configured" in strict mode)
        // The current server implementation returns 500 with "Payment system not configured" if keys are missing
        // We assertion leniently to pass in CI/local without secrets, but verify structure.
        const data = await res.json();
        console.log("   👉 Checkout init response:", data);

        if (res.status === 200) {
            assertEquals(data.ok, true);
            assertExists(data.checkoutUrl);
        } else {
            assertEquals(data.ok, false);
            // Ensure it's a known error, not a crash
            assertEquals(
                ["Payment system not configured", "Payment session creation failed", "Payment system error"].includes(data.error),
                true,
                `Unexpected error: ${data.error}`
            );
        }
    });

    // 3. Status Check (Non-Premium)
    await t.step("Check status for non-premium user", async () => {
        if (!hasDB) return;

        // Ensure user doesn't exist or isn't premium
        // We can't easily delete from here without potentially affecting other tests,
        // so we pick a random email
        const email = `non_premium_${Date.now()}@test.com`;
        const res = await fetch(`${BASE_URL}/api/premium/status?email=${email}`);
        const data = await res.json();

        assertEquals(res.status, 200);
        assertEquals(data.hasPremium, false);
    });

    // 4. Simulate Payment Success & Check Status
    await t.step("Simulate successful payment and verify access", async () => {
        if (!hasDB) return;

        const email = `premium_user_${Date.now()}@test.com`;

        // Manually insert user with premium access (simulating webhook effect)
        // First create user if not exists (server logic usually handles this via Auth or Checkout)
        // In our DB schema, we need a user record.

        try {
            // Create user
            // Role 'client' assumed to be valid per CHECK constraint
            await dbClient!.queryObject(`
        INSERT INTO users (email, name, role, has_premium_access, premium_purchased_at)
        VALUES ($1, 'Premium E2E', 'client', true, NOW())
        ON CONFLICT (email) DO UPDATE SET has_premium_access = true
      `, [email]);

            console.log(`   ✅ Seeded premium user: ${email}`);

            // Now check status via API
            const res = await fetch(`${BASE_URL}/api/premium/status?email=${email}`);
            const data = await res.json();

            assertEquals(res.status, 200);
            assertEquals(data.hasPremium, true, "API should report true for premium user");

        } catch (e) {
            console.error("   ❌ Failed to seed premium user:", e);
            throw e;
        }
    });

    // 5. Assistant Access (The "Gate")
    // Since we are moving towards "all e2e test", we should test the access.
    // Currently, it's public (200). If we lock it, we expect 403/Redirect.
    await t.step("Access Assistant Page", async () => {
        const res = await fetch(`${BASE_URL}/static/assistant/index.html`);
        await res.text(); // Consume body to prevent leak
        assertEquals(res.status, 200, "Assistant page should be reachable (if public) or handled");

        // If we implement the gate, this test might need updating to check for redirect or 403
        // For now, asserting 200 matches current implementation.
    });

    // 6. Security/Negative Test
    await t.step("Checkout fails without email", async () => {
        const res = await fetch(`${BASE_URL}/api/premium/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}) // missing email
        });
        const data = await res.json();
        assertEquals(res.status, 400);
        assertEquals(data.error, "Email is required");
    });

    await teardownDB();
});
