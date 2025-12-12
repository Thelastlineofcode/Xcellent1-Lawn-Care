
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Load environment variables
await load({ envPath: ".env.local", examplePath: null, export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("URL:", SUPABASE_URL ? "Set" : "Missing");
console.log("Service Key:", SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const token = 'owner-invite-c2e5249e-14e4-4b41-8498-a20d1946ef72';

console.log(`Checking token: ${token}`);

const { data, error } = await supabase
    .from('owner_invitations')
    .select('*')
    .eq('invitation_token', token)
    .single();

if (error) {
    console.error("Error finding token:", error);
} else {
    console.log("Found token data:", data);
}
