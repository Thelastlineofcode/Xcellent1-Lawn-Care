
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

// Load env
await load({ envPath: ".env.local", examplePath: null, export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
// Prioritize new keys as per recent fix
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const API_URL = Deno.env.get("API_URL") || "https://xcellent1-lawn-care-rpneaa.fly.dev"; // Default to prod

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials");
    Deno.exit(1);
}

// 1. Create a Test Owner via Admin API (to get a valid token)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const testEmail = `job-test-${Date.now()}@example.com`;
const testPassword = "test-password-123";

console.log(`Creating test owner: ${testEmail}`);
const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
});

if (authError) {
    console.error("Failed to create auth user:", authError);
    Deno.exit(1);
}

// Create public user profile
await supabaseAdmin.from("users").insert({
    id: authUser.user.id,
    auth_user_id: authUser.user.id,
    email: testEmail,
    name: "Job Tester",
    role: "owner",
    status: "active"
});

// Sign in to get token
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
});

if (loginError) {
    console.error("Login failed:", loginError);
    Deno.exit(1);
}

const token = sessionData.session.access_token;
const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
};

console.log("✅ Authenticated");

// 2. Create a Client (Needed for Job)
// We use the already-verified fallback endpoint for this
const clientRes = await fetch(`${API_URL}/api/owner/clients`, {
    method: "POST",
    headers,
    body: JSON.stringify({
        name: "Job Client",
        email: `client-${Date.now()}@test.com`,
        property_address: "123 Job Ln",
        service_plan: "weekly"
    })
});

const clientData = await clientRes.json();
if (!clientData.ok) {
    console.error("Failed to create client:", clientData);
    Deno.exit(1);
}
const clientId = clientData.client_id;
console.log(`✅ Created Client: ${clientId}`);

// 3. Create a Job (The Endpoint to Test)
console.log("Creating Job...");
const jobRes = await fetch(`${API_URL}/api/owner/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
        client_id: clientId,
        scheduled_date: new Date().toISOString().split("T")[0],
        services: ["Mowing", "Edging"],
        notes: "Test Job"
    })
});

const jobData = await jobRes.json();
if (!jobData.ok) {
    console.error("❌ Failed to create Job:", jobData);
    // Don't exit yet, we want to see if it failed as expected
} else {
    console.log(`✅ Created Job: ${jobData.job_id}`);
}

// 4. List Jobs
console.log("Listing Jobs...");
const listRes = await fetch(`${API_URL}/api/owner/jobs`, {
    headers
});
const listData = await listRes.json();
if (!listData.ok) {
    console.error("❌ Failed to list jobs:", listData);
} else {
    const found = listData.jobs.find((j: any) => j.id === jobData.job_id);
    if (found) {
        console.log(`✅ Found new Job in list: ${found.id}`);
    } else {
        console.warn("⚠️ Job created but not found in list (Latency?)");
    }
}

// Cleanup (Optional - Delete User)
await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
console.log("Cleanup done.");
