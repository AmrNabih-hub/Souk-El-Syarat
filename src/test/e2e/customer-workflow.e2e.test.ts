import { test, expect } from '@playwright/test'

test.describe('Customer Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Complete customer registration and login flow', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Sign Up')
    await expect(page).toHaveURL('/auth/signup')

    // Fill registration form
    await page.fill('input[name="firstName"]', 'Ahmed')
    await page.fill('input[name="lastName"]', 'Hassan')
    await page.fill('input[name="email"]', 'ahmed.hassan@example.com')
    await page.fill('input[name="phone"]', '+201234567890')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!')
    await page.check('input[name="agreeToTerms"]')

    // Submit registration
    await page.click('button[type="submit"]')
    
    // Should redirect to email verification
    await expect(page).toHaveURL('/auth/verify-email')
    await expect(page.locator('text=Please check your email')).toBeVisible()

    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL('/auth/login')

    // Fill login form
    await page.fill('input[name="email"]', 'ahmed.hassan@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')

    // Submit login
    await page.click('button[type="submit"]')
    
    // Should redirect to customer dashboard
    await expect(page).toHaveURL('/customer/dashboard')
    await expect(page.locator('text=Welcome, Ahmed')).toBeVisible()
  })

  test('Complete car search and purchase flow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'customer@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/customer/dashboard')

    // Search for cars
    await page.fill('input[placeholder="Search for cars..."]', 'Toyota Camry')
    await page.selectOption('select[name="brand"]', 'toyota')
    await page.selectOption('select[name="year"]', '2020')
    await page.fill('input[name="maxPrice"]', '500000')

    // Submit search
    await page.click('button[type="submit"]')
    
    // Should show search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="car-card"]')).toHaveCount.greaterThan(0)

    // View car details
    await page.click('[data-testid="car-card"]:first-child')
    await expect(page.locator('[data-testid="car-details"]')).toBeVisible()
    await expect(page.locator('text=Toyota Camry')).toBeVisible()

    // Add to favorites
    await page.click('[data-testid="favorite-button"]')
    await expect(page.locator('text=Added to favorites')).toBeVisible()

    // Contact vendor
    await page.click('[data-testid="contact-vendor-button"]')
    await expect(page.locator('[data-testid="contact-modal"]')).toBeVisible()
    
    await page.fill('textarea[name="message"]', 'I am interested in this car. Can you provide more details?')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Message sent successfully')).toBeVisible()

    // Make purchase
    await page.click('[data-testid="buy-now-button"]')
    await expect(page.locator('[data-testid="purchase-modal"]')).toBeVisible()
    
    await page.fill('input[name="fullName"]', 'Ahmed Hassan')
    await page.fill('input[name="phone"]', '+201234567890')
    await page.fill('textarea[name="address"]', '123 Main Street, Cairo, Egypt')
    await page.selectOption('select[name="paymentMethod"]', 'bank_transfer')

    // Submit purchase
    await page.click('button[type="submit"]')
    
    // Should show order confirmation
    await expect(page.locator('text=Order placed successfully')).toBeVisible()
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
  })

  test('Complete order tracking flow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'customer@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/customer/dashboard')

    // Navigate to orders
    await page.click('[data-testid="orders-tab"]')
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible()

    // View order details
    await page.click('[data-testid="order-item"]:first-child')
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible()

    // Track order
    await page.click('[data-testid="track-order-button"]')
    await expect(page.locator('[data-testid="tracking-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="tracking-timeline"]')).toBeVisible()

    // Check order status updates
    const statusElements = page.locator('[data-testid="status-item"]')
    await expect(statusElements).toHaveCount.greaterThan(0)

    // Close tracking modal
    await page.click('[data-testid="close-modal"]')
    await expect(page.locator('[data-testid="tracking-modal"]')).not.toBeVisible()
  })

  test('Complete profile management flow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'customer@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/customer/dashboard')

    // Navigate to profile
    await page.click('[data-testid="profile-tab"]')
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible()

    // Update profile information
    await page.fill('input[name="firstName"]', 'Ahmed')
    await page.fill('input[name="lastName"]', 'Hassan')
    await page.fill('input[name="phone"]', '+201234567890')
    await page.fill('textarea[name="address"]', '123 Main Street, Cairo, Egypt')

    // Save profile
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()

    // Change password
    await page.click('[data-testid="change-password-button"]')
    await expect(page.locator('[data-testid="change-password-modal"]')).toBeVisible()
    
    await page.fill('input[name="currentPassword"]', 'password123')
    await page.fill('input[name="newPassword"]', 'NewSecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'NewSecurePass123!')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Password changed successfully')).toBeVisible()

    // Upload profile picture
    await page.setInputFiles('input[type="file"]', 'test-files/profile-picture.jpg')
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('text=Profile picture updated successfully')).toBeVisible()
  })

  test('Complete favorites and wishlist flow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'customer@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/customer/dashboard')

    // Search for cars
    await page.fill('input[placeholder="Search for cars..."]', 'BMW')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()

    // Add multiple cars to favorites
    const carCards = page.locator('[data-testid="car-card"]')
    const count = await carCards.count()
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      await carCards.nth(i).click('[data-testid="favorite-button"]')
      await expect(page.locator('text=Added to favorites')).toBeVisible()
    }

    // Navigate to favorites
    await page.click('[data-testid="favorites-tab"]')
    await expect(page.locator('[data-testid="favorites-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount.greaterThan(0)

    // Remove from favorites
    await page.click('[data-testid="favorite-item"]:first-child [data-testid="remove-favorite"]')
    await expect(page.locator('text=Removed from favorites')).toBeVisible()

    // Add to wishlist
    await page.click('[data-testid="wishlist-tab"]')
    await page.click('[data-testid="add-to-wishlist-button"]')
    await expect(page.locator('text=Added to wishlist')).toBeVisible()
  })

  test('Complete notification and communication flow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'customer@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/customer/dashboard')

    // Check notifications
    await page.click('[data-testid="notifications-button"]')
    await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible()
    
    const notifications = page.locator('[data-testid="notification-item"]')
    await expect(notifications).toHaveCount.greaterThan(0)

    // Mark notification as read
    await notifications.first().click('[data-testid="mark-read"]')
    await expect(page.locator('text=Notification marked as read')).toBeVisible()

    // Open live chat
    await page.click('[data-testid="chat-button"]')
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible()
    
    await page.fill('[data-testid="chat-input"]', 'Hello, I need help with my order')
    await page.click('[data-testid="send-message"]')
    
    await expect(page.locator('[data-testid="message"]:last-child')).toContainText('Hello, I need help with my order')

    // Close chat
    await page.click('[data-testid="close-chat"]')
    await expect(page.locator('[data-testid="chat-window"]')).not.toBeVisible()
  })
})