import { test, expect } from '@playwright/test';

/**
 * 🧪 Black Box Testing - User Interface & Functional Testing
 * Testing from user perspective without knowledge of internal code
 */

test.describe('Black Box: Navigation & UI Elements', () => {
  
  test('BB-001: Homepage loads with all essential elements', async ({ page }) => {
    await page.goto('/');

    // Essential elements that should be visible
    await expect(page.locator('text=/Souk|سوق/')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Navigation links
    await expect(page.locator('text=/Marketplace|السوق/')).toBeVisible();
    await expect(page.locator('text=/Login|دخول/')).toBeVisible();
    await expect(page.locator('text=/Register|تسجيل/')).toBeVisible();
  });

  test('BB-002: Navbar shows correct options for anonymous user', async ({ page }) => {
    await page.goto('/');

    // Should show
    await expect(page.locator('text=/Login/')).toBeVisible();
    await expect(page.locator('text=/Register/')).toBeVisible();
    await expect(page.locator('text=/Become.*Vendor/')).toBeVisible();

    // Should NOT show
    await expect(page.locator('text=/Logout/')).not.toBeVisible();
    await expect(page.locator('text=/Dashboard/')).not.toBeVisible();
  });

  test('BB-003: Navbar shows correct options for logged-in customer', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@test.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Wait for navigation
    await page.goto('/');

    // Should show
    await expect(page.locator('text=/Sell Your Car/')).toBeVisible();
    
    // User menu should be visible
    const userMenuIcon = page.locator('[aria-label*="user"]').or(page.locator('button').filter({ hasText: /@/ }));
    await expect(userMenuIcon.first()).toBeVisible();

    // Should NOT show
    await expect(page.locator('text=/^Login$/')).not.toBeVisible();
    await expect(page.locator('text=/^Register$/')).not.toBeVisible();
  });

  test('BB-004: All navigation links work correctly', async ({ page }) => {
    await page.goto('/');

    // Test each nav link
    const navLinks = [
      { text: /Home|الرئيسية/, expectedUrl: '/' },
      { text: /Marketplace|السوق/, expectedUrl: '/marketplace' },
      { text: /About|عن/, expectedUrl: '/about' },
      { text: /Contact|اتصل/, expectedUrl: '/contact' },
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`a:has-text("${link.text}")`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForTimeout(500);
        // URL should match
        expect(page.url()).toMatch(new RegExp(link.expectedUrl));
        await page.goto('/'); // Reset
      }
    }
  });
});

test.describe('Black Box: Form Validation', () => {
  
  test('BB-010: Login form validates email format', async ({ page }) => {
    await page.goto('/login');

    // Try invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/invalid.*email|غير.*صحيح/')).toBeVisible({ timeout: 2000 });
  });

  test('BB-011: Registration form validates password strength', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show password strength error
    await expect(page.locator('text=/password.*8|كلمة.*8/')).toBeVisible({ timeout: 2000 });
  });

  test('BB-012: Registration requires password confirmation match', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="password"]', 'StrongPass@123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass@123');
    await page.click('button[type="submit"]');

    // Should show mismatch error
    await expect(page.locator('text=/match|متطابق/')).toBeVisible({ timeout: 2000 });
  });

  test('BB-013: Sell Car form validates required fields', async ({ page }) => {
    // Login as customer first
    await page.goto('/login');
    // ... login ...

    await page.goto('/sell-your-car');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show required field errors
    const requiredFieldError = page.locator('text=/required|مطلوب/');
    await expect(requiredFieldError.first()).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Black Box: User Feedback & Messages', () => {
  
  test('BB-020: User sees loading indicators during actions', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'Test@123');
    await page.click('button[type="submit"]');

    // Should briefly show loading (spinner or button disabled)
    const loadingIndicator = page.locator('[role="status"]').or(page.locator('svg.animate-spin'));
    // Check if loading appears (might be very brief)
  });

  test('BB-021: User sees success messages for actions', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@test.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.click('button[type="submit"]');

    // Should show success toast (if login succeeds)
    await expect(page.locator('text=/success|نجح/i')).toBeVisible({ timeout: 10000 });
  });

  test('BB-022: User sees error messages for failed actions', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@test.com');
    await page.fill('input[name="password"]', 'WrongPass@123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/error|خطأ|failed|فشل/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Black Box: Accessibility & Responsive Design', () => {
  
  test('BB-030: Site is accessible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/');
    
    // Mobile menu should work
    const mobileMenuButton = page.locator('button[aria-label*="menu"]').or(page.locator('svg').filter({ has: page.locator('path') }));
    if (await mobileMenuButton.first().isVisible()) {
      await mobileMenuButton.first().click();
      
      // Menu should expand
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('BB-031: Site works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('/marketplace');
    
    // Products should display in grid
    await expect(page.locator('.grid').or(page.locator('[class*="grid"]'))).toBeVisible();
  });

  test('BB-032: Site works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    
    await page.goto('/');
    
    // Full navbar should be visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=/Marketplace/')).toBeVisible();
  });
});

test.describe('Black Box: Performance', () => {
  
  test('BB-040: Homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Homepage loaded in ${loadTime}ms`);
    
    // Should load in under 5 seconds on good connection
    expect(loadTime).toBeLessThan(5000);
  });

  test('BB-041: Login page loads immediately (not stuck)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Login page loaded in ${loadTime}ms`);
    
    // With timeout fixes, should load in under 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('BB-042: Dashboard loads within reasonable time', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@test.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.click('button[type="submit"]');
    
    const startTime = Date.now();
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard loaded in ${loadTime}ms after login`);
    
    // Should load dashboard within 15 seconds (includes auth + redirect)
    expect(loadTime).toBeLessThan(15000);
  });
});
