
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";
import { assert, assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";

// Load env vars
await load({ envPath: ".env.local", examplePath: null, export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const PROD_BASE_URL = "https://xcellent1lawncare.com"; // Testing against live prod

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE creds");
    Deno.exit(1);
}

// 1. Sign In (using known test account or the one we just made)
// We assume test@xcellent1.com exists or we can't easily modify prod auth without admin key.
// Actually, let's use the SERVICE_ROLE to *ensure* the user exists, just like owner_e2e_test.ts does.
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!SERVICE_ROLE_KEY) {
    console.error("Missing SERVICE_ROLE_KEY");
    Deno.exit(1);
}

async function createTestOwner() {
    console.log("Ensuring test user exists...");
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: "test@xcellent1.com",
            password: "Test123!@#",
            email_confirm: true,
            user_metadata: { name: "E2E Test Owner" }
        }),
    });
    // Ignore error if user already exists
    if (!res.ok) {
        const txt = await res.text();
        // console.log("Create user response:", txt); 
    } else {
        await res.text();
    }
}

async function signIn() {
    console.log("Signing in...");
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: "test@xcellent1.com",
            password: "Test123!@#",
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Login failed: " + JSON.stringify(data));
    return data.access_token;
}

async function run() {
    try {
        await createTestOwner();
        const token = await signIn();
        console.log("✅ Signed in");

        // 2. Create a Test Client
        console.log("Creating test client...");
        const clientRes = await fetch(`${PROD_BASE_URL}/api/owner/clients`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Invoice Test Client " + Date.now(),
                email: `inv.test.${Date.now()}@example.com`,
                phone: "555-000-0000",
                property_address: "123 Invoice Rd"
            })
        });

        const clientData = await clientRes.json();
        if (!clientData.ok) throw new Error("Create client failed: " + JSON.stringify(clientData));
        const clientId = clientData.client_id;
        console.log("✅ Created Client:", clientId);

        // 3. Create Invoice
        console.log("Creating invoice...");
        const invRes = await fetch(`${PROD_BASE_URL}/api/owner/invoices`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: clientId,
                amount: 150.00,
                description: "Test Invoice for E2E",
                due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
                status: "sent"
            })
        });
        const invData = await invRes.json();
        if (!invData.ok) throw new Error("Create invoice failed: " + JSON.stringify(invData));
        console.log("✅ Created Invoice:", invData);

        // 4. Verify Invoice in List
        console.log("Verifying invoice in list...");
        const listRes = await fetch(`${PROD_BASE_URL}/api/owner/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const listData = await listRes.json();
        const found = listData.invoices.find((i: any) => i.id === invData.invoice_id);
        if (found) {
            console.log("✅ Verified Invoice exists in list:", found.invoice_number);
        } else {
            console.error("❌ Invoice not found in list!");
            Deno.exit(1);
        }

        console.log("🎉 INVOICE TEST PASSED against Production!");

    } catch (err) {
        console.error("❌ Test Failed:", err);
        Deno.exit(1);
    }
}

await run();
