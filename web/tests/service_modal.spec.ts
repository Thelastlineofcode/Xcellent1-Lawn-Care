import { test, expect } from "@playwright/test";

test.describe("Service Inquiry Modal Accessibility & Focus Lifecycle", () => {
  test("Modal opens with correct ARIA attributes, focuses first input, closes on Escape, and restores focus", async ({ page }) => {
    await page.goto("/home.html");

    // Locate first service card
    const serviceCard = page.locator(".service-card").first();
    await expect(serviceCard).toBeVisible();

    // Focus and trigger service card via keyboard Enter key
    await serviceCard.focus();
    await page.keyboard.press("Enter");

    // Check modal visibility and ARIA attributes
    const modal = page.locator("#service-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

    // Check close button aria-label
    const closeBtn = modal.locator(".modal-close");
    await expect(closeBtn).toHaveAttribute("aria-label", "Close");

    // Check initial focus on first visible input (#firstName)
    const firstNameInput = page.locator("#firstName");
    await expect(firstNameInput).toBeFocused();

    // Press Escape to close modal
    await page.keyboard.press("Escape");

    // Verify modal is hidden
    await expect(modal).toBeHidden();

    // Verify focus is restored to service card
    await expect(serviceCard).toBeFocused();
  });
});
