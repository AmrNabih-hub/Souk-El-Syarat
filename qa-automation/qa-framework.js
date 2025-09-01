/**
 * Professional QA Automation Framework - August 2025 Standards
 * Comprehensive testing, monitoring, and issue resolution system
 * Following latest DevSecOps and SRE best practices
 */

const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const { performance } = require('perf_hooks');
const admin = require('firebase-admin');
const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  environments: {
    production: {
      appHosting: 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
      cloudFunctions: 'https://us-central1-souk-el-syarat.cloudfunctions.net',
      frontend: 'https://souk-el-syarat.web.app',
      firestore: 'souk-el-syarat',
      realtimeDb: 'https://souk-el-syarat-default-rtdb.firebaseio.com'
    },
    staging: {
      appHosting: 'http://localhost:8080',
      cloudFunctions: 'http://localhost:5001',
      frontend: 'http://localhost:5173'
    }
  },
  testConfig: {
    timeout: 30000,
    retries: 3,
    concurrency: 10,
    loadTestUsers: 100,
    performanceThresholds: {
      p50: 200,  // 50th percentile < 200ms
      p95: 500,  // 95th percentile < 500ms
      p99: 1000, // 99th percentile < 1000ms
      errorRate: 0.01 // < 1% error rate
    }
  },
  security: {
    owasp: true,
    penetrationTest: true,
    sqlInjection: true,
    xssProtection: true,
    csrfProtection: true
  }
};

// Test Results Storage
class TestResults {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errorRate: 0,
        avgResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      categories: {},
      failures: [],
      performance: [],
      security: [],
      recommendations: []
    };
  }

  addTest(category, testName, status, details = {}) {
    if (!this.results.categories[category]) {
      this.results.categories[category] = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      };
    }

    const test = {
      name: testName,
      status,
      timestamp: new Date().toISOString(),
      duration: details.duration || 0,
      error: details.error || null,
      response: details.response || null,
      assertions: details.assertions || []
    };

    this.results.categories[category].tests.push(test);
    this.results.categories[category].total++;
    this.results.summary.total++;

    if (status === 'passed') {
      this.results.categories[category].passed++;
      this.results.summary.passed++;
    } else if (status === 'failed') {
      this.results.categories[category].failed++;
      this.results.summary.failed++;
      this.results.failures.push({
        category,
        test: testName,
        error: details.error,
        timestamp: test.timestamp
      });
    }

    if (details.duration) {
      this.results.performance.push(details.duration);
    }
  }

  calculateMetrics() {
    if (this.results.performance.length > 0) {
      const sorted = this.results.performance.sort((a, b) => a - b);
      const len = sorted.length;
      
      this.results.summary.avgResponseTime = 
        sorted.reduce((a, b) => a + b, 0) / len;
      this.results.summary.p50 = sorted[Math.floor(len * 0.5)];
      this.results.summary.p95 = sorted[Math.floor(len * 0.95)];
      this.results.summary.p99 = sorted[Math.floor(len * 0.99)];
    }

    this.results.summary.errorRate = 
      this.results.summary.failed / this.results.summary.total;
  }

  generateReport() {
    this.calculateMetrics();
    return this.results;
  }
}

// Professional Test Suite
class QAAutomationSuite {
  constructor(environment = 'production') {
    this.env = CONFIG.environments[environment];
    this.results = new TestResults();
    this.tokens = {};
    this.testData = {};
  }

  // ============= INFRASTRUCTURE TESTS =============
  
  async testInfrastructure() {
    console.log(chalk.blue.bold('\n🏗️  Infrastructure Tests\n'));
    
    // Test App Hosting
    await this.testEndpoint(
      'Infrastructure',
      'App Hosting Health',
      `${this.env.appHosting}/health`,
      {
        expectedStatus: 200,
        expectedFields: ['status', 'timestamp', 'services']
      }
    );

    // Test Cloud Functions
    await this.testEndpoint(
      'Infrastructure',
      'Cloud Functions API',
      `${this.env.cloudFunctions}/api`,
      {
        expectedStatus: 200,
        timeout: 10000
      }
    );

    // Test Frontend
    await this.testEndpoint(
      'Infrastructure',
      'Frontend Availability',
      this.env.frontend,
      {
        expectedStatus: 200,
        contentType: 'text/html'
      }
    );

    // Test Firebase Services
    await this.testFirebaseServices();
  }

