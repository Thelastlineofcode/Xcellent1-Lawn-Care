import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { verifyStripeWebhook } from "../src/api/premium-checkout.ts";

const WEBHOOK_SECRET = "whsec_test_secret_12345";

async function generateSignature(payload: string, secret: string, timestamp: number): Promise<string> {
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(signedPayload);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        payloadData
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

Deno.test("verifyStripeWebhook - valid signature", async () => {
    const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateSignature(payload, WEBHOOK_SECRET, timestamp);
    const header = `t=${timestamp},v1=${signature}`;

    const isValid = await verifyStripeWebhook(payload, header, WEBHOOK_SECRET);
    assertEquals(isValid, true);
});

Deno.test("verifyStripeWebhook - invalid signature", async () => {
    const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateSignature(payload, "wrong_secret", timestamp); // Wrong secret
    const header = `t=${timestamp},v1=${signature}`;

    const isValid = await verifyStripeWebhook(payload, header, WEBHOOK_SECRET);
    assertEquals(isValid, false);
});

Deno.test("verifyStripeWebhook - expired timestamp", async () => {
    const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const signature = await generateSignature(payload, WEBHOOK_SECRET, timestamp);
    const header = `t=${timestamp},v1=${signature}`;

    const isValid = await verifyStripeWebhook(payload, header, WEBHOOK_SECRET);
    assertEquals(isValid, false);
});

Deno.test("verifyStripeWebhook - malformed header", async () => {
    const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const header = "invalid_header_format";

    const isValid = await verifyStripeWebhook(payload, header, WEBHOOK_SECRET);
    assertEquals(isValid, false);
});
