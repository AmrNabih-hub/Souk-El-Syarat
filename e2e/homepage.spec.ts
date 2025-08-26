import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Tests', () => {
  test('it should match the homepage snapshot', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for the network to be idle, a more reliable way to ensure the page has loaded
    await page.waitForLoadState('networkidle');

    // Take a screenshot and compare it to the baseline snapshot.
    // Disable animations to prevent flakiness and set a higher timeout.
    await expect(page).toHaveScreenshot('homepage.png', {
      animations: 'disabled',
      timeout: 30000,
    });
  });
});