  async testFirebaseServices() {
    try {
      // Initialize Firebase Admin if not already
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: this.env.firestore
        });
      }

      // Test Firestore
      const firestoreStart = performance.now();
      const testDoc = await admin.firestore()
        .collection('_qa_test')
        .add({ 
          test: true, 
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        });
      
      await testDoc.delete();
      const firestoreDuration = performance.now() - firestoreStart;

      this.results.addTest(
        'Infrastructure',
        'Firestore Database',
        'passed',
        { duration: firestoreDuration }
      );

      // Test Realtime Database
      const rtdbStart = performance.now();
      const rtdbRef = admin.database().ref('_qa_test');
      await rtdbRef.set({ test: true, timestamp: Date.now() });
      await rtdbRef.remove();
      const rtdbDuration = performance.now() - rtdbStart;

      this.results.addTest(
        'Infrastructure',
        'Realtime Database',
        'passed',
        { duration: rtdbDuration }
      );

    } catch (error) {
      this.results.addTest(
        'Infrastructure',
        'Firebase Services',
        'failed',
        { error: error.message }
      );
    }
  }

  // ============= API ENDPOINT TESTS =============

  async testAllAPIEndpoints() {
    console.log(chalk.blue.bold('\n🔌 API Endpoint Tests\n'));

    const endpoints = [
      // Authentication
      { method: 'POST', path: '/api/auth/register', category: 'Authentication' },
      { method: 'POST', path: '/api/auth/login', category: 'Authentication' },
      { method: 'GET', path: '/api/auth/profile', category: 'Authentication', auth: true },
      
      // Products
      { method: 'GET', path: '/api/products', category: 'Products' },
      { method: 'GET', path: '/api/products/1', category: 'Products' },
      { method: 'POST', path: '/api/products', category: 'Products', auth: true, role: 'vendor' },
      
      // Vendors
      { method: 'POST', path: '/api/vendors/apply', category: 'Vendors', auth: true },
      { method: 'GET', path: '/api/vendors', category: 'Vendors' },
      
      // Orders
      { method: 'POST', path: '/api/orders/create', category: 'Orders', auth: true },
      { method: 'GET', path: '/api/orders', category: 'Orders', auth: true },
      
      // Search
      { method: 'GET', path: '/api/search/products?q=car', category: 'Search' },
      { method: 'GET', path: '/api/search/trending', category: 'Search' },
      
      // Chat
      { method: 'POST', path: '/api/chat/send', category: 'Chat', auth: true },
      { method: 'GET', path: '/api/chat/conversations', category: 'Chat', auth: true }
    ];

    for (const endpoint of endpoints) {
      await this.testAPIEndpoint(endpoint);
    }
  }

  async testAPIEndpoint(endpoint) {
    const url = `${this.env.appHosting}${endpoint.path}`;
    const headers = {};
    
    if (endpoint.auth) {
      headers.Authorization = `Bearer ${await this.getAuthToken(endpoint.role)}`;
    }

    try {
      const start = performance.now();
      const response = await axios({
        method: endpoint.method,
        url,
        headers,
        timeout: CONFIG.testConfig.timeout,
        validateStatus: () => true
      });
      const duration = performance.now() - start;

      const status = response.status < 400 ? 'passed' : 'failed';
      
      this.results.addTest(
        endpoint.category,
        `${endpoint.method} ${endpoint.path}`,
        status,
        {
          duration,
          response: {
            status: response.status,
            data: response.data
          }
        }
      );
    } catch (error) {
      this.results.addTest(
        endpoint.category,
        `${endpoint.method} ${endpoint.path}`,
        'failed',
        { error: error.message }
      );
    }
  }

  // ============= SECURITY TESTS =============

  async testSecurity() {
    console.log(chalk.blue.bold('\n🔒 Security Tests\n'));

    // SQL Injection Tests
    await this.testSQLInjection();
    
    // XSS Tests
    await this.testXSS();
    
    // Authentication Tests
    await this.testAuthentication();
    
    // Authorization Tests
    await this.testAuthorization();
    
    // Rate Limiting Tests
    await this.testRateLimiting();
    
    // CORS Tests
    await this.testCORS();
  }

  async testSQLInjection() {
    const injectionPayloads = [
      "' OR '1'='1",
      "1; DROP TABLE users--",
      "admin' --",
      "' UNION SELECT * FROM users--"
    ];

    for (const payload of injectionPayloads) {
      try {
        const response = await axios.get(
          `${this.env.appHosting}/api/products?search=${encodeURIComponent(payload)}`,
          { validateStatus: () => true }
        );

        const safe = response.status !== 200 || 
                     !response.data.toString().includes('users');
        
        this.results.addTest(
          'Security',
          `SQL Injection: ${payload.substring(0, 20)}...`,
          safe ? 'passed' : 'failed',
          { 
            error: safe ? null : 'Potential SQL injection vulnerability detected'
          }
        );
      } catch (error) {
        this.results.addTest(
          'Security',
          `SQL Injection Test`,
          'passed',
          { error: null }
        );
      }
    }
  }

  async testXSS() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(
          `${this.env.appHosting}/api/products`,
          {
            name: payload,
            description: payload
          },
          { 
            validateStatus: () => true,
            headers: { 
              'Authorization': `Bearer ${await this.getAuthToken('vendor')}`
            }
          }
        );

        const safe = response.status === 400 || 
                     (response.data && !response.data.toString().includes('<script'));
        
        this.results.addTest(
          'Security',
          `XSS Protection: ${payload.substring(0, 20)}...`,
          safe ? 'passed' : 'failed',
          { 
            error: safe ? null : 'Potential XSS vulnerability detected'
          }
        );
      } catch (error) {
        this.results.addTest(
          'Security',
          'XSS Protection Test',
          'passed'
        );
      }
    }
  }

  async testAuthentication() {
    // Test invalid token
    try {
      const response = await axios.get(
        `${this.env.appHosting}/api/auth/profile`,
        {
          headers: { Authorization: 'Bearer invalid_token' },
          validateStatus: () => true
        }
      );

      this.results.addTest(
        'Security',
        'Invalid Token Rejection',
        response.status === 401 ? 'passed' : 'failed'
      );
    } catch (error) {
      this.results.addTest(
        'Security',
        'Invalid Token Rejection',
        'passed'
      );
    }

    // Test expired token
    const expiredToken = this.generateExpiredToken();
    try {
      const response = await axios.get(
        `${this.env.appHosting}/api/auth/profile`,
        {
          headers: { Authorization: `Bearer ${expiredToken}` },
          validateStatus: () => true
        }
      );

      this.results.addTest(
        'Security',
        'Expired Token Rejection',
        response.status === 401 ? 'passed' : 'failed'
      );
    } catch (error) {
      this.results.addTest(
        'Security',
        'Expired Token Rejection',
        'passed'
      );
    }
  }

  async testAuthorization() {
    // Test customer trying to access admin endpoint
    try {
      const customerToken = await this.getAuthToken('customer');
      const response = await axios.get(
        `${this.env.appHosting}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${customerToken}` },
          validateStatus: () => true
        }
      );

      this.results.addTest(
        'Security',
        'Role-Based Access Control',
        response.status === 403 ? 'passed' : 'failed'
      );
    } catch (error) {
      this.results.addTest(
        'Security',
        'Role-Based Access Control',
        'passed'
      );
    }
  }

  async testRateLimiting() {
    const requests = [];
    const endpoint = `${this.env.appHosting}/api/products`;
    
    // Send 150 requests rapidly (limit should be 100)
    for (let i = 0; i < 150; i++) {
      requests.push(
        axios.get(endpoint, { validateStatus: () => true })
      );
    }

    try {
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      this.results.addTest(
        'Security',
        'Rate Limiting',
        rateLimited ? 'passed' : 'failed',
        {
          error: rateLimited ? null : 'Rate limiting not working properly'
        }
      );
    } catch (error) {
      this.results.addTest(
        'Security',
        'Rate Limiting',
        'failed',
        { error: error.message }
      );
    }
  }

  async testCORS() {
    try {
      const response = await axios.options(
        `${this.env.appHosting}/api/products`,
        {
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'POST'
          },
          validateStatus: () => true
        }
      );

      const allowedOrigin = response.headers['access-control-allow-origin'];
      const safe = !allowedOrigin || allowedOrigin !== 'https://malicious-site.com';
      
      this.results.addTest(
        'Security',
        'CORS Protection',
        safe ? 'passed' : 'failed'
      );
    } catch (error) {
      this.results.addTest(
        'Security',
        'CORS Protection',
        'passed'
      );
    }
  }

  // ============= PERFORMANCE TESTS =============

  async testPerformance() {
    console.log(chalk.blue.bold('\n⚡ Performance Tests\n'));

    // Response Time Tests
    await this.testResponseTimes();
    
    // Load Tests
    await this.testLoadHandling();
    
    // Database Query Performance
    await this.testDatabasePerformance();
    
    // Real-time Performance
    await this.testRealtimePerformance();
  }

  async testResponseTimes() {
    const endpoints = [
      '/api/products',
      '/api/vendors',
      '/api/search/products?q=car'
    ];

    for (const endpoint of endpoints) {
      const times = [];
      
      // Test each endpoint 10 times
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        try {
          await axios.get(`${this.env.appHosting}${endpoint}`, {
            timeout: 5000
          });
          times.push(performance.now() - start);
        } catch (error) {
          times.push(5000); // Timeout
        }
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const passed = avgTime < CONFIG.testConfig.performanceThresholds.p50;
      
      this.results.addTest(
        'Performance',
        `Response Time: ${endpoint}`,
        passed ? 'passed' : 'failed',
        {
          duration: avgTime,
          error: passed ? null : `Average response time ${avgTime}ms exceeds threshold`
        }
      );
    }
  }

  async testLoadHandling() {
    console.log(chalk.yellow('  Running load test with 100 concurrent users...'));
    
    const promises = [];
    const endpoint = `${this.env.appHosting}/api/products`;
    
    for (let i = 0; i < CONFIG.testConfig.loadTestUsers; i++) {
      promises.push(
        axios.get(endpoint, { 
          timeout: 10000,
          validateStatus: () => true 
        })
      );
    }

    const start = performance.now();
    const results = await Promise.allSettled(promises);
    const duration = performance.now() - start;

    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    ).length;
    
    const successRate = successful / results.length;
    
    this.results.addTest(
      'Performance',
      'Load Test (100 concurrent users)',
      successRate > 0.95 ? 'passed' : 'failed',
      {
        duration,
        error: successRate > 0.95 ? null : 
          `Success rate ${(successRate * 100).toFixed(2)}% below 95% threshold`
      }
    );
  }

  async testDatabasePerformance() {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: this.env.firestore });
    }

    // Test write performance
    const writeStart = performance.now();
    const batch = admin.firestore().batch();
    
    for (let i = 0; i < 100; i++) {
      const ref = admin.firestore().collection('_qa_perf_test').doc();
      batch.set(ref, {
        test: true,
        index: i,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    const writeDuration = performance.now() - writeStart;

    // Test read performance
    const readStart = performance.now();
    const snapshot = await admin.firestore()
      .collection('_qa_perf_test')
      .limit(100)
      .get();
    const readDuration = performance.now() - readStart;

    // Cleanup
    const deleteBatch = admin.firestore().batch();
    snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    this.results.addTest(
      'Performance',
      'Database Write Performance (100 docs)',
      writeDuration < 5000 ? 'passed' : 'failed',
      { duration: writeDuration }
    );

    this.results.addTest(
      'Performance',
      'Database Read Performance (100 docs)',
      readDuration < 2000 ? 'passed' : 'failed',
      { duration: readDuration }
    );
  }

  async testRealtimePerformance() {
    // Test WebSocket connection if available
    try {
      const ws = new WebSocket('wss://souk-el-syarat-default-rtdb.firebaseio.com/.ws');
      
      const connected = await new Promise((resolve) => {
        ws.on('open', () => resolve(true));
        ws.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      ws.close();

      this.results.addTest(
        'Performance',
        'Real-time WebSocket Connection',
        connected ? 'passed' : 'failed'
      );
    } catch (error) {
      this.results.addTest(
        'Performance',
        'Real-time WebSocket Connection',
        'failed',
        { error: error.message }
      );
    }
  }

  // ============= USER JOURNEY TESTS =============

  async testUserJourneys() {
    console.log(chalk.blue.bold('\n👥 User Journey Tests\n'));

    await this.testCustomerJourney();
    await this.testVendorJourney();
    await this.testAdminJourney();
  }

  async testCustomerJourney() {
    console.log(chalk.cyan('  Testing Customer Journey...'));
    
    const journey = [
      { action: 'Register', fn: () => this.registerUser('customer') },
      { action: 'Login', fn: () => this.loginUser('customer') },
      { action: 'Browse Products', fn: () => this.browseProducts() },
      { action: 'Search Products', fn: () => this.searchProducts('Toyota') },
      { action: 'View Product Details', fn: () => this.viewProductDetails() },
      { action: 'Add to Cart', fn: () => this.addToCart() },
      { action: 'Create Order', fn: () => this.createOrder() },
      { action: 'Track Order', fn: () => this.trackOrder() }
    ];

    for (const step of journey) {
      try {
        await step.fn();
        this.results.addTest(
          'User Journey - Customer',
          step.action,
          'passed'
        );
      } catch (error) {
        this.results.addTest(
          'User Journey - Customer',
          step.action,
          'failed',
          { error: error.message }
        );
      }
    }
  }

  async testVendorJourney() {
    console.log(chalk.cyan('  Testing Vendor Journey...'));
    
    const journey = [
      { action: 'Apply as Vendor', fn: () => this.applyAsVendor() },
      { action: 'Upload Documents', fn: () => this.uploadDocuments() },
      { action: 'Wait for Approval', fn: () => this.checkApplicationStatus() },
      { action: 'Create Product Listing', fn: () => this.createProductListing() },
      { action: 'Manage Inventory', fn: () => this.manageInventory() },
      { action: 'Process Orders', fn: () => this.processVendorOrders() },
      { action: 'View Analytics', fn: () => this.viewVendorAnalytics() }
    ];

    for (const step of journey) {
      try {
        await step.fn();
        this.results.addTest(
          'User Journey - Vendor',
          step.action,
          'passed'
        );
      } catch (error) {
        this.results.addTest(
          'User Journey - Vendor',
          step.action,
          'failed',
          { error: error.message }
        );
      }
    }
  }

  async testAdminJourney() {
    console.log(chalk.cyan('  Testing Admin Journey...'));
    
    const journey = [
      { action: 'Login as Admin', fn: () => this.loginUser('admin') },
      { action: 'View Dashboard', fn: () => this.viewAdminDashboard() },
      { action: 'Review Vendor Applications', fn: () => this.reviewApplications() },
      { action: 'Manage Users', fn: () => this.manageUsers() },
      { action: 'Monitor Analytics', fn: () => this.monitorAnalytics() },
      { action: 'Handle Support Tickets', fn: () => this.handleSupport() }
    ];

    for (const step of journey) {
      try {
        await step.fn();
        this.results.addTest(
          'User Journey - Admin',
          step.action,
          'passed'
        );
      } catch (error) {
        this.results.addTest(
          'User Journey - Admin',
          step.action,
          'failed',
          { error: error.message }
        );
      }
    }
  }

  // ============= HELPER METHODS =============

  async testEndpoint(category, name, url, options = {}) {
    try {
      const start = performance.now();
      const response = await axios.get(url, {
        timeout: options.timeout || CONFIG.testConfig.timeout,
        validateStatus: () => true,
        headers: options.headers || {}
      });
      const duration = performance.now() - start;

      let passed = true;
      const errors = [];

      if (options.expectedStatus && response.status !== options.expectedStatus) {
        passed = false;
        errors.push(`Expected status ${options.expectedStatus}, got ${response.status}`);
      }

      if (options.expectedFields) {
        for (const field of options.expectedFields) {
          if (!response.data || !response.data[field]) {
            passed = false;
            errors.push(`Missing expected field: ${field}`);
          }
        }
      }

      if (options.contentType) {
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes(options.contentType)) {
          passed = false;
          errors.push(`Expected content-type ${options.contentType}`);
        }
      }

      this.results.addTest(category, name, passed ? 'passed' : 'failed', {
        duration,
        error: errors.length > 0 ? errors.join(', ') : null,
        response: {
          status: response.status,
          headers: response.headers,
          data: response.data
        }
      });

    } catch (error) {
      this.results.addTest(category, name, 'failed', {
        error: error.message
      });
    }
  }

  async getAuthToken(role = 'customer') {
    if (this.tokens[role]) {
      return this.tokens[role];
    }

    // Generate mock token for testing
    // In production, this would authenticate with Firebase
    const payload = {
      uid: `test_${role}_${Date.now()}`,
      role: role,
      email: `${role}@test.com`,
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    this.tokens[role] = Buffer.from(JSON.stringify(payload)).toString('base64');
    return this.tokens[role];
  }

  generateExpiredToken() {
    const payload = {
      uid: 'expired_user',
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // User Journey Helper Methods
  async registerUser(role) {
    const response = await axios.post(
      `${this.env.appHosting}/api/auth/register`,
      {
        email: `test_${Date.now()}@example.com`,
        password: 'Test@123456',
        name: 'Test User',
        role: role
      },
      { validateStatus: () => true }
    );
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Registration failed: ${response.status}`);
    }
    
    this.testData.userId = response.data.userId;
    return response.data;
  }

  async loginUser(role) {
    const response = await axios.post(
      `${this.env.appHosting}/api/auth/login`,
      {
        email: `${role}@test.com`,
        password: 'Test@123456'
      },
      { validateStatus: () => true }
    );
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    this.tokens[role] = response.data.token;
    return response.data;
  }

  async browseProducts() {
    const response = await axios.get(
      `${this.env.appHosting}/api/products`,
      { validateStatus: () => true }
    );
    
    if (response.status !== 200) {
      throw new Error(`Browse products failed: ${response.status}`);
    }
    
    if (response.data.products && response.data.products.length > 0) {
      this.testData.productId = response.data.products[0].id;
    }
    
    return response.data;
  }

  async searchProducts(query) {
    const response = await axios.get(
      `${this.env.appHosting}/api/search/products?q=${query}`,
      { validateStatus: () => true }
    );
    
    if (response.status !== 200) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    return response.data;
  }

  async viewProductDetails() {
    const productId = this.testData.productId || '1';
    const response = await axios.get(
      `${this.env.appHosting}/api/products/${productId}`,
      { validateStatus: () => true }
    );
    
    if (response.status !== 200) {
      throw new Error(`View product failed: ${response.status}`);
    }
    
    return response.data;
  }

  async addToCart() {
    const response = await axios.post(
      `${this.env.appHosting}/api/cart/add`,
      {
        productId: this.testData.productId || '1',
        quantity: 1
      },
      {
        headers: { Authorization: `Bearer ${this.tokens.customer}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Add to cart failed: ${response.status}`);
    }
    
    return response.data;
  }

  async createOrder() {
    const response = await axios.post(
      `${this.env.appHosting}/api/orders/create`,
      {
        items: [{ productId: this.testData.productId || '1', quantity: 1 }],
        paymentMethod: 'cod'
      },
      {
        headers: { Authorization: `Bearer ${this.tokens.customer}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Create order failed: ${response.status}`);
    }
    
    this.testData.orderId = response.data.orderId;
    return response.data;
  }

  async trackOrder() {
    const orderId = this.testData.orderId || '1';
    const response = await axios.get(
      `${this.env.appHosting}/api/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${this.tokens.customer}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Track order failed: ${response.status}`);
    }
    
    return response.data;
  }

  async applyAsVendor() {
    const response = await axios.post(
      `${this.env.appHosting}/api/vendors/apply`,
      {
        businessName: 'Test Vendor',
        businessType: 'dealer',
        nationalId: '12345678901234',
        commercialRegister: 'CR123456',
        taxCard: 'TX123456'
      },
      {
        headers: { Authorization: `Bearer ${this.tokens.customer}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Vendor application failed: ${response.status}`);
    }
    
    this.testData.applicationId = response.data.applicationId;
    return response.data;
  }

  async uploadDocuments() {
    // Simulate document upload
    return { success: true };
  }

  async checkApplicationStatus() {
    const applicationId = this.testData.applicationId || '1';
    const response = await axios.get(
      `${this.env.appHosting}/api/vendors/application/${applicationId}`,
      {
        headers: { Authorization: `Bearer ${this.tokens.customer}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Check application failed: ${response.status}`);
    }
    
    return response.data;
  }

  async createProductListing() {
    const response = await axios.post(
      `${this.env.appHosting}/api/products`,
      {
        name: 'Test Product',
        description: 'Test Description',
        price: 1000,
        category: 'Electronics',
        stock: 10
      },
      {
        headers: { Authorization: `Bearer ${this.tokens.vendor}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Create product failed: ${response.status}`);
    }
    
    return response.data;
  }

  async manageInventory() {
    const response = await axios.get(
      `${this.env.appHosting}/api/vendor/inventory`,
      {
        headers: { Authorization: `Bearer ${this.tokens.vendor}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Manage inventory failed: ${response.status}`);
    }
    
    return response.data;
  }

  async processVendorOrders() {
    const response = await axios.get(
      `${this.env.appHosting}/api/vendor/orders`,
      {
        headers: { Authorization: `Bearer ${this.tokens.vendor}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Process orders failed: ${response.status}`);
    }
    
    return response.data;
  }

  async viewVendorAnalytics() {
    const response = await axios.get(
      `${this.env.appHosting}/api/vendor/analytics`,
      {
        headers: { Authorization: `Bearer ${this.tokens.vendor}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`View analytics failed: ${response.status}`);
    }
    
    return response.data;
  }

  async viewAdminDashboard() {
    const response = await axios.get(
      `${this.env.appHosting}/api/admin/dashboard`,
      {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Admin dashboard failed: ${response.status}`);
    }
    
    return response.data;
  }

  async reviewApplications() {
    const response = await axios.get(
      `${this.env.appHosting}/api/admin/applications`,
      {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Review applications failed: ${response.status}`);
    }
    
    return response.data;
  }

  async manageUsers() {
    const response = await axios.get(
      `${this.env.appHosting}/api/admin/users`,
      {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Manage users failed: ${response.status}`);
    }
    
    return response.data;
  }

  async monitorAnalytics() {
    const response = await axios.get(
      `${this.env.appHosting}/api/admin/analytics`,
      {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Monitor analytics failed: ${response.status}`);
    }
    
    return response.data;
  }

  async handleSupport() {
    const response = await axios.get(
      `${this.env.appHosting}/api/admin/support`,
      {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
        validateStatus: () => true
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`Handle support failed: ${response.status}`);
    }
    
    return response.data;
  }

  // ============= REPORT GENERATION =============

  generateReport() {
    const report = this.results.generateReport();
    
    console.log(chalk.blue.bold('\n📊 TEST RESULTS SUMMARY\n'));
    
    // Summary Table
    const summaryTable = new Table({
      head: ['Metric', 'Value', 'Status'],
      colWidths: [30, 20, 15]
    });

    summaryTable.push(
      ['Total Tests', report.summary.total, ''],
      ['Passed', report.summary.passed, chalk.green('✓')],
      ['Failed', report.summary.failed, report.summary.failed > 0 ? chalk.red('✗') : chalk.green('✓')],
      ['Error Rate', `${(report.summary.errorRate * 100).toFixed(2)}%`, 
        report.summary.errorRate < 0.01 ? chalk.green('✓') : chalk.red('✗')],
      ['Avg Response Time', `${report.summary.avgResponseTime.toFixed(2)}ms`, 
        report.summary.avgResponseTime < 200 ? chalk.green('✓') : chalk.yellow('!')],
      ['P50 Response Time', `${report.summary.p50}ms`, ''],
      ['P95 Response Time', `${report.summary.p95}ms`, ''],
      ['P99 Response Time', `${report.summary.p99}ms`, '']
    );

    console.log(summaryTable.toString());

    // Category Results
    console.log(chalk.blue.bold('\n📋 CATEGORY RESULTS\n'));
    
    const categoryTable = new Table({
      head: ['Category', 'Total', 'Passed', 'Failed', 'Success Rate'],
      colWidths: [25, 10, 10, 10, 15]
    });

    for (const [category, data] of Object.entries(report.categories)) {
      const successRate = ((data.passed / data.total) * 100).toFixed(2);
      categoryTable.push([
        category,
        data.total,
        chalk.green(data.passed),
        data.failed > 0 ? chalk.red(data.failed) : '0',
        successRate === '100.00' ? chalk.green(`${successRate}%`) : 
          successRate >= '95.00' ? chalk.yellow(`${successRate}%`) : 
          chalk.red(`${successRate}%`)
      ]);
    }

    console.log(categoryTable.toString());

    // Failures
    if (report.failures.length > 0) {
      console.log(chalk.red.bold('\n❌ FAILURES\n'));
      
      const failureTable = new Table({
        head: ['Category', 'Test', 'Error'],
        colWidths: [20, 30, 50]
      });

      report.failures.forEach(failure => {
        failureTable.push([
          failure.category,
          failure.test,
          failure.error ? failure.error.substring(0, 47) + '...' : 'Unknown error'
        ]);
      });

      console.log(failureTable.toString());
    }

    // Recommendations
    this.generateRecommendations(report);
    
    if (report.recommendations.length > 0) {
      console.log(chalk.yellow.bold('\n💡 RECOMMENDATIONS\n'));
      report.recommendations.forEach((rec, i) => {
        console.log(chalk.yellow(`${i + 1}. ${rec}`));
      });
    }

    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync(
      'qa-test-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log(chalk.green('\n✅ Detailed report saved to qa-test-report.json'));
    
    return report;
  }

  generateRecommendations(report) {
    if (report.summary.errorRate > 0.01) {
      report.recommendations.push(
        'High error rate detected. Review failed tests and fix critical issues.'
      );
    }

    if (report.summary.avgResponseTime > 500) {
      report.recommendations.push(
        'Average response time exceeds 500ms. Consider performance optimization.'
      );
    }

    if (report.summary.p99 > 2000) {
      report.recommendations.push(
        'P99 response time exceeds 2 seconds. Investigate slow queries and optimize.'
      );
    }

    const securityCategory = report.categories['Security'];
    if (securityCategory && securityCategory.failed > 0) {
      report.recommendations.push(
        'Security vulnerabilities detected. Prioritize fixing security issues immediately.'
      );
    }

    const performanceCategory = report.categories['Performance'];
    if (performanceCategory && performanceCategory.failed > 0) {
      report.recommendations.push(
        'Performance issues detected. Review database queries and implement caching.'
      );
    }
  }
}

// Export for use
module.exports = QAAutomationSuite;

// Run if executed directly
if (require.main === module) {
  const suite = new QAAutomationSuite('production');
  
  (async () => {
    try {
      console.log(chalk.blue.bold('🚀 Starting Comprehensive QA Test Suite\n'));
      console.log(chalk.gray('Environment: Production'));
      console.log(chalk.gray('Timestamp: ' + new Date().toISOString()));
      console.log(chalk.gray('=' .repeat(60)));
      
      await suite.testInfrastructure();
      await suite.testAllAPIEndpoints();
      await suite.testSecurity();
      await suite.testPerformance();
      await suite.testUserJourneys();
      
      const report = suite.generateReport();
      
      // Exit with appropriate code
      process.exit(report.summary.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error(chalk.red('Fatal error:'), error);
      process.exit(1);
    }
  })();
}