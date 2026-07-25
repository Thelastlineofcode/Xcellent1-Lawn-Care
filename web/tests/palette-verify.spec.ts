import { test, expect } from '@playwright/test';

test('Verify modal accessibility on home page', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/home.html');

  // Verify mobile menu button attributes
  const mobileMenuBtn = page.locator('.mobile-menu-btn');
  await expect(mobileMenuBtn).toHaveAttribute('aria-expanded', 'false');

  // Click a service card to open modal
  const serviceCard = page.locator('.service-card').first();
  await expect(serviceCard).toHaveAttribute('tabindex', '0');
  await expect(serviceCard).toHaveAttribute('role', 'button');

  await serviceCard.click();

  // Verify modal is visible and has correct attributes
  const modal = page.locator('#service-modal');
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute('role', 'dialog');
  await expect(modal).toHaveAttribute('aria-modal', 'true');
  await expect(modal).toHaveAttribute('aria-labelledby', 'modal-service-title');

  // Verify first input is focused
  const firstNameInput = page.locator('#firstName');
  await expect(firstNameInput).toBeFocused();

  // Close modal with Escape key
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
