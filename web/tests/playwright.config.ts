import { defineConfig } from "@playwright/test";

const baseURL = (typeof Deno !== "undefined" ? Deno.env.get("TEST_BASE_URL") : process.env.TEST_BASE_URL) || "http://127.0.0.1:8000";

export default defineConfig({
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  testDir: "./",
});
