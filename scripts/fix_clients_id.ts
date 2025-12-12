
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
    console.log("✅ Connected to Live DB for ID Fix");

    console.log("Setting default for clients.id...");
    await client.queryArray(`
        ALTER TABLE clients 
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);

    console.log("✅ ID Default Fixed!");

} catch (e) {
    console.error("❌ Fix Failed:", e);
    Deno.exit(1);
} finally {
    await client.end();
}
