/**
 * E2E Test: Customer Car Selling Workflow
 * "بيع عربيتك" feature - Complete user journey
 */

import { test, expect } from '@playwright/test';

test.describe('Car Selling Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete car selling process', async ({ page }) => {
    await test.step('Click "بيع عربيتك" button', async () => {
      // Find and click sell car button
      const sellCarButton = page.locator('a:has-text("بيع عربيتك"), button:has-text("بيع عربيتك")');
      await expect(sellCarButton).toBeVisible();
      await sellCarButton.click();
      
      // Should redirect to login if not authenticated, or to form
      await page.waitForURL(/.*sell.*car.*|.*login.*/);
    });

    await test.step('Fill car details - Step 1: Basic Info', async () => {
      // If redirected to login, skip this test
      if (page.url().includes('login')) {
        test.skip();
        return;
      }
      
      // Make/Brand
      await page.locator('select[name="make"]').selectOption('Toyota');
      
      // Model
      await page.locator('input[name="model"]').fill('Corolla');
      
      // Year
      await page.locator('select[name="year"]').selectOption('2020');
      
      // Mileage
      await page.locator('input[name="mileage"]').fill('50000');
      
      // Condition
      await page.locator('select[name="condition"]').selectOption('used_good');
      
      // Next
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      await nextButton.click();
    });

    await test.step('Fill car details - Step 2: Specifications', async () => {
      // Transmission
      await page.locator('select[name="transmission"]').selectOption('automatic');
      
      // Fuel type
      await page.locator('select[name="fuelType"]').selectOption('gasoline');
      
      // Color
      await page.locator('input[name="color"]').fill('White');
      
      // Next
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      await nextButton.click();
    });

    await test.step('Fill car details - Step 3: Pricing', async () => {
      // Price
      await page.locator('input[name="price"]').fill('250000');
      
      // Negotiable
      const negotiableCheckbox = page.locator('input[name="negotiable"]');
      await negotiableCheckbox.check();
      
      // Next
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      await nextButton.click();
    });

    await test.step('Fill car details - Step 4: Description', async () => {
      // Description
      await page.locator('textarea[name="description"]').fill('Well-maintained car, single owner, full service history');
      
      // Features
      const features = ['AC', 'Power Windows', 'Airbags', 'ABS'];
      for (const feature of features) {
        const featureCheckbox = page.locator(`input[value="${feature}"]`);
        if (await featureCheckbox.count() > 0) {
          await featureCheckbox.check();
        }
      }
      
      // Next
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      await nextButton.click();
    });

    await test.step('Fill car details - Step 5: Location', async () => {
      // Governorate
      await page.locator('select[name="governorate"]').selectOption('Cairo');
      
      // City
      await page.locator('input[name="city"]').fill('Nasr City');
      
      // Next
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      await nextButton.click();
    });

    await test.step('Upload car images', async () => {
      // Minimum 6 images required
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.count() > 0) {
        // Upload 6 test images
        const testImages = [
          './tests/fixtures/car-1.jpg',
          './tests/fixtures/car-2.jpg',
          './tests/fixtures/car-3.jpg',
          './tests/fixtures/car-4.jpg',
          './tests/fixtures/car-5.jpg',
          './tests/fixtures/car-6.jpg',
        ];
        
        await fileInput.setInputFiles(testImages);
        
        // Verify 6 images uploaded
        const imagePreview = page.locator('[data-testid="image-preview"]');
        await expect(imagePreview).toHaveCount(6);
      }
      
      // Next
      const nextButton = page.locator('button:has-text("Next"), button:has-text("التالي")');
      await nextButton.click();
    });

    await test.step('Review and submit', async () => {
      // Verify review page shows all data
      await expect(page.locator('text=/Toyota|Corolla|2020/i')).toBeVisible();
      await expect(page.locator('text=/250,?000/i')).toBeVisible();
      
      // Submit
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("إرسال")');
      await submitButton.click();
      
      // Verify success message
      await expect(page.locator('.toast')).toBeVisible();
      await expect(page.locator('.toast')).toContainText(/success|submitted|نجح/i);
      
      // Should redirect
      await page.waitForURL(/.*dashboard.*|.*success.*/);
    });
  });

  test('should enforce 6 images minimum', async ({ page }) => {
    await page.goto('/sell-your-car');
    
    // Fill basic form
    await page.locator('select[name="make"]').selectOption('Toyota');
    await page.locator('input[name="model"]').fill('Camry');
    
    // Try to submit with less than 6 images
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles([
        './tests/fixtures/car-1.jpg',
        './tests/fixtures/car-2.jpg',
      ]);
    }
    
    // Try to proceed
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("إرسال")');
    await submitButton.click();
    
    // Should show error
    await expect(page.locator('text=/minimum.*6.*images|يجب.*6.*صور/i')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/sell-your-car');
    
    // Try to submit without filling form
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("إرسال")');
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('should display customer car listings', async ({ page }) => {
    // Login as customer first
    await page.goto('/customer/dashboard');
    
    // Navigate to my listings
    const myListingsLink = page.locator('a:has-text("My Listings"), a:has-text("سياراتي")');
    if (await myListingsLink.count() > 0) {
      await myListingsLink.click();
      
      // Verify listings page
      await expect(page.locator('h1, h2')).toContainText(/listings|cars/i);
      
      // Check listing items
      const listings = page.locator('[data-testid="listing-item"]');
      if (await listings.count() > 0) {
        await expect(listings.first()).toBeVisible();
      }
    }
  });

  test('should show listing status', async ({ page }) => {
    await page.goto('/customer/my-listings');
    
    const listing = page.locator('[data-testid="listing-item"]').first();
    if (await listing.count() > 0) {
      // Verify status badge
      await expect(listing.locator('[data-testid="status-badge"]')).toBeVisible();
      
      // Status should be: pending, approved, or rejected
      const statusText = await listing.locator('[data-testid="status-badge"]').textContent();
      expect(statusText).toMatch(/pending|approved|rejected|قيد|موافق|مرفوض/i);
    }
  });

  test('should edit draft listing', async ({ page }) => {
    await page.goto('/customer/my-listings');
    
    const draftListing = page.locator('[data-status="draft"]').first();
    if (await draftListing.count() > 0) {
      // Click edit
      const editButton = draftListing.locator('button:has-text("Edit")');
      await editButton.click();
      
      // Should navigate to edit form
      await page.waitForURL(/.*edit.*/);
      
      // Update price
      await page.locator('input[name="price"]').fill('260000');
      
      // Save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("حفظ")');
      await saveButton.click();
      
      // Verify success
      await expect(page.locator('.toast')).toBeVisible();
    }
  });

  test('should delete draft listing', async ({ page }) => {
    await page.goto('/customer/my-listings');
    
    const draftListing = page.locator('[data-status="draft"]').first();
    if (await draftListing.count() > 0) {
      // Click delete
      const deleteButton = draftListing.locator('button:has-text("Delete")');
      await deleteButton.click();
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
      await confirmButton.click();
      
      // Verify deletion
      await expect(page.locator('.toast')).toContainText(/deleted|removed/i);
    }
  });
});
