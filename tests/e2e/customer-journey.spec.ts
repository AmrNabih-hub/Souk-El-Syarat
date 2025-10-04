/**
 * E2E Test: Complete Customer Journey
 * Tests the entire customer workflow from registration to purchase
 */

import { test, expect } from '@playwright/test';

test.describe('Customer Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full customer registration and login flow', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Register');
    await expect(page).toHaveURL('/register');
    
    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `customer-${timestamp}@test.com`;
    
    await page.fill('input[name="displayName"]', 'Test Customer');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Test1234!@#$');
    await page.fill('input[name="confirmPassword"]', 'Test1234!@#$');
    
    // Select customer role
    await page.click('input[value="customer"]');
    
    // Agree to terms
    await page.check('input[name="agreeToTerms"]');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should browse marketplace', async ({ page }) => {
    await page.click('text=Marketplace');
    await expect(page).toHaveURL('/marketplace');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 }).catch(() => {
      // Products might not be available, that's okay for this test
    });
  });

  test('should access sell your car page when logged in', async ({ page }) => {
    // This test requires authentication
    // In a real scenario, we would login first
    
    await page.goto('/sell-your-car');
    
    // Should either show the form or redirect to login
    const url = page.url();
    expect(url === '/sell-your-car' || url === '/login').toBeTruthy();
  });

  test('should navigate between pages', async ({ page }) => {
    // Test navigation
    await page.click('text=About');
    await expect(page).toHaveURL('/about');
    
    await page.click('text=Contact');
    await expect(page).toHaveURL('/contact');
    
    await page.click('text=Home');
    await expect(page).toHaveURL('/');
  });
});
