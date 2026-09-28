import { expect, test } from "@playwright/test";

test.describe("Mobile Menu & Modal Accessibility", () => {
  test("Mobile menu button manages aria-expanded correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/index.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("Modal close button has explicit aria-label", async ({ page }) => {
    await page.goto("/index.html");
    const closeBtn = page.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });
});
