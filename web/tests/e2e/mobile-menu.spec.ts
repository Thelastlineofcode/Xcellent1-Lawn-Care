import { test, expect } from "@playwright/test";

test.describe("Mobile Menu Accessibility", () => {
  test("toggle mobile menu updates aria-expanded attribute", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    const navLinks = page.locator("#navbar-links");
    await expect(navLinks).toHaveClass(/active/);

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });
});
