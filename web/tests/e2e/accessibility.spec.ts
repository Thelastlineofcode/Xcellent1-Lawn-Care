import { expect, test } from "@playwright/test";

test("Service Modal accessibility attributes, close button aria-label, and focus lifecycle", async ({ page, baseURL }) => {
  // Go to home.html
  await page.goto(`${baseURL}/home.html`);

  // Verify mobile menu starts with aria-expanded="false"
  const mobileBtn = page.locator(".mobile-menu-btn");
  await expect(mobileBtn).toHaveAttribute("aria-expanded", "false");

  // Verify service-modal starts hidden/inactive
  const modal = page.locator("#service-modal");
  await expect(modal).not.toBeVisible();

  // Click on a service card to trigger modal opening
  const serviceCard = page.locator(".service-card").first();
  await serviceCard.click();

  // Verify modal is visible
  await expect(modal).toBeVisible();

  // Verify modal accessibility attributes
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

  // Verify modal close button has aria-label="Close"
  const closeBtn = modal.locator(".modal-close");
  await expect(closeBtn).toHaveAttribute("aria-label", "Close");

  // Verify focus was moved to first interactive element (firstName input)
  const firstNameInput = page.locator("#firstName");
  await expect(firstNameInput).toBeFocused();

  // Press Escape key and verify modal closes
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
});
