import { test, expect } from "@playwright/test";

test.describe("UX & Accessibility Features", () => {
  test("Mobile menu button toggles aria-expanded", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/home.html");

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("Modal accessibility and focus lifecycle", async ({ page }) => {
    await page.goto("/home.html");

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = modal.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // Click on first service card to open modal
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.click();

    await expect(modal).toBeVisible();

    // Verify focus moved to the first visible input inside the modal
    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    // Verify closing with Escape key
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
