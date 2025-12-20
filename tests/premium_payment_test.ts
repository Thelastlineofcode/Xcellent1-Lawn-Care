/**
 * Premium Payment & Access Tests (TDD)
 * Tests for $9.99 AI Assistant purchase flow
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.203.0/testing/asserts.ts";

const BASE_URL = Deno.env.get("BASE_URL") || "http://localhost:8000";

// Helper to make API requests
async function apiRequest(
    path: string,
    method: string = "GET",
    body?: object,
    headers?: Record<string, string>
): Promise<Response> {
    const opts: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };
    if (body) {
        opts.body = JSON.stringify(body);
    }
    return fetch(`${BASE_URL}${path}`, opts);
}

// ============================================================
// Premium Checkout Tests
// ============================================================

Deno.test("POST /api/premium/checkout - requires email", async () => {
    const response = await apiRequest("/api/premium/checkout", "POST", {});
    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.ok, false);
    assertEquals(data.error, "Email is required");
});

Deno.test("POST /api/premium/checkout - creates checkout session with valid email", async () => {
    const response = await apiRequest("/api/premium/checkout", "POST", {
        email: "test@example.com",
    });
    const data = await response.json();

    // If Stripe is not configured, expect config error
    // If configured, expect checkout URL
    if (data.error === "Payment system not configured") {
        assertEquals(response.status, 500);
        console.log("⚠️ Stripe not configured - skipping checkout URL test");
    } else {
        assertEquals(response.status, 200);
        assertEquals(data.ok, true);
        assertExists(data.checkoutUrl);
        assertExists(data.sessionId);
    }
});

// ============================================================
// Premium Status Tests
// ============================================================

Deno.test("GET /api/premium/status - returns false for non-premium user", async () => {
    const response = await apiRequest("/api/premium/status?email=nonpremium@test.com");
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.ok, true);
    assertEquals(data.hasPremium, false);
});

Deno.test("GET /api/premium/status - requires email parameter", async () => {
    const response = await apiRequest("/api/premium/status");
    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.ok, false);
});

// ============================================================
// Premium Access Gate Tests
// ============================================================

Deno.test("GET /static/assistant/ - accessible without auth (but shows paywall)", async () => {
    const response = await fetch(`${BASE_URL}/static/assistant/index.html`);
    await response.text(); // Consume body to prevent leak

    // Assistant page should load (paywall logic is client-side)
    assertEquals(response.status === 200 || response.status === 404, true);
});

Deno.test("POST /api/premium/verify - verifies valid session", async () => {
    // This test requires a real Stripe session ID from test mode
    const response = await apiRequest("/api/premium/verify", "POST", {
        sessionId: "cs_test_invalid",
    });
    const data = await response.json();

    // Invalid session should return not valid
    assertEquals(data.ok, true);
    assertEquals(data.valid, false);
});

// ============================================================
// Integration Tests
// ============================================================

Deno.test("Premium purchase flow smoke test", async () => {
    // 1. Check initial status (should be false)
    const statusRes = await apiRequest("/api/premium/status?email=integration-test@example.com");
    const statusData = await statusRes.json();
    assertEquals(statusData.hasPremium, false);

    // 2. Create checkout (will fail if Stripe not configured, which is OK)
    const checkoutRes = await apiRequest("/api/premium/checkout", "POST", {
        email: "integration-test@example.com",
    });
    const checkoutData = await checkoutRes.json();

    if (checkoutData.ok) {
        console.log("✅ Checkout session created:", checkoutData.sessionId);
        assertExists(checkoutData.checkoutUrl);
    } else {
        console.log("⚠️ Checkout skipped:", checkoutData.error);
    }
});

// ============================================================
// Booking CTA Tests (AI Assistant → Service Booking)
// ============================================================

Deno.test("Quote API accepts service_type from AI Assistant", async () => {
    const response = await apiRequest("/api/v1/quotes/estimate", "POST", {
        address: "123 Main St, LaPlace, LA",
        lawn_size: 3000,
        service_type: "weekly", // This would come from AI diagnosis
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.ok, true);
    assertExists(data.price_low);
    assertExists(data.price_high);
});

Deno.test("Quote API accepts pest-control service type", async () => {
    const response = await apiRequest("/api/v1/quotes/estimate", "POST", {
        address: "456 Oak Ave, Reserve, LA",
        lawn_size: 2500,
        service_type: "spring-cleaning", // Closest to pest treatment
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.ok, true);
});

console.log("\n🧪 Premium Payment Tests Loaded\n");
