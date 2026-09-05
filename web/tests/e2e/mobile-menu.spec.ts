import { test, expect } from "@playwright/test";

test.describe("Mobile Menu ARIA Accessibility", () => {
  for (const pagePath of ["/home.html", "/index.html"]) {
    test(`toggles aria-expanded attribute on mobile menu button click on ${pagePath}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`http://127.0.0.1:8000${pagePath}`);

      const toggleBtn = page.locator("#mobile-menu-toggle");
      await expect(toggleBtn).toBeVisible();
      await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
      await expect(toggleBtn).toHaveAttribute("aria-controls", "navbar-links");

      await toggleBtn.click();
      await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

      await toggleBtn.click();
      await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    });
  }
});
