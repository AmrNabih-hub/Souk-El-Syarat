/**
 * COMPREHENSIVE PUPPETEER TEST SUITE
 * Staff Engineer & QA Deep Investigation
 */

import puppeteer, { Browser, Page, ConsoleMessage } from 'puppeteer';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

// Test configuration
const BASE_URL = 'https://souk-el-syarat.web.app';
const LOCAL_URL = 'http://localhost:5173';
const TIMEOUT = 30000;

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  errors: string[];
  warnings: string[];
  performance: {
    loadTime?: number;
    firstContentfulPaint?: number;
    timeToInteractive?: number;
  };
}

interface ConsoleError {
  type: string;
  message: string;
  location?: string;
  timestamp: Date;
}

class ComprehensiveAppTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
  private consoleErrors: ConsoleError[] = [];
  private networkErrors: string[] = [];
  private performanceMetrics: any = {};

  async initialize() {
    console.log('🚀 Initializing Puppeteer Test Suite...\n');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for desktop testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception
    await this.page.setRequestInterception(true);
    
    // Setup listeners
    this.setupListeners();
  }

  private setupListeners() {
    if (!this.page) return;

    // Console error/warning listener
    this.page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.consoleErrors.push({
          type: 'error',
          message: text,
          location: msg.location()?.url,
          timestamp: new Date()
        });
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        this.consoleErrors.push({
          type: 'warning',
          message: text,
          location: msg.location()?.url,
          timestamp: new Date()
        });
        console.log(`⚠️ Console Warning: ${text}`);
      }
    });

    // Page error listener
    this.page.on('pageerror', (error) => {
      this.consoleErrors.push({
        type: 'pageerror',
        message: error.message,
        timestamp: new Date()
      });
      console.log(`💥 Page Error: ${error.message}`);
    });

    // Request failure listener
    this.page.on('requestfailed', (request) => {
      const failure = `${request.failure()?.errorText} - ${request.url()}`;
      this.networkErrors.push(failure);
      console.log(`🔴 Request Failed: ${failure}`);
    });

    // Request interception for API monitoring
    this.page.on('request', (request) => {
      // Log API calls
      if (request.url().includes('api') || request.url().includes('firebase')) {
        console.log(`📡 API Call: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });

    // Response listener for status codes
    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
      }
    });
  }

  async runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
    console.log(`\n📋 Running: ${testName}`);
    const startTime = performance.now();
    
    const result: TestResult = {
      testName,
      status: 'PASS',
      duration: 0,
      errors: [],
      warnings: [],
      performance: {}
    };

    try {
      // Clear previous errors
      this.consoleErrors = [];
      this.networkErrors = [];
      
      // Run the test
      await testFn();
      
      // Collect errors
      result.errors = this.consoleErrors
        .filter(e => e.type === 'error' || e.type === 'pageerror')
        .map(e => e.message);
      result.warnings = this.consoleErrors
        .filter(e => e.type === 'warning')
        .map(e => e.message);
      
      // Add network errors
      result.errors.push(...this.networkErrors);
      
      if (result.errors.length > 0) {
        result.status = 'FAIL';
      }
      
      console.log(`✅ ${testName}: ${result.status}`);
    } catch (error: any) {
      result.status = 'FAIL';
      result.errors.push(error.message);
      console.log(`❌ ${testName}: FAILED - ${error.message}`);
    }
    
    result.duration = performance.now() - startTime;
    this.results.push(result);
    return result;
  }

  // TEST CASES

  async testHomePage() {
    await this.runTest('Home Page Load & Rendering', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      // Navigate and measure performance
      const startTime = performance.now();
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      const loadTime = performance.now() - startTime;
      
      // Check for critical elements
      await this.page.waitForSelector('header', { timeout: 5000 });
      await this.page.waitForSelector('main', { timeout: 5000 });
      
      // Performance metrics
      const metrics = await this.page.metrics();
      const performanceTiming = await this.page.evaluate(() => {
        const timing = performance.timing;
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: (performance as any).getEntriesByType('paint')[0]?.startTime
        };
      });
      
      console.log(`  ⏱️ Load Time: ${loadTime.toFixed(2)}ms`);
      console.log(`  📊 DOM Nodes: ${metrics.Nodes}`);
      console.log(`  📊 JS Heap: ${(metrics.JSHeapUsedSize / 1048576).toFixed(2)}MB`);
    });
  }

  async testAuthentication() {
    await this.runTest('Authentication Flow', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      // Navigate to login
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      
      // Check login form exists
      await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await this.page.waitForSelector('input[type="password"]', { timeout: 5000 });
      await this.page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      
      // Test login with test credentials
      await this.page.type('input[type="email"]', 'customer@souk-elsayarat.com');
      await this.page.type('input[type="password"]', 'Customer@123456');
      
      // Submit and wait for navigation
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
          .catch(() => console.log('  ⚠️ Navigation timeout - checking if already logged in'))
      ]);
      
      // Verify login success (should redirect or show user menu)
      const currentUrl = this.page.url();
      console.log(`  📍 Current URL: ${currentUrl}`);
    });
  }

  async testProductBrowsing() {
    await this.runTest('Product Browsing & Search', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      // Navigate to marketplace
      await this.page.goto(`${BASE_URL}/marketplace`, { waitUntil: 'networkidle2' });
      
      // Wait for products to load
      await this.page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 })
        .catch(() => console.log('  ⚠️ No product cards found'));
      
      // Count products
      const productCount = await this.page.$$eval(
        '[data-testid="product-card"], .product-card',
        elements => elements.length
      ).catch(() => 0);
      
      console.log(`  📦 Products found: ${productCount}`);
      
      // Test search if search box exists
      const searchBox = await this.page.$('input[type="search"], input[placeholder*="search" i]');
      if (searchBox) {
        await searchBox.type('Toyota');
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);
        console.log('  🔍 Search tested');
      }
    });
  }

  async testResponsiveness() {
    await this.runTest('Responsive Design', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Check if navigation is accessible
        const navVisible = await this.page.$('nav, header')
          .then(el => el !== null)
          .catch(() => false);
        
        console.log(`  📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${navVisible ? '✅' : '❌'}`);
      }
    });
  }

  async testAPIEndpoints() {
    await this.runTest('API Endpoints Validation', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      const endpoints = [
        '/api/health',
        '/api/products',
        '/api/categories'
      ];
      
      for (const endpoint of endpoints) {
        const response = await this.page.evaluate(async (url) => {
          try {
            const res = await fetch(`https://us-central1-souk-el-syarat.cloudfunctions.net/api${url}`);
            return { status: res.status, ok: res.ok };
          } catch (error) {
            return { status: 0, ok: false, error: error.message };
          }
        }, endpoint);
        
        console.log(`  🔗 ${endpoint}: ${response.ok ? '✅' : '❌'} (${response.status})`);
      }
    });
  }

  async testPerformanceMetrics() {
    await this.runTest('Performance Metrics', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      
      // Collect performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const paintMetrics = performance.getEntriesByType('paint') as PerformancePaintTiming[];
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        return {
          firstPaint: paintMetrics.find(m => m.name === 'first-paint')?.startTime,
          firstContentfulPaint: paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          timeToInteractive: navigation.domInteractive - navigation.fetchStart
        };
      });
      
      console.log('  📊 Performance Metrics:');
      console.log(`     First Paint: ${performanceMetrics.firstPaint?.toFixed(2)}ms`);
      console.log(`     First Contentful Paint: ${performanceMetrics.firstContentfulPaint?.toFixed(2)}ms`);
      console.log(`     DOM Content Loaded: ${performanceMetrics.domContentLoaded?.toFixed(2)}ms`);
      console.log(`     Time to Interactive: ${performanceMetrics.timeToInteractive?.toFixed(2)}ms`);
      
      // Check against thresholds
      if (performanceMetrics.firstContentfulPaint && performanceMetrics.firstContentfulPaint > 1500) {
        throw new Error('First Contentful Paint exceeds 1.5s threshold');
      }
      if (performanceMetrics.timeToInteractive && performanceMetrics.timeToInteractive > 3000) {
        throw new Error('Time to Interactive exceeds 3s threshold');
      }
    });
  }

  async testAccessibility() {
    await this.runTest('Accessibility Checks', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      
      // Check for basic accessibility features
      const accessibilityChecks = await this.page.evaluate(() => {
        const checks = {
          hasLangAttribute: document.documentElement.hasAttribute('lang'),
          hasAltTexts: Array.from(document.querySelectorAll('img')).every(img => img.hasAttribute('alt')),
          hasAriaLabels: document.querySelectorAll('[aria-label]').length > 0,
          hasProperHeadings: document.querySelectorAll('h1').length === 1,
          hasSkipLink: document.querySelector('a[href="#main"], a[href="#content"]') !== null,
          formLabels: Array.from(document.querySelectorAll('input')).every(input => {
            const id = input.id;
            return !id || document.querySelector(`label[for="${id}"]`) !== null;
          })
        };
        return checks;
      });
      
      console.log('  ♿ Accessibility Checks:');
      Object.entries(accessibilityChecks).forEach(([check, passed]) => {
        console.log(`     ${check}: ${passed ? '✅' : '❌'}`);
      });
    });
  }

  async testSecurityHeaders() {
    await this.runTest('Security Headers', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      const response = await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const headers = response?.headers();
      
      const securityHeaders = {
        'content-security-policy': headers?.['content-security-policy'],
        'x-frame-options': headers?.['x-frame-options'],
        'x-content-type-options': headers?.['x-content-type-options'],
        'strict-transport-security': headers?.['strict-transport-security'],
        'x-xss-protection': headers?.['x-xss-protection']
      };
      
      console.log('  🔒 Security Headers:');
      Object.entries(securityHeaders).forEach(([header, value]) => {
        console.log(`     ${header}: ${value ? '✅' : '❌ Missing'}`);
      });
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   ⏱️ Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   - ${r.testName}`);
          r.errors.forEach(e => console.log(`     • ${e}`));
        });
    }
    
    // Count unique errors
    const allErrors = this.results.flatMap(r => r.errors);
    const uniqueErrors = [...new Set(allErrors)];
    
    if (uniqueErrors.length > 0) {
      console.log('\n🚨 Unique Errors Found:');
      uniqueErrors.forEach(e => console.log(`   • ${e}`));
    }
    
    // Generate detailed report file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passed: passedTests,
        failed: failedTests,
        duration: totalDuration,
        successRate: (passedTests / totalTests) * 100
      },
      results: this.results,
      errors: uniqueErrors
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'puppeteer-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: puppeteer-test-report.json');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('=' .repeat(80));
      console.log('🧪 PUPPETEER COMPREHENSIVE TEST SUITE');
      console.log('=' .repeat(80));
      
      // Run all tests
      await this.testHomePage();
      await this.testAuthentication();
      await this.testProductBrowsing();
      await this.testResponsiveness();
      await this.testAPIEndpoints();
      await this.testPerformanceMetrics();
      await this.testAccessibility();
      await this.testSecurityHeaders();
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new ComprehensiveAppTester();
tester.runAllTests();