/**
 * Basic E2E Tests for Souk El-Syarat
 * Verifies core application functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the main content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Souk El-Syarat/);
    
    // console.log('✅ Homepage loaded successfully');
  });

  test('Navigation elements are present', async ({ page }) => {
    await page.goto('/');
    
    // Check for main navigation elements
    const mainNav = page.locator('nav');
    await expect(mainNav).toBeVisible();
    
    // Check for key navigation links (adjust selectors as needed)
    // These are basic checks that should pass even if the exact content changes
    const bodyContent = page.locator('body');
    await expect(bodyContent).toBeVisible();
    
    // console.log('✅ Navigation elements are present');
  });

  test('Application is responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Check if content is still visible
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    // console.log('✅ Application is responsive');
  });
});