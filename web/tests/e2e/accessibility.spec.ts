import { expect, test } from "@playwright/test";

test("Service Inquiry Modal has full Focus Lifecycle and accessibility attributes", async ({ page, baseURL }) => {
  // Navigate to home page
  await page.goto(`${baseURL}/home.html`);

  const modal = page.locator("#service-modal");
  const closeBtn = modal.locator(".modal-close");

  // Check initial state
  await expect(modal).not.toBeVisible();

  // Find a service card and click to open the modal
  const serviceCard = page.locator(".service-card").first();
  await serviceCard.click();

  // Verify modal is visible and has correct dialog role & aria-modal
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

  // Verify modal close button has aria-label="Close"
  await expect(closeBtn).toHaveAttribute("aria-label", "Close");

  // Verify Focus Lifecycle: first input (firstName) is focused on open
  const firstNameInput = page.locator("#firstName");
  await expect(firstNameInput).toBeFocused();

  // Verify keyboard navigation: Escape key closes the modal
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();

  // Verify focus is restored to the service card trigger
  await expect(serviceCard).toBeFocused();
});

test("Mobile Menu toggle updates aria-expanded correctly", async ({ page, baseURL }) => {
  // Set viewport to mobile size so the trigger button is visible and active
  await page.setViewportSize({ width: 375, height: 667 });

  // Navigate to home page
  await page.goto(`${baseURL}/home.html`);

  const trigger = page.locator("#mobile-menu-trigger");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  // Click the mobile menu trigger to open
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // Click the trigger again to close
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});
