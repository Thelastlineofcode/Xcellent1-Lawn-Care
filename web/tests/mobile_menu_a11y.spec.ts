import { test, expect } from "@playwright/test";

test.describe("Mobile Menu Accessibility", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("toggles aria-expanded attribute on mobile menu button click", async ({ page }) => {
    await page.goto("http://127.0.0.1:8000/home.html");

    const menuBtn = page.locator("#mobile-menu-btn");
    await expect(menuBtn).toBeVisible();

    // Initial state check
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    // Click to open
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    // Click to close
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });
});
