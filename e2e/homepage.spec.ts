import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Tests', () => {
  test('it should match the homepage snapshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for a stable element in the footer to ensure the page is fully rendered
    // Using a partial, unique text match to be language-independent and stable.
    await expect(page.locator('p:has-text("حقوق محفوظة")')).toBeVisible({ timeout: 20000 });

    // Take a full page screenshot and compare it to the baseline snapshot.
    // Disable animations to prevent flakiness.
    await expect(page).toHaveScreenshot('homepage.png', {
      animations: 'disabled',
      fullPage: true,
      timeout: 30000,
    });
  });
});
