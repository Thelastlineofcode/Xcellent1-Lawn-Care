import { defineConfig } from "@playwright/test";

const getBaseURL = () => {
  if (typeof Deno !== "undefined") {
    return Deno.env.get("TEST_BASE_URL") || "http://127.0.0.1:8000";
  }
  return process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
};

export default defineConfig({
  use: {
    baseURL: getBaseURL(),
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  testDir: "./",
});
