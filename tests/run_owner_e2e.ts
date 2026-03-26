
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";

// Load env vars
await load({ envPath: ".env.local", examplePath: null, export: true });

const PORT = 8004;
const BASE_URL = `http://localhost:${PORT}`;

// Ensure DB URL uses port 6543
let dbUrl = Deno.env.get("DATABASE_URL") || "";
if (dbUrl.includes("5432")) {
    console.log("Switching DB port 5432 -> 6543 for E2E runner...");
    dbUrl = dbUrl.replace("5432", "6543");
}

async function waitForServer() {
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch(`${BASE_URL}/health`);
            if (res.ok) return;
        } catch { }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Server failed to start");
}

console.log("Starting server for E2E tests...");

const server = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-net", "--allow-read", "--allow-env", "server.ts"],
    env: {
        "PORT": String(PORT),
        "APP_ENV": "development",
        "DATABASE_URL": dbUrl,
    },
    stdout: "inherit",
    stderr: "inherit",
}).spawn();

try {
    await waitForServer();
    console.log(`Server running at ${BASE_URL}`);

    console.log("Running Owner E2E tests...");

    // Run the actual test file
    const testCmd = new Deno.Command(Deno.execPath(), {
        args: [
            "test",
            "--allow-net",
            "--allow-read",
            "--allow-env",
            "tests/owner_e2e_test.ts"
        ],
        env: {
            "TEST_BASE_URL": BASE_URL,
            // Pass through other env vars already loaded needed by the test
        },
        stdout: "inherit",
        stderr: "inherit",
    });

    const status = await testCmd.spawn().status;

    if (!status.success) {
        console.error("E2E Tests FAILED");
        Deno.exit(1);
    } else {
        console.log("E2E Tests PASSED");
    }

} catch (err) {
    console.error("Runner failed:", err);
    Deno.exit(1);
} finally {
    console.log("Stopping server...");
    server.kill();
    await server.status;
}
