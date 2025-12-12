
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

await load({ envPath: ".env.local", examplePath: null, export: true });

let dbUrl = Deno.env.get("DATABASE_URL") || "";
if (dbUrl.includes("5432")) {
    dbUrl = dbUrl.replace("5432", "6543");
}

const client = new Client(dbUrl);

try {
    await client.connect();
    console.log("✅ Connected to Live DB for Migration");

    // 1. Update clients table
    console.log("Migrating 'clients' table...");
    await client.queryArray(`
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS property_address TEXT,
        ADD COLUMN IF NOT EXISTS property_city TEXT,
        ADD COLUMN IF NOT EXISTS property_state TEXT,
        ADD COLUMN IF NOT EXISTS property_zip TEXT,
        ADD COLUMN IF NOT EXISTS service_plan TEXT;
    `);

    // 2. Create waitlist table
    console.log("Creating 'waitlist' table...");
    await client.queryArray(`
        CREATE TABLE IF NOT EXISTS waitlist (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            property_address TEXT,
            preferred_service_plan TEXT,
            notes TEXT,
            source TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);

    console.log("✅ Migration complete!");

} catch (e) {
    console.error("❌ Migration Failed:", e);
    Deno.exit(1);
} finally {
    await client.end();
}
