// Test DB connection using Supabase Admin client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
    const { data, error } = await supabase
        .from("owner_invitations")
        .select("id,email,invitation_token,status")
        .limit(1)
        .single();
    if (error) {
        console.error("DB query error:", error);
        Deno.exit(1);
    }
    console.log("Query success:", data);
}

await test();
