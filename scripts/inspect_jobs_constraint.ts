
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
    console.log("✅ Connected to Live DB for Constraint Check");

    const res = await client.queryObject(`
        SELECT pg_get_constraintdef(c.oid) AS constraint_def
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE c.conname = 'jobs_status_check' AND n.nspname = 'public';
    `);

    if (res.rows.length > 0) {
        console.log("Constraint Definition:", (res.rows[0] as any).constraint_def);
    } else {
        console.log("Constraint NOT FOUND via pg_constraint.");
        // Try information_schema
        const res2 = await client.queryObject(`
            SELECT check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_name = 'jobs_status_check'
        `);
        console.log("Constraint Definition (InfoSchema):", (res2.rows[0] as any)?.check_clause);
    }

} catch (e) {
    console.error(e);
} finally {
    await client.end();
}
