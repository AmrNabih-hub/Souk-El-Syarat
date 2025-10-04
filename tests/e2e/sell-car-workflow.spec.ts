import { test, expect } from '@playwright/test';

/**
 * 🧪 Sell Your Car Workflow E2E Test
 * Critical workflow: Customer sells car → Admin reviews → Approval
 */

test.describe('Sell Your Car Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer first
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_CUSTOMER_EMAIL || 'customer@test.com');
    await page.fill('input[name="password"]', process.env.TEST_CUSTOMER_PASSWORD || 'Customer@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('Customer can access Sell Your Car page', async ({ page }) => {
    // Should see "Sell Your Car" button in navbar
    const sellCarButton = page.locator('text=/Sell Your Car|بيع سيارتك/');
    await expect(sellCarButton).toBeVisible();

    // Click button
    await sellCarButton.click();

    // Should navigate to sell-your-car page
    await expect(page).toHaveURL(/\/sell-your-car/);
  });

  test('Sell Your Car wizard form is interactive', async ({ page }) => {
    await page.goto('/sell-your-car');

    // Verify form loads
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

    // Verify required fields
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    
    // Verify car-specific fields
    await expect(page.locator('select[name="brand"]').or(page.locator('input[name="brand"]'))).toBeVisible();
    await expect(page.locator('input[name="year"]').or(page.locator('select[name="year"]'))).toBeVisible();
    await expect(page.locator('input[name="mileage"]')).toBeVisible();
  });

  test('Customer can fill and submit car listing', async ({ page }) => {
    await page.goto('/sell-your-car');

    // Fill car details
    await page.fill('input[name="title"]', '2020 Toyota Camry in excellent condition');
    await page.fill('textarea[name="description"]', 'Well-maintained car, single owner, full service history');
    await page.fill('input[name="price"]', '250000');
    
    // Fill car-specific details
    const brandField = page.locator('select[name="brand"]').or(page.locator('input[name="brand"]'));
    if (await brandField.count() > 0) {
      await brandField.first().fill('Toyota');
    }

    const yearField = page.locator('input[name="year"]').or(page.locator('select[name="year"]'));
    if (await yearField.count() > 0) {
      await yearField.first().fill('2020');
    }

    await page.fill('input[name="mileage"]', '45000');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/submitted|تم إرسال/')).toBeVisible({ timeout: 10000 });

    // Verify redirected or shown confirmation
    // (Exact behavior depends on implementation)
  });

  test('Anonymous user redirected from Sell Your Car page', async ({ page }) => {
    // Logout first (or use new context)
    await page.goto('/');
    
    // Try to access sell-your-car without login
    await page.goto('/sell-your-car');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Vendor cannot access Sell Your Car page', async ({ page }) => {
    // Login as vendor
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_VENDOR_EMAIL || 'vendor@test.com');
    await page.fill('input[name="password"]', process.env.TEST_VENDOR_PASSWORD || 'Vendor@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Try to access sell-your-car
    await page.goto('/sell-your-car');

    // Should be redirected to vendor dashboard (not allowed for vendors)
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
  });
});
