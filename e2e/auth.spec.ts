import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a customer to log in and log out', async ({ page }) => {
    // 1. Navigate to the Login Page
    await page.goto('/login');

    // 2. Fill in the login form with the correct credentials from the component
    await page.getByPlaceholder('أدخل البريد الإلكتروني').fill('customer1@souk-el-syarat.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('Customer123456!');

    // 3. Click the login button
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();

    // 4. Verify successful login and redirection
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    
    // Expect the logout button to be visible within the Navbar
    const navbar = page.locator('nav');
    await expect(navbar.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible();

    // 5. Log out
    await navbar.getByRole('button', { name: 'تسجيل الخروج' }).click();

    // 6. Verify successful logout
    await expect(page).toHaveURL('/');

    // Expect the login button to be visible again in the Navbar
    await expect(navbar.getByRole('link', { name: 'تسجيل الدخول' })).toBeVisible();
  });
});
