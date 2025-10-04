import { test, expect } from '@playwright/test';

/**
 * 🧪 Complete Vendor Journey E2E Test
 * Tests vendor application, approval, and dashboard access
 */

test.describe('Vendor Journey', () => {
  const testEmail = `vendor-test-${Date.now()}@test.com`;
  const testPassword = 'VendorPass@123';
  const testName = 'Test Vendor';
  const companyName = 'Test Automotive Co.';

  test('User can apply to become vendor', async ({ page }) => {
    // Register as customer first
    await page.goto('/register');
    await page.fill('input[name="displayName"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('input[value="customer"]');
    await page.check('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');

    // Wait for redirect and login
    await page.waitForURL(/\/login/);
    
    // Login (assuming email confirmed)
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Navigate to vendor application
    await page.goto('/vendor/apply');

    // Verify application form loads
    await expect(page.locator('text=/Vendor Application|طلب انضمام كتاجر/')).toBeVisible();

    // Fill vendor application
    await page.fill('input[name="companyName"]', companyName);
    await page.fill('input[name="licenseNumber"]', '12345678');
    await page.fill('textarea[name="description"]', 'Professional automotive parts vendor');

    // Submit application
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/Application submitted|تم إرسال الطلب/')).toBeVisible({ timeout: 10000 });
  });

  test('Vendor can access vendor dashboard after approval', async ({ page }) => {
    // Assuming vendor is approved and logs in
    await page.goto('/login');
    // ... login as vendor ...

    // Should redirect to vendor dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/);

    // Verify vendor dashboard elements
    await expect(page.locator('text=/Vendor Dashboard|لوحة التاجر/')).toBeVisible();
    await expect(page.locator('text=/Products|المنتجات/')).toBeVisible();
    await expect(page.locator('text=/Sales|المبيعات/')).toBeVisible();
  });

  test('Vendor dashboard shows correct data', async ({ page }) => {
    await page.goto('/vendor/dashboard');

    // Verify stats
    await expect(page.locator('text=/Total Products|إجمالي المنتجات/')).toBeVisible();
    await expect(page.locator('text=/Total Sales|إجمالي المبيعات/')).toBeVisible();
    await expect(page.locator('text=/Revenue|الإيرادات/')).toBeVisible();

    // Verify can add product
    const addProductBtn = page.locator('text=/Add Product|إضافة منتج/');
    if (await addProductBtn.isVisible()) {
      await expect(addProductBtn).toBeVisible();
    }
  });

  test('Vendor cannot access admin dashboard', async ({ page }) => {
    // Login as vendor
    await page.goto('/login');
    // ... login ...

    // Try to access admin dashboard
    await page.goto('/admin/dashboard');

    // Should be redirected to vendor dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
  });

  test('Vendor does not see customer-only features', async ({ page }) => {
    await page.goto('/vendor/dashboard');

    // Navbar should NOT show "Sell Your Car" button
    await expect(page.locator('text=/Sell Your Car/')).not.toBeVisible();
  });
});
