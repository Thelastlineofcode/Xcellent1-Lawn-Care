
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

try {
    await load({ envPath: ".env.local", examplePath: null, export: true });
} catch (e) {
    // ignore
}

const DATABASE_URL = Deno.env.get("DATABASE_URL");
const MIGRATION_FILE = "./db/migrations/005_add_premium_access.sql";

async function runMigration() {
    if (!DATABASE_URL) {
        console.error("❌ DATABASE_URL not found");
        Deno.exit(1);
    }

    console.log("Using Database:", DATABASE_URL.replace(/:[^:@]*@/, ":***@")); // Mask password

    const client = new Client(DATABASE_URL);
    await client.connect();

    try {
        const sql = await Deno.readTextFile(MIGRATION_FILE);
        console.log(`Running migration: ${MIGRATION_FILE}`);
        await client.queryArray(sql); // Use queryArray for generic execution
        console.log("✅ Migration applied successfully");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
    }
}

if (import.meta.main) {
    await runMigration();
}
