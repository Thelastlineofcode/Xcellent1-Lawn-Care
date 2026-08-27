import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('mobile menu toggle updates aria-expanded attribute', async ({ page }) => {
  await page.goto('/home.html');
  const menuBtn = page.locator('.mobile-menu-btn');
  const navLinks = page.locator('#navbar-links');

  await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(menuBtn).toHaveAttribute('aria-controls', 'navbar-links');

  await menuBtn.click();
  await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(navLinks).toHaveClass(/active/);

  await menuBtn.click();
  await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
});

test('service modal contains proper accessibility attributes', async ({ page }) => {
  await page.goto('/home.html');
  const modal = page.locator('#service-modal');
  const closeBtn = modal.locator('.modal-close');

  await expect(modal).toHaveAttribute('role', 'dialog');
  await expect(modal).toHaveAttribute('aria-modal', 'true');
  await expect(modal).toHaveAttribute('aria-labelledby', 'modal-service-title');
  await expect(closeBtn).toHaveAttribute('aria-label', 'Close');
});
