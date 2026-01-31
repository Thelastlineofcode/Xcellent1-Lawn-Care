/**
 * Premium Checkout API Module
 * Handles Stripe integration for $9.99 AI Assistant purchase
 */

// Stripe types (we use fetch directly to avoid npm dependencies)
interface StripeCheckoutSession {
    id: string;
    url: string;
    payment_status: string;
    customer_email: string;
}

interface PremiumCheckoutRequest {
    email: string;
    successUrl?: string;
    cancelUrl?: string;
}

interface PremiumCheckoutResponse {
    ok: boolean;
    checkoutUrl?: string;
    sessionId?: string;
    error?: string;
}

const STRIPE_API_BASE = "https://api.stripe.com/v1";

/**
 * Create Stripe Checkout Session for premium purchase
 */
export async function createPremiumCheckout(
    req: PremiumCheckoutRequest,
    stripeSecretKey: string,
    priceId: string,
    baseUrl: string
): Promise<PremiumCheckoutResponse> {
    if (!req.email) {
        return { ok: false, error: "Email is required" };
    }

    if (!stripeSecretKey || !priceId) {
        console.error("[premium] Missing Stripe configuration");
        return { ok: false, error: "Payment system not configured" };
    }

    const successUrl = req.successUrl || `${baseUrl}/static/assistant/index.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = req.cancelUrl || `${baseUrl}/static/home.html#premium`;

    try {
        const params = new URLSearchParams({
            "payment_method_types[0]": "card",
            "line_items[0][price]": priceId,
            "line_items[0][quantity]": "1",
            "mode": "payment",
            "success_url": successUrl,
            "cancel_url": cancelUrl,
            "customer_email": req.email,
            "metadata[product]": "ai_lawn_assistant",
            "metadata[price_usd]": "9.99",
        });

        const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${stripeSecretKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("[premium] Stripe error:", errorData);
            return { ok: false, error: "Payment session creation failed" };
        }

        const session: StripeCheckoutSession = await response.json();

        return {
            ok: true,
            checkoutUrl: session.url,
            sessionId: session.id,
        };
    } catch (error) {
        console.error("[premium] Checkout error:", error);
        return { ok: false, error: "Payment system error" };
    }
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyStripeWebhook(
    payload: string,
    signature: string,
    webhookSecret: string
): Promise<boolean> {
    // Stripe uses HMAC-SHA256 for webhook signatures
    // Format: t=timestamp,v1=signature
    const parts = signature.split(",");
    const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
    const sig = parts.find(p => p.startsWith("v1="))?.slice(3);

    if (!timestamp || !sig) {
        return false;
    }

    // Check timestamp is within 5 minutes
    const timestampNum = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
        console.error("[premium] Webhook timestamp too old");
        return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const payloadData = encoder.encode(signedPayload);

    try {
        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        // Convert hex signature to Uint8Array
        if (sig.length % 2 !== 0) return false;
        const sigBytes = new Uint8Array(sig.length / 2);
        for (let i = 0; i < sig.length; i += 2) {
            const byte = parseInt(sig.substring(i, i + 2), 16);
            if (isNaN(byte)) return false;
            sigBytes[i / 2] = byte;
        }

        return await crypto.subtle.verify(
            "HMAC",
            key,
            sigBytes,
            payloadData
        );
    } catch (error) {
        console.error("[premium] HMAC verification failed:", error);
        return false;
    }
}

/**
 * Retrieve checkout session to verify payment
 */
export async function verifyPremiumPurchase(
    sessionId: string,
    stripeSecretKey: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (!sessionId || !stripeSecretKey) {
        return { valid: false, error: "Missing session or configuration" };
    }

    try {
        const response = await fetch(
            `${STRIPE_API_BASE}/checkout/sessions/${sessionId}`,
            {
                headers: {
                    "Authorization": `Bearer ${stripeSecretKey}`,
                },
            }
        );

        if (!response.ok) {
            return { valid: false, error: "Session not found" };
        }

        const session = await response.json();

        if (session.payment_status === "paid") {
            return { valid: true, email: session.customer_email };
        }

        return { valid: false, error: "Payment not completed" };
    } catch (error) {
        console.error("[premium] Verification error:", error);
        return { valid: false, error: "Verification failed" };
    }
}

/**
 * Check if email has premium access
 */
export async function checkPremiumAccess(
    email: string,
    db: any
): Promise<boolean> {
    if (!email || !db) {
        return false;
    }

    try {
        const result = await db.queryObject(
            `SELECT has_premium_access FROM users WHERE email = $1`,
            [email]
        );

        return result.rows[0]?.has_premium_access || false;
    } catch (error) {
        console.error("[premium] Access check error:", error);
        return false;
    }
}

/**
 * Grant premium access after successful payment
 */
export async function grantPremiumAccess(
    email: string,
    sessionId: string,
    db: any
): Promise<boolean> {
    if (!email || !db) {
        return false;
    }

    try {
        // Update user's premium status
        await db.queryObject(
            `UPDATE users 
       SET has_premium_access = true, 
           premium_purchased_at = NOW() 
       WHERE email = $1`,
            [email]
        );

        // Record the purchase
        await db.queryObject(
            `INSERT INTO premium_purchases (email, stripe_session_id, status, completed_at)
       VALUES ($1, $2, 'completed', NOW())
       ON CONFLICT (stripe_session_id) DO UPDATE SET status = 'completed', completed_at = NOW()`,
            [email, sessionId]
        );

        console.log(`[premium] Granted access to ${email}`);
        return true;
    } catch (error) {
        console.error("[premium] Grant access error:", error);
        return false;
    }
}
