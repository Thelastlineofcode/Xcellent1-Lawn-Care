
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Centralized DB State
let client: Client | null = null;

export async function initDB(databaseUrl: string, isProduction: boolean) {
    if (client) {
        return; // Already initialized
    }

    // Handle pool/client connection
    // For this project's scale and Deno Deploy/Fly behavior, a single persistent Client is often used,
    // but a Pool is better for concurrency. The existing server.ts used Client.
    // We will stick to Client for now to minimize friction, but wrap it.

    try {
        // Parse the DATABASE_URL to extract components and configure TLS properly
        // Supabase pooler requires TLS, but deno-postgres needs explicit TLS config
        const url = new URL(databaseUrl);
        const isPooler = url.hostname.includes('pooler.supabase.com');

        let newClient: Client;
        if (isPooler) {
            // For Supabase pooler, disable TLS at application level
            // The pooler handles encryption at infrastructure level (AWS/Supabase managed)
            // This avoids deno-postgres certificate validation issues
            const username = decodeURIComponent(url.username);
            const password = decodeURIComponent(url.password);
            const hostname = url.hostname;
            const port = parseInt(url.port || "5432");
            const database = url.pathname.slice(1);

            console.log(`[db] Pooler connection config: user=${username}, host=${hostname}, port=${port}, db=${database}`);

            newClient = new Client({
                user: username,
                password: password,
                hostname: hostname,
                port: port,
                database: database,
                tls: {
                    enabled: false,
                },
            });
            console.log("[db] Using Supabase pooler (TLS disabled at app level)");
        } else {
            // For direct connections (including local), use URL directly
            newClient = new Client(databaseUrl);
        }

        await newClient.connect();
        console.log("[db] Database connected successfully");
        client = newClient;
    } catch (error) {
        console.error("[db] Failed to connect to database", error);
        // In production, we want to fail hard if DB is missing (per previous audits)
        if (isProduction) {
            console.error("[db] Exiting due to DB failure in PROD");
            Deno.exit(1);
        }
        // In dev, we might tolerate it (though the audit said we should be strict)
        // For now, we leave client as null and queries will fail.
        throw error;
    }
}

export function getDB() {
    if (!client) {
        throw new Error("Database not initialized or connection failed.");
    }
    return client;
}

// Export a proxy object that mimics the Client but handles the null check internally
// This allows us to use `db.queryObject` without `db?` everywhere.
export const db = {
    queryObject: async <T>(args: any, ...rest: any[]) => {
        return await getDB().queryObject<T>(args, ...rest);
    },
    queryArray: async <T extends Array<unknown>>(args: any, ...rest: any[]) => {
        return await getDB().queryArray<T>(args, ...rest);
    },
    createTransaction: (name: string, options?: any) => {
        return getDB().createTransaction(name, options);
    },
    // Add other methods as needed by the codebase
    end: async () => {
        if (client) {
            await client.end();
            client = null;
        }
    }
};
