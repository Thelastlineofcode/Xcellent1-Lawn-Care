import { expect, test } from "@playwright/test";

test("Service modal accessibility features and keyboard focus lifecycle", async ({ page, baseURL }) => {
  // 1. Navigate to home page
  await page.goto(`${baseURL}/static/home.html`);

  // 2. Locate the first service card trigger
  const serviceCard = page.locator(".service-card").first();
  await expect(serviceCard).toBeVisible();

  // 3. Verify keyboard accessibility attributes of trigger
  await expect(serviceCard).toHaveAttribute("tabindex", "0");
  await expect(serviceCard).toHaveAttribute("role", "button");

  // 4. Focus the service card and press Enter to trigger the modal
  await serviceCard.focus();
  await page.keyboard.press("Enter");

  // 5. Verify the modal container is displayed and has correct ARIA attributes
  const modal = page.locator("#service-modal");
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute("role", "dialog");
  await expect(modal).toHaveAttribute("aria-modal", "true");
  await expect(modal).toHaveAttribute("aria-labelledby", "modal-service-title");

  // Take screenshot of the open modal
  await page.screenshot({ path: "screenshots/service_modal_accessibility.png" });

  // 6. Verify first input (#firstName) receives focus automatically
  const firstNameInput = page.locator("#firstName");
  await expect(firstNameInput).toBeFocused();

  // 7. Verify close button has explicit ARIA label
  const closeButton = page.locator(".modal-close");
  await expect(closeButton).toHaveAttribute("aria-label", "Close");

  // 8. Press Escape to close modal
  await page.keyboard.press("Escape");

  // 9. Verify modal is closed
  await expect(modal).not.toBeVisible();

  // 10. Verify focus was restored to the triggering service card
  await expect(serviceCard).toBeFocused();
});
