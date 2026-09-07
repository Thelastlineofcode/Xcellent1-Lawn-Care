import { test, expect } from "@playwright/test";

for (const pageName of ["home.html", "index.html"]) {
  test.describe(`Accessibility tests for ${pageName}`, () => {
    test("service modal dialog accessibility and focus lifecycle", async ({ page }) => {
      await page.goto(`/${pageName}`);

      const modal = page.locator("#service-modal");
      await expect(modal).toHaveAttribute("role", "dialog");
      await expect(modal).toHaveAttribute("aria-modal", "true");
      await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

      const closeBtn = modal.locator(".modal-close");
      await expect(closeBtn).toHaveAttribute("aria-label", "Close");

      // Click service card to open modal
      const serviceCard = page.locator(".service-card").first();
      await serviceCard.click();

      // Check modal is visible
      await expect(modal).toBeVisible();

      // Check focus shifted to first input
      const firstInput = page.locator("#firstName");
      await expect(firstInput).toBeFocused();

      // Press Escape key
      await page.keyboard.press("Escape");

      // Check modal closed
      await expect(modal).toBeHidden();
    });

    test("mobile menu button aria-expanded state", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`/${pageName}`);

      const menuBtn = page.locator(".mobile-menu-btn");
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    });
  });
}
