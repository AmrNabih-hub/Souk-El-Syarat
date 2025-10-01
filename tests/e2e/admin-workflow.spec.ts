/**
 * E2E Test: Admin Workflow
 * Login → Review Applications → Approve/Reject → Manage Platform
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login as admin', async ({ page }) => {
    await test.step('Navigate to admin login', async () => {
      // Look for admin login link
      await page.goto('/admin/login');
      
      await expect(page).toHaveURL(/.*admin.*login.*/);
      await expect(page.locator('h1, h2')).toContainText(/admin/i);
    });

    await test.step('Fill login form', async () => {
      // Admin email
      await page.locator('input[name="email"], input[type="email"]').fill('admin@soukel-syarat.com');
      
      // Admin password
      await page.locator('input[name="password"], input[type="password"]').fill('SoukAdmin2024!@#');
      
      // Admin code (if required)
      const adminCodeInput = page.locator('input[name="adminCode"]');
      if (await adminCodeInput.count() > 0) {
        await adminCodeInput.fill('ADMIN-SECRET-CODE');
      }
      
      // Submit
      const loginButton = page.locator('button:has-text("Sign in"), button[type="submit"]');
      await loginButton.click();
      
      // Wait for redirect to admin dashboard
      await page.waitForURL(/.*admin.*dashboard.*/);
    });
  });

  test('should display admin dashboard', async ({ page }) => {
    // Navigate directly (simulating logged-in admin)
    await page.goto('/admin/dashboard');
    
    // Verify admin dashboard elements
    await expect(page.locator('h1, h2')).toContainText(/dashboard|admin/i);
    
    // Verify platform statistics
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards.first()).toBeVisible();
    
    // Should show metrics like:
    // - Total Users
    // - Total Vendors
    // - Total Products
    // - Total Orders
    await expect(page.locator('text=/users|vendors|products|orders/i')).toBeVisible();
  });

  test('should review vendor applications', async ({ page }) => {
    await test.step('Navigate to vendor applications', async () => {
      await page.goto('/admin/dashboard');
      
      // Click vendor applications link
      const applicationsLink = page.locator('a:has-text("Applications"), a:has-text("Vendors")');
      await applicationsLink.first().click();
      
      await page.waitForURL(/.*vendor.*applications.*/);
    });

    await test.step('View application list', async () => {
      // Verify applications table/list
      await expect(page.locator('h1, h2')).toContainText(/applications/i);
      
      const applicationsList = page.locator('[data-testid="application-item"], table');
      await expect(applicationsList).toBeVisible();
    });

    await test.step('Review application details', async () => {
      // Click first application
      const firstApplication = page.locator('[data-testid="application-item"]').first();
      if (await firstApplication.count() > 0) {
        await firstApplication.click();
        
        // Verify application details
        await expect(page.locator('text=/business name|contact|documents/i')).toBeVisible();
      }
    });
  });

  test('should approve vendor application', async ({ page }) => {
    await page.goto('/admin/vendor-applications');
    
    // Find pending application
    const pendingApplication = page.locator('[data-status="pending"]').first();
    if (await pendingApplication.count() > 0) {
      await pendingApplication.click();
      
      // Click approve button
      const approveButton = page.locator('button:has-text("Approve")');
      await approveButton.click();
      
      // Confirm approval (if confirmation dialog appears)
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Verify success notification
      await expect(page.locator('.toast')).toBeVisible();
      await expect(page.locator('.toast')).toContainText(/approved|success/i);
    }
  });

  test('should reject vendor application', async ({ page }) => {
    await page.goto('/admin/vendor-applications');
    
    const pendingApplication = page.locator('[data-status="pending"]').first();
    if (await pendingApplication.count() > 0) {
      await pendingApplication.click();
      
      // Click reject button
      const rejectButton = page.locator('button:has-text("Reject")');
      await rejectButton.click();
      
      // Fill rejection reason
      const reasonInput = page.locator('textarea[name="reason"], textarea[name="rejectionReason"]');
      if (await reasonInput.count() > 0) {
        await reasonInput.fill('Incomplete documentation');
      }
      
      // Confirm rejection
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Reject")');
      await confirmButton.click();
      
      // Verify success
      await expect(page.locator('.toast')).toContainText(/rejected/i);
    }
  });

  test('should moderate products', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Verify products list
    await expect(page.locator('h1, h2')).toContainText(/products/i);
    
    // View product details
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
      
      // Approve or reject product
      const approveButton = page.locator('button:has-text("Approve")');
      const rejectButton = page.locator('button:has-text("Reject")');
      
      await expect(approveButton.or(rejectButton)).toBeVisible();
    }
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Verify users list
    await expect(page.locator('table, [data-testid="users-list"]')).toBeVisible();
    
    // Test user actions
    const userRow = page.locator('[data-testid="user-row"]').first();
    if (await userRow.count() > 0) {
      // View user details
      await userRow.click();
      
      // Verify user details modal/page
      await expect(page.locator('text=/email|role|status/i')).toBeVisible();
    }
  });

  test('should view platform analytics', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Verify analytics section
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible();
    
    // Verify charts
    const charts = page.locator('canvas, svg[class*="recharts"]');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
    
    // Verify key metrics
    await expect(page.locator('text=/revenue|orders|growth/i')).toBeVisible();
  });

  test('should search and filter vendor applications', async ({ page }) => {
    await page.goto('/admin/vendor-applications');
    
    // Use search
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Test Shop');
      await page.waitForTimeout(500);
      
      // Results should update
      const results = page.locator('[data-testid="application-item"]');
      await expect(results.first()).toBeVisible();
    }
    
    // Use status filter
    const statusFilter = page.locator('select[name="status"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('pending');
      await page.waitForTimeout(500);
    }
  });

  test('should export platform data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    if (await exportButton.count() > 0) {
      // Click export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.first().click()
      ]);
      
      // Verify download started
      expect(download).toBeDefined();
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.csv|\.xlsx|\.json/);
    }
  });

  test('should manage platform settings', async ({ page }) => {
    await page.goto('/admin/settings');
    
    // Verify settings page
    await expect(page.locator('h1, h2')).toContainText(/settings/i);
    
    // Test feature flags
    const featureToggles = page.locator('input[type="checkbox"]');
    if (await featureToggles.count() > 0) {
      const firstToggle = featureToggles.first();
      await firstToggle.click();
      
      // Save settings
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();
      
      // Verify saved
      await expect(page.locator('.toast')).toBeVisible();
    }
  });

  test('should handle system logs', async ({ page }) => {
    await page.goto('/admin/logs');
    
    // Verify logs interface
    const logsContainer = page.locator('[data-testid="logs-container"], table');
    if (await logsContainer.count() > 0) {
      await expect(logsContainer).toBeVisible();
      
      // Verify log entries
      const logEntries = page.locator('[data-testid="log-entry"]');
      await expect(logEntries.first()).toBeVisible();
    }
  });
});
