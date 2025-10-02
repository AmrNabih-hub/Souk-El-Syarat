/**
 * E2E Test: Complete Customer Journey
 * Browse → Search → Product Details → Add to Cart → Checkout
 */

import { test, expect } from '@playwright/test';

test.describe('Customer Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full purchase journey', async ({ page }) => {
    // Step 1: Browse Homepage
    await test.step('Browse homepage', async () => {
      await expect(page).toHaveTitle(/Souk El-Syarat/i);
      
      // Check hero section
      await expect(page.locator('h1')).toBeVisible();
      
      // Check products are displayed
      const products = page.locator('[data-testid="product-card"]');
      await expect(products.first()).toBeVisible();
    });

    // Step 2: Search for product
    await test.step('Search for BMW', async () => {
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('BMW');
      await searchInput.press('Enter');
      
      await page.waitForURL(/.*marketplace.*/);
      
      // Verify search results
      const searchResults = page.locator('[data-testid="product-card"]');
      await expect(searchResults.first()).toBeVisible();
    });

    // Step 3: View product details
    await test.step('View product details', async () => {
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await firstProduct.click();
      
      await page.waitForURL(/.*product.*/);
      
      // Verify product details page
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
    });

    // Step 4: Add to cart
    await test.step('Add product to cart', async () => {
      const addToCartButton = page.locator('button:has-text("Add to Cart")');
      await addToCartButton.click();
      
      // Verify toast notification
      await expect(page.locator('.toast, [role="alert"]')).toBeVisible();
      
      // Verify cart badge updated
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toHaveText('1');
    });

    // Step 5: Go to cart
    await test.step('Navigate to cart', async () => {
      const cartIcon = page.locator('[data-testid="cart-icon"]');
      await cartIcon.click();
      
      await page.waitForURL(/.*cart.*/);
      
      // Verify cart page
      await expect(page.locator('h1:has-text("Cart")')).toBeVisible();
      await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    });

    // Step 6: Update quantity
    await test.step('Update item quantity', async () => {
      const incrementButton = page.locator('[data-testid="quantity-increment"]');
      await incrementButton.click();
      
      const quantityDisplay = page.locator('[data-testid="quantity-value"]');
      await expect(quantityDisplay).toHaveText('2');
    });

    // Step 7: Proceed to checkout
    await test.step('Proceed to checkout', async () => {
      const checkoutButton = page.locator('button:has-text("Checkout")');
      await checkoutButton.click();
      
      // Should redirect to login if not authenticated
      await page.waitForURL(/.*login.*|.*checkout.*/);
    });
  });

  test('should add multiple products to cart', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
    
    // Add first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const firstAddButton = firstProduct.locator('button:has-text("Add")');
    await firstAddButton.click();
    
    await page.waitForTimeout(500);
    
    // Add second product
    const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
    const secondAddButton = secondProduct.locator('button:has-text("Add")');
    await secondAddButton.click();
    
    // Verify cart badge
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('2');
    
    // Go to cart
    await page.goto('/cart');
    
    // Verify both products in cart
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2);
  });

  test('should search and filter products', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Use filters
    const categoryFilter = page.locator('select[name="category"]');
    await categoryFilter.selectOption('cars');
    
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible();
    
    // Test price filter
    const minPriceInput = page.locator('input[name="minPrice"]');
    await minPriceInput.fill('10000');
    
    const maxPriceInput = page.locator('input[name="maxPrice"]');
    await maxPriceInput.fill('50000');
    
    const applyFilterButton = page.locator('button:has-text("Apply")');
    await applyFilterButton.click();
    
    await page.waitForTimeout(500);
    
    // Products should still be visible
    await expect(products.first()).toBeVisible();
  });

  test('should add to wishlist', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click wishlist icon on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const wishlistButton = firstProduct.locator('[data-testid="wishlist-button"]');
    await wishlistButton.click();
    
    // Verify toast notification
    await expect(page.locator('.toast, [role="alert"]')).toBeVisible();
    
    // Navigate to favorites
    await page.goto('/favorites');
    
    // Verify product in wishlist
    const wishlistItems = page.locator('[data-testid="product-card"]');
    await expect(wishlistItems.first()).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Test main navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Click marketplace link
    const marketplaceLink = page.locator('a:has-text("Marketplace")');
    await marketplaceLink.click();
    await page.waitForURL(/.*marketplace.*/);
    
    // Click vendors link
    const vendorsLink = page.locator('a:has-text("Vendors")');
    await vendorsLink.click();
    await page.waitForURL(/.*vendors.*/);
    
    // Click home/logo
    const logoLink = page.locator('[data-testid="logo-link"]').or(page.locator('a[href="/"]')).first();
    await logoLink.click();
    await page.waitForURL(/^.*\/$/);
  });

  test('should handle empty cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Should show empty cart message
    await expect(page.locator('text=/empty|no items/i')).toBeVisible();
    
    // Should show shop now button
    const shopButton = page.locator('button:has-text("Shop"), a:has-text("Shop")');
    await expect(shopButton.first()).toBeVisible();
  });

  test('should display product details correctly', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Verify all product details sections
    await expect(page.locator('h1')).toBeVisible(); // Product name
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
    
    // Verify action buttons
    await expect(page.locator('button:has-text("Add to Cart")')).toBeVisible();
    await expect(page.locator('button:has-text("Buy Now"), button:has-text("Checkout")')).toBeVisible();
  });
});
