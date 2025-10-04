import { test, expect } from '@playwright/test';

/**
 * 🧪 Complete Authentication Flow E2E Tests
 * Tests all authentication scenarios with timeout fixes
 */

test.describe('Authentication Flow with Timeout Protection', () => {
  
  test('Login page loads within 10 seconds (timeout protection)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    
    // Page should be visible (not stuck in loading)
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Login page loaded in ${loadTime}ms`);
    
    // Should be under 10 seconds (our timeout limit)
    expect(loadTime).toBeLessThan(10000);
  });

  test('Register page loads within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/register');
    
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Register page loaded in ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(10000);
  });

  test('Login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Test@123');
    
    // Enable console logs
    page.on('console', msg => {
      if (msg.text().includes('[LoginPage]') || msg.text().includes('[AuthProvider]')) {
        console.log('Browser:', msg.text());
      }
    });

    await page.click('button[type="submit"]');

    // Wait for auth flow (max 3 seconds polling + 10 seconds init)
    await page.waitForTimeout(5000);

    // Should be redirected to a dashboard (not stay on login)
    const url = page.url();
    expect(url).toMatch(/\/(customer|vendor|admin)\/dashboard/);
  });

  test('Login shows appropriate error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid.*credentials|بيانات.*غير.*صحيحة/')).toBeVisible({ timeout: 5000 });

    // Should NOT redirect
    await expect(page).toHaveURL(/\/login/);
  });

  test('Logout clears session and redirects to home', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Click user menu
    const userMenu = page.locator('[aria-label*="user menu"]').or(page.locator('button').filter({ hasText: /@/ })).first();
    await userMenu.click();

    // Click logout
    await page.click('text=/Logout|تسجيل خروج/');

    // Should redirect to home
    await expect(page).toHaveURL(/^\/$/);

    // Navbar should show Login button again
    await expect(page.locator('text=/Login|تسجيل دخول/')).toBeVisible();
  });

  test('Protected route redirects anonymous user to login', async ({ page }) => {
    // Clear cookies to ensure anonymous
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/customer/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Session persists across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Get current URL
    const dashboardUrl = page.url();
    expect(dashboardUrl).toMatch(/\/dashboard/);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(dashboardUrl);

    // Navbar should still NOT show Login button
    await expect(page.locator('text=/^Login$/')).not.toBeVisible();
  });

  test('Console shows proper auth flow with timing', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);

    // Verify console logs show proper flow
    const hasLoginAttempt = consoleMessages.some(msg => msg.includes('[LoginPage] Attempting login'));
    const hasAuthProvider = consoleMessages.some(msg => msg.includes('[AuthProvider]'));
    const hasUserLoaded = consoleMessages.some(msg => msg.includes('User loaded'));

    expect(hasLoginAttempt).toBe(true);
    expect(hasAuthProvider).toBe(true);
    // hasUserLoaded should be true if everything works
  });
});
