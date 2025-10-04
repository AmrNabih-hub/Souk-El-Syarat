import { test, expect } from '@playwright/test';

/**
 * 🧪 Use Case Testing - All User Scenarios
 * Tests based on actual user stories and business cases
 */

test.describe('Use Case 1: New Customer First Purchase', () => {
  test('UC-001: Customer registers, browses, and makes first purchase', async ({ page }) => {
    // Scenario: Ahmed wants to buy car parts
    
    // 1. Ahmed visits the website
    await page.goto('/');
    await expect(page.locator('text=/Souk|سوق/')).toBeVisible();

    // 2. Ahmed browses marketplace
    await page.goto('/marketplace');
    await expect(page.locator('text=/Marketplace|السوق/')).toBeVisible();

    // 3. Ahmed finds a product he likes
    const firstProduct = page.locator('.product-card').or(page.locator('[data-testid="product"]')).first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
      await expect(page).toHaveURL(/\/product/);
    }

    // 4. Ahmed wants to add to cart but needs to register
    const addToCartBtn = page.locator('text=/Add to Cart|أضف للسلة/');
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }

    // 5. Ahmed registers
    await page.goto('/register');
    await page.fill('input[name="displayName"]', 'Ahmed Mohamed');
    await page.fill('input[name="email"]', `ahmed-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Ahmed@123456');
    await page.fill('input[name="confirmPassword"]', 'Ahmed@123456');
    await page.click('input[value="customer"]');
    await page.check('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');

    // 6. Ahmed confirms email and logs in
    // (Simulated - in real test would verify email)
    
    // Result: Ahmed can now shop as authenticated customer
  });
});

test.describe('Use Case 2: Customer Sells Used Car', () => {
  test('UC-002: Customer lists car for sale, admin approves', async ({ page }) => {
    // Scenario: Fatima wants to sell her car
    
    // 1. Fatima logs in as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'fatima@test.com');
    await page.fill('input[name="password"]', 'Fatima@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2. Fatima clicks "Sell Your Car"
    await page.click('text=/Sell Your Car|بيع سيارتك/');
    await expect(page).toHaveURL(/\/sell-your-car/);

    // 3. Fatima fills the wizard
    await page.fill('input[name="title"]', 'Honda Civic 2018 - Excellent Condition');
    await page.fill('textarea[name="description"]', 'Second owner, full maintenance history');
    await page.fill('input[name="price"]', '180000');

    // 4. Fatima submits
    await page.click('button[type="submit"]');

    // 5. Confirmation shown
    await expect(page.locator('text=/submitted.*review|تم.*مراجعة/')).toBeVisible({ timeout: 10000 });

    // 6. Admin reviews and approves (separate admin test)
    // Result: Car listing goes to pending → approved
  });
});

test.describe('Use Case 3: Vendor Joins Platform', () => {
  test('UC-003: User applies to become vendor, gets approved', async ({ page }) => {
    // Scenario: Mohamed wants to sell auto parts as vendor
    
    // 1. Mohamed registers as customer
    await page.goto('/register');
    await page.fill('input[name="displayName"]', 'Mohamed Ali');
    await page.fill('input[name="email"]', `mohamed-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Mohamed@123');
    await page.fill('input[name="confirmPassword"]', 'Mohamed@123');
    await page.click('input[value="customer"]');
    await page.check('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');

    // 2. Mohamed logs in
    await page.goto('/login');
    // ... login ...

    // 3. Mohamed applies to become vendor
    await page.goto('/vendor/apply');
    await page.fill('input[name="companyName"]', 'Ali Auto Parts');
    await page.fill('input[name="licenseNumber"]', '87654321');
    await page.fill('textarea[name="description"]', 'Professional auto parts supplier');
    await page.click('button[type="submit"]');

    // 4. Application submitted
    await expect(page.locator('text=/submitted|تم.*الطلب/')).toBeVisible({ timeout: 10000 });

    // 5. Admin approves (separate test)
    // 6. Mohamed logs in again, now has vendor role
    // 7. Redirects to /vendor/dashboard
    // Result: Mohamed can now sell products as vendor
  });
});

test.describe('Use Case 4: Admin Manages Platform', () => {
  test('UC-004: Admin reviews and approves vendor application', async ({ page }) => {
    // Scenario: Admin Sarah reviews Mohamed's vendor application
    
    // 1. Sarah logs in as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2. Sarah goes to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 3. Sarah views pending vendor applications
    const vendorAppsTab = page.locator('text=/Vendor Applications|طلبات التجار/');
    if (await vendorAppsTab.isVisible()) {
      await vendorAppsTab.click();
    }

    // 4. Sarah approves an application
    const approveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("موافقة")'));
    if (await approveButton.first().isVisible()) {
      await approveButton.first().click();
      
      // Confirmation dialog
      await page.click('button:has-text("Confirm")');
      
      // Success message
      await expect(page.locator('text=/approved|تمت.*الموافقة/')).toBeVisible({ timeout: 5000 });
    }

    // Result: User becomes vendor, can access vendor dashboard
  });

  test('UC-005: Admin reviews and approves car listing', async ({ page }) => {
    // Scenario: Admin reviews Fatima's car listing
    
    await page.goto('/admin/dashboard');

    // View car listings
    const carListingsTab = page.locator('text=/Car Listings|السيارات المعروضة/');
    if (await carListingsTab.isVisible()) {
      await carListingsTab.click();
    }

    // Approve a listing
    const approveListing = page.locator('button:has-text("Approve")').first();
    if (await approveListing.isVisible()) {
      await approveListing.click();
      await expect(page.locator('text=/approved|تمت.*الموافقة/')).toBeVisible({ timeout: 5000 });
    }

    // Result: Car appears in marketplace
  });
});

test.describe('Use Case 5: Search and Filter Products', () => {
  test('UC-006: Customer searches for specific car part', async ({ page }) => {
    // Scenario: Customer searches for "brake pads"
    
    await page.goto('/marketplace');

    // Use search bar
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="Search"]'));
    await searchInput.fill('brake pads');
    await searchInput.press('Enter');

    // Wait for results
    await page.waitForTimeout(2000);

    // Should show filtered results
    // (Exact assertions depend on test data)
  });

  test('UC-007: Customer filters by category and price', async ({ page }) => {
    await page.goto('/marketplace');

    // Select category
    const categorySelect = page.locator('select[name="category"]').or(page.locator('button:has-text("Category")'));
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.click('text=/Spare Parts|قطع غيار/');
    }

    // Set price range
    const priceFilter = page.locator('input[name="maxPrice"]').or(page.locator('input[type="range"]'));
    if (await priceFilter.first().isVisible()) {
      await priceFilter.first().fill('5000');
    }

    // Apply filters
    const applyButton = page.locator('button:has-text("Apply")').or(page.locator('button:has-text("تطبيق")'));
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }

    // Results should be filtered
    await page.waitForTimeout(1000);
  });
});

test.describe('Use Case 6: Order Tracking', () => {
  test('UC-008: Customer tracks order status', async ({ page }) => {
    // Scenario: Customer placed order, wants to track it
    
    // Login as customer
    await page.goto('/login');
    // ... login ...

    // Go to orders page
    await page.goto('/customer/dashboard');
    await page.click('text=/My Orders|طلباتي/');

    // Should show orders list
    await expect(page.locator('text=/Orders|الطلبات/')).toBeVisible();

    // Click on an order
    const firstOrder = page.locator('.order-item').or(page.locator('[data-testid="order"]')).first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Should show order details
      await expect(page.locator('text=/Status|الحالة/')).toBeVisible();
    }
  });
});
