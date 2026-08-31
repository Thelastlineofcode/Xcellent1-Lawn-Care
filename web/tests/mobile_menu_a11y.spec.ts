import { test, expect } from "@playwright/test";

test.describe("Mobile Menu Accessibility", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const pages = [
    "/home.html",
    "/index.html",
    "/about.html",
    "/contact.html",
    "/services.html",
  ];

  for (const pagePath of pages) {
    test(`toggles aria-expanded on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const btn = page.locator(".mobile-menu-btn");
      const nav = page.locator("#navbar-links");

      await expect(btn).toHaveAttribute("aria-expanded", "false");
      await expect(btn).toHaveAttribute("aria-controls", "navbar-links");

      await btn.click();
      await expect(btn).toHaveAttribute("aria-expanded", "true");
      await expect(nav).toHaveClass(/active/);

      await btn.click();
      await expect(btn).toHaveAttribute("aria-expanded", "false");
      await expect(nav).not.toHaveClass(/active/);
    });
  }
});
