
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Load environment variables
await load({ envPath: ".env.local", examplePath: null, export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    Deno.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    console.log("Connecting to Supabase via REST API...");

    const email = 'lacardiofrancis@gmail.com';
    const name = 'La Cardio Francis';
    const phone = '(504) 875-8079';
    const token = 'owner-invite-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    // 1. Check for existing invitation (any status)
    const { data: existing } = await supabase
        .from('owner_invitations')
        .select('id')
        .eq('email', email)
        .single();

    let resultData;
    let error;

    if (existing) {
        // Update existing record
        console.log(`Found existing invitation for ${email}, updating...`);
        const res = await supabase
            .from('owner_invitations')
            .update({
                invitation_token: token,
                status: 'pending',
                expires_at: expiresAt,
                name: name, // ensure name is updated if changed
                phone: phone
            })
            .eq('email', email)
            .select()
            .single();

        resultData = res.data;
        error = res.error;
    } else {
        // Insert new record
        console.log(`Creating new invitation for ${email}...`);
        const res = await supabase
            .from('owner_invitations')
            .insert([
                {
                    email,
                    name,
                    phone,
                    invitation_token: token,
                    status: 'pending',
                    expires_at: expiresAt
                }
            ])
            .select()
            .single();

        resultData = res.data;
        error = res.error;
    }

    if (error) {
        console.error("❌ Error creating/updating invitation:", error.message);
        Deno.exit(1);
    }

    const data = resultData;

    console.log("\n✅ Invitation Created Successfully!");
    console.log("---------------------------------------------------");
    console.log(`Email: ${data.email}`);
    console.log(`Name:  ${data.name}`);
    console.log(`Token: ${data.invitation_token}`);
    console.log(`Link:  http://localhost:8000/static/owner-setup.html?token=${data.invitation_token}`);
    console.log("---------------------------------------------------");
}

main();
