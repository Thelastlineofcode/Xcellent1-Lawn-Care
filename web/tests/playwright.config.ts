import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: (typeof Deno !== "undefined" ? Deno.env.get("TEST_BASE_URL") : undefined) || "http://127.0.0.1:8000",
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  testDir: "./",
});
