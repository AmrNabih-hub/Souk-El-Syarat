/**
 * E2E Test: Protected Routes
 * Tests that routes are properly protected based on user role
 */

import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access customer dashboard
    await page.goto('/customer/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing admin dashboard without auth', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing vendor dashboard without auth', async ({ page }) => {
    await page.goto('/vendor/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing sell-your-car without auth', async ({ page }) => {
    await page.goto('/sell-your-car');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing vendor apply without auth', async ({ page }) => {
    await page.goto('/vendor/apply');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});
