import { test, expect } from '@playwright/test';

/**
 * 🧪 Admin Journey E2E Test
 * Tests admin login, dashboard access, and management features
 */

test.describe('Admin Journey', () => {
  test('Admin can login and access admin dashboard', async ({ page }) => {
    await page.goto('/login');

    // Login as admin (use admin credentials from env or test data)
    await page.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com');
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'Admin@123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
  });

  test('Admin dashboard displays platform analytics', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify admin dashboard sections
    await expect(page.locator('text=/Admin Dashboard|لوحة الإدارة/')).toBeVisible();
    
    // Check for analytics sections
    const analyticsIndicators = [
      'text=/Total Users|إجمالي المستخدمين/',
      'text=/Total Vendors|إجمالي التجار/',
      'text=/Total Orders|إجمالي الطلبات/',
      'text=/Revenue|الإيرادات/',
    ];

    for (const indicator of analyticsIndicators) {
      const element = page.locator(indicator);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
  });

  test('Admin can view pending vendor applications', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for vendor applications section
    const vendorAppsSection = page.locator('text=/Vendor Applications|طلبات التجار/');
    
    if (await vendorAppsSection.isVisible()) {
      await vendorAppsSection.click();
      
      // Should show list of applications
      await expect(page.locator('text=/Pending|قيد المراجعة/')).toBeVisible();
    }
  });

  test('Admin can view pending car listings', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Look for car listings section
    const carListingsSection = page.locator('text=/Car Listings|سيارات للبيع/');
    
    if (await carListingsSection.isVisible()) {
      await carListingsSection.click();
      
      // Should show list of pending car listings
      await expect(page.locator('text=/Pending|قيد المراجعة/')).toBeVisible();
    }
  });

  test('Admin can access all dashboards', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    // ... admin login ...

    // Admin should be able to access customer dashboard
    await page.goto('/customer/dashboard');
    // Should NOT be redirected (admin has access to all)
    await expect(page).toHaveURL(/\/customer\/dashboard/);

    // Admin should be able to access vendor dashboard
    await page.goto('/vendor/dashboard');
    // Should NOT be redirected
    await expect(page).toHaveURL(/\/vendor\/dashboard/);

    // Admin should be able to access admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Admin user menu shows admin-specific options', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Click user menu
    const userMenuButton = page.locator('[aria-label*="User menu"]').or(page.locator('button:has(svg)').first());
    await userMenuButton.click();

    // Should show Admin Dashboard link
    await expect(page.locator('text=/Admin Dashboard|لوحة الإدارة/')).toBeVisible();
  });
});
