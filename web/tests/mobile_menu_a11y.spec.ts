import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('mobile menu aria-expanded toggle and modal close button aria-label', async ({ page }) => {
  await page.goto('http://localhost:8000/index.html');

  const menuBtn = page.locator('.mobile-menu-btn');
  await expect(menuBtn).toBeVisible();

  // Initially aria-expanded should be false
  await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(menuBtn).toHaveAttribute('aria-controls', 'navbar-links');

  // Click to open menu
  await menuBtn.click();
  await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

  // Click again to close menu
  await menuBtn.click();
  await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

  // Check modal close button aria-label
  const modalCloseBtn = page.locator('.modal-close');
  await expect(modalCloseBtn).toHaveAttribute('aria-label', 'Close');
});
