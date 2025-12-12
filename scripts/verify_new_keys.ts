
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

// Load valid env
await load({ envPath: ".env.local", examplePath: null, export: true });

const url = Deno.env.get("SUPABASE_URL");
// Try the "new" keys from .env.local (handling typo)
const newAnon = Deno.env.get("SUPABASE_PUBLIASHABLE_KEY"); // Typo in env
const newService = Deno.env.get("SUPABASE_SECRET_KEY");

console.log("URL:", url);
console.log("New Anon (sb_...):", newAnon);
console.log("New Service (sb_...):", newService);

if (!url || !newAnon || !newService) {
    console.error("Missing new keys in .env.local");
    Deno.exit(1);
}

// Test Anon Client
try {
    const anonClient = createClient(url, newAnon);
    const { data, error } = await anonClient.from("owner_invitations").select("count").limit(1);
    if (error) {
        console.error("❌ Anon Client failed with new key:", error.message);
    } else {
        console.log("✅ Anon Client working with new key!");
    }
} catch (e) {
    console.error("Anon Client crashed:", e);
}

// Test Admin Client
try {
    const adminClient = createClient(url, newService);
    const { data, error } = await adminClient.from("owner_invitations").select("count").limit(1);
    if (error) {
        console.error("❌ Admin Client failed with new key:", error.message);
    } else {
        console.log("✅ Admin Client working with new key!");
    }
} catch (e) {
    console.error("Admin Client crashed:", e);
}
