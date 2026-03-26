
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
    console.log("✅ Connected to Live DB for Waitlist Address Fix");

    console.log("Adding address detailed columns to waitlist...");
    await client.queryArray(`
        ALTER TABLE waitlist 
        ADD COLUMN IF NOT EXISTS property_city TEXT,
        ADD COLUMN IF NOT EXISTS property_state TEXT,
        ADD COLUMN IF NOT EXISTS property_zip TEXT;
    `);

    console.log("✅ Waitlist Schema Fixed!");

} catch (e) {
    console.error("❌ Fix Failed:", e);
    Deno.exit(1);
} finally {
    await client.end();
}
