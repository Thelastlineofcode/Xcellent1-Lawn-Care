
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
    console.log("✅ Connected to Live DB");

    const tables = ["clients", "customers", "users", "waitlist", "waitlist_items"];

    for (const table of tables) {
        const res = await client.queryObject(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
        `);
        if (res.rows.length > 0) {
            console.log(`\nTable '${table}':`);
            console.table(res.rows);
        } else {
            console.log(`\nTable '${table}' NOT FOUND.`);
        }
    }

} catch (e) {
    console.error(e);
} finally {
    await client.end();
}
