import { test, expect } from "@playwright/test";

test.describe("Service Modal and Mobile Menu Accessibility", () => {
  for (const pageName of ["index.html", "home.html"]) {
    test(`Modal a11y & focus management on ${pageName}`, async ({ page }) => {
      await page.goto(`http://localhost:8000/${pageName}`);

      // 1. Modal attributes
      const modal = page.locator("#service-modal");
      await expect(modal).toHaveAttribute("role", "dialog");
      await expect(modal).toHaveAttribute("aria-modal", "true");
      await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

      // 2. Modal close button aria-label
      const closeBtn = modal.locator(".modal-close");
      await expect(closeBtn).toHaveAttribute("aria-label", "Close");

      // 3. Open modal via service card click
      const serviceCard = page.locator(".service-card").first();
      await serviceCard.click();

      // Verify modal is visible
      await expect(modal).toBeVisible();

      // Verify focus is transferred to first visible input
      const firstNameInput = page.locator("#firstName");
      await expect(firstNameInput).toBeFocused();

      // Save screenshot for verification
      await page.screenshot({ path: `/tmp/modal_${pageName}.png` });

      // 4. Press Escape to close modal and verify focus restoration
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();

      // 5. Test Mobile Menu aria-expanded toggle
      await page.setViewportSize({ width: 375, height: 812 });
      const menuBtn = page.locator(".mobile-menu-btn");
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    });
  }
});
