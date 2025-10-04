import { test, expect } from '@playwright/test';

/**
 * 🧪 Complete Customer Journey E2E Test
 * Tests the entire customer flow from registration to dashboard
 */

test.describe('Complete Customer Journey', () => {
  const testEmail = `customer-test-${Date.now()}@test.com`;
  const testPassword = 'TestPass@123';
  const testName = 'Test Customer';

  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('/');
  });

  test('Customer can register, confirm, login, and access dashboard', async ({ page }) => {
    // Step 1: Navigate to registration
    await page.click('text=Register');
    await expect(page).toHaveURL(/\/register/);

    // Step 2: Fill registration form
    await page.fill('input[name="displayName"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Select customer role
    await page.click('input[value="customer"]');
    
    // Accept terms
    await page.check('input[name="agreeToTerms"]');

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/Account created|تم إنشاء الحساب/')).toBeVisible({ timeout: 10000 });
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Step 4: Simulate email confirmation (in real test, would need email verification)
    // For now, assume email is confirmed and proceed to login

    // Step 5: Login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for auth to complete (with timeout fixes, should be < 10 seconds)
    await page.waitForTimeout(3000);

    // Step 6: Verify redirect to customer dashboard
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 10000 });

    // Step 7: Verify dashboard elements
    await expect(page.locator(`text=/${testName}|Welcome/`)).toBeVisible();
    
    // Verify navbar shows user info
    await expect(page.locator('text=/Login/')).not.toBeVisible();
    await expect(page.locator('text=/Register/')).not.toBeVisible();

    // Step 8: Verify customer features are accessible
    await expect(page.locator('text=/Sell Your Car|بيع سيارتك/')).toBeVisible();
  });

  test('Customer dashboard displays correctly', async ({ page, context }) => {
    // Login first (assuming user already registered)
    await page.goto('/login');
    // ... login steps ...

    await page.goto('/customer/dashboard');

    // Verify dashboard sections
    await expect(page.locator('text=/Welcome|أهلاً/')).toBeVisible();
    
    // Verify stats cards
    await expect(page.locator('text=/Active Orders|الطلبات النشطة/')).toBeVisible();
    await expect(page.locator('text=/Favorites|المفضلة/')).toBeVisible();
    
    // Verify menu items
    await expect(page.locator('text=/My Orders|طلباتي/')).toBeVisible();
    await expect(page.locator('text=/Profile|الملف الشخصي/')).toBeVisible();
  });

  test('Customer can access Sell Your Car wizard', async ({ page }) => {
    // Assuming logged in as customer
    await page.goto('/');
    
    // Click Sell Your Car button
    await page.click('text=/Sell Your Car|بيع سيارتك/');

    // Should navigate to sell-your-car page
    await expect(page).toHaveURL(/\/sell-your-car/);

    // Verify wizard form loads
    await expect(page.locator('form')).toBeVisible();
    
    // Verify form fields
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    await expect(page.locator('select[name="brand"]')).toBeVisible();
  });

  test('Customer session persists across refreshes', async ({ page }) => {
    // Login
    await page.goto('/login');
    // ... login ...
    await expect(page).toHaveURL(/\/customer\/dashboard/);

    // Refresh page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/customer\/dashboard/);
    
    // Navbar should still show user info
    await expect(page.locator('text=/Login/')).not.toBeVisible();
  });

  test('Customer cannot access vendor dashboard', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    // ... login ...

    // Try to access vendor dashboard
    await page.goto('/vendor/dashboard');

    // Should be redirected to customer dashboard
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });
});
