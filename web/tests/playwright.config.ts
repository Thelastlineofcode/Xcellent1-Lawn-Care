import { defineConfig } from "@playwright/test";

const baseURL = typeof Deno !== "undefined" ? Deno.env.get("TEST_BASE_URL") : process.env.TEST_BASE_URL;

export default defineConfig({
  use: {
    baseURL: baseURL || "http://127.0.0.1:8000",
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  testDir: "./",
});
