import { defineConfig } from "@playwright/test";

// Handle compatibility between Deno-based execution and Node-based execution
const getBaseUrl = () => {
  if (typeof Deno !== "undefined") {
    return Deno.env.get("TEST_BASE_URL");
  }
  return process.env.TEST_BASE_URL;
};

export default defineConfig({
  use: {
    baseURL: getBaseUrl() || "http://127.0.0.1:8000",
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  testDir: "./",
});
