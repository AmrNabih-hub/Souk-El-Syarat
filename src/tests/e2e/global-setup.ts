/**
 * Global Setup for E2E Tests
 * Configures the testing environment before running Playwright tests
 */

import { chromium, FullConfig, Page } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Global Setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if the application is running
    const baseURL = config.webServer?.url;
    if (!baseURL) {
      throw new Error('Web server URL is not configured');
    }
    console.log(`📍 Base URL: ${baseURL}`);

    // Wait for the application to be ready
    await page.goto(baseURL);
    await page.waitForSelector('body', { timeout: 10000 });
    
    console.log('✅ Application is ready for testing');

    // Setup test data if needed
    await setupTestData(page);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🏁 E2E Test Global Setup Complete');
}

async function setupTestData(page: Page) {
  // Add any test data setup logic here
  console.log('📋 Setting up test data...');
  
  // Example: Clear any existing test data
  // Example: Create test users, products, etc.
  
  console.log('✅ Test data setup complete');
}

export default globalSetup;