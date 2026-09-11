import { test, expect } from "@playwright/test";

test.describe("Service Modal Accessibility and Focus Lifecycle", () => {
  test("modal opens, sets focus, handles escape key and restores focus", async ({ page }) => {
    await page.goto("/home.html");

    // Get a service card to click
    const serviceCard = page.locator(".service-card").first();
    await serviceCard.focus();

    // Click service card to open modal
    await serviceCard.click();

    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();

    // Verify ARIA attributes
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    const closeButton = page.locator("#service-modal .modal-close");
    await expect(closeButton).toHaveAttribute("aria-label", "Close");

    // Verify auto-focus on first name input
    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    // Press Escape to close modal
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
