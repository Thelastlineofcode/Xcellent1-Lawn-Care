import { expect, test } from "@playwright/test";

test.describe("Landing page accessibility & interaction tests", () => {
  test("Mobile menu button manages aria-expanded state correctly", async ({ page, baseURL }) => {
    // Set mobile viewport so mobile menu button is visible
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseURL}/home.html`);

    const menuBtn = page.locator(".mobile-menu-btn");
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menuBtn).toHaveAttribute("aria-controls", "navbar-links");

    // Open mobile menu
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#navbar-links")).toHaveClass(/active/);

    // Close mobile menu
    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#navbar-links")).not.toHaveClass(/active/);
  });

  test("Service modal accessibility, focus capture/restoration, and Escape key dismissal", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/home.html`);

    const modal = page.locator("#service-modal");
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeBtn = modal.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // Click on the first service card to open the modal
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.scrollIntoViewIfNeeded();
    await serviceCard.click();

    // Verify modal is displayed and focus is moved to first form input
    await expect(modal).toBeVisible();
    await expect(page.locator("#firstName")).toBeFocused();

    // Dismiss modal with Escape key
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    // Verify focus is restored to the triggering service card
    await expect(serviceCard).toBeFocused();
  });
});
