/**
 * E2E Test: Vendor Workflow
 * Application → Approval → Dashboard → Product Management
 */

import { test, expect } from '@playwright/test';

test.describe('Vendor Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete vendor application', async ({ page }) => {
    await test.step('Navigate to vendor application', async () => {
      // Click "Become a Vendor" or similar
      const vendorLink = page.locator('a:has-text("Vendor"), a:has-text("Become")');
      await vendorLink.first().click();
      
      await page.waitForURL(/.*vendor.*apply.*/);
    });

    await test.step('Fill application form - Step 1: Business Info', async () => {
      // Business name
      const businessNameInput = page.locator('input[name="businessName"]');
      await businessNameInput.fill('Test Auto Shop');
      
      const businessNameArInput = page.locator('input[name="businessNameAr"]');
      await businessNameArInput.fill('ورشة تجريبية');
      
      // Business type
      const businessTypeSelect = page.locator('select[name="businessType"]');
      await businessTypeSelect.selectOption('service_center');
      
      // Next button
      const nextButton = page.locator('button:has-text("Next")');
      await nextButton.click();
    });

    await test.step('Fill application form - Step 2: Contact Info', async () => {
      // Email
      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('vendor@test.com');
      
      // Phone
      const phoneInput = page.locator('input[name="phone"]');
      await phoneInput.fill('01012345678');
      
      // Address
      const addressInput = page.locator('input[name="address"]');
      await addressInput.fill('123 Test Street, Cairo');
      
      const nextButton = page.locator('button:has-text("Next")');
      await nextButton.click();
    });

    await test.step('Fill application form - Step 3: Documents', async () => {
      // Upload documents (if required)
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        // Skip file upload in test or use test file
        await fileInput.first().setInputFiles('./tests/fixtures/test-document.pdf');
      }
      
      const nextButton = page.locator('button:has-text("Next")');
      await nextButton.click();
    });

    await test.step('Submit application', async () => {
      // Review and submit
      const submitButton = page.locator('button:has-text("Submit")');
      await submitButton.click();
      
      // Verify success message
      await expect(page.locator('.toast, [role="alert"]')).toBeVisible();
      
      // Should redirect to dashboard or confirmation page
      await page.waitForURL(/.*dashboard.*|.*success.*/);
    });
  });

  test('should display vendor dashboard after approval', async ({ page }) => {
    // Simulate logged-in vendor
    await page.goto('/vendor/dashboard');
    
    // Dashboard should show stats
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
    
    // Verify stat cards
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards.first()).toBeVisible();
    
    // Verify navigation menu
    await expect(page.locator('a:has-text("Products")')).toBeVisible();
    await expect(page.locator('a:has-text("Orders")')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    await test.step('Navigate to product creation', async () => {
      await page.goto('/vendor/dashboard');
      
      const addProductButton = page.locator('button:has-text("Add Product"), a:has-text("Add Product")');
      await addProductButton.first().click();
      
      await page.waitForURL(/.*product.*new.*/);
    });

    await test.step('Fill product form', async () => {
      // Product name
      await page.locator('input[name="name"]').fill('Test Product');
      await page.locator('input[name="nameAr"]').fill('منتج تجريبي');
      
      // Description
      await page.locator('textarea[name="description"]').fill('Test description');
      await page.locator('textarea[name="descriptionAr"]').fill('وصف تجريبي');
      
      // Price
      await page.locator('input[name="price"]').fill('25000');
      
      // Stock
      await page.locator('input[name="stock"]').fill('10');
      
      // Category
      await page.locator('select[name="category"]').selectOption('parts');
      
      // Images
      const imageInput = page.locator('input[type="file"]');
      if (await imageInput.count() > 0) {
        await imageInput.first().setInputFiles('./tests/fixtures/test-image.jpg');
      }
      
      // Submit
      const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit")');
      await submitButton.click();
      
      // Verify success
      await expect(page.locator('.toast, [role="alert"]')).toBeVisible();
    });
  });

  test('should manage vendor products', async ({ page }) => {
    await page.goto('/vendor/products');
    
    // Verify products list
    const productsTable = page.locator('table, [data-testid="products-list"]');
    await expect(productsTable).toBeVisible();
    
    // Test edit product
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Should navigate to edit page
      await page.waitForURL(/.*edit.*/);
      
      // Update price
      const priceInput = page.locator('input[name="price"]');
      await priceInput.fill('30000');
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
      await saveButton.click();
      
      // Verify success
      await expect(page.locator('.toast')).toBeVisible();
    }
  });

  test('should view and manage orders', async ({ page }) => {
    await page.goto('/vendor/orders');
    
    // Verify orders list
    await expect(page.locator('h1, h2')).toContainText(/orders/i);
    
    // Check for orders table/list
    const ordersContainer = page.locator('table, [data-testid="orders-list"]');
    await expect(ordersContainer).toBeVisible();
    
    // Test order status update
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.count() > 0) {
      await firstOrder.click();
      
      // Update status
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('processing');
        
        const updateButton = page.locator('button:has-text("Update")');
        await updateButton.click();
        
        // Verify update
        await expect(page.locator('.toast')).toBeVisible();
      }
    }
  });

  test('should display vendor analytics', async ({ page }) => {
    await page.goto('/vendor/dashboard');
    
    // Verify analytics cards
    const analyticsCards = page.locator('[data-testid="analytics-card"]');
    await expect(analyticsCards.first()).toBeVisible();
    
    // Verify charts (if present)
    const charts = page.locator('canvas, [data-testid="chart"]');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
    
    // Verify revenue display
    await expect(page.locator('text=/revenue|sales|EGP/i')).toBeVisible();
  });

  test('should handle vendor profile settings', async ({ page }) => {
    await page.goto('/vendor/profile');
    
    // Verify profile form
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    
    // Update business info
    await page.locator('input[name="businessName"]').fill('Updated Shop Name');
    
    // Save changes
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    
    // Verify success
    await expect(page.locator('.toast')).toBeVisible();
  });
});
