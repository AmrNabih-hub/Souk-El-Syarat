#!/usr/bin/env node

import fetch from 'node-fetch';
import { promises as fs } from 'fs';

const API_URL = 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app';
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

let testResults = {
  passed: [],
  failed: [],
  warnings: [],
  errors: []
};

// Helper function to make requests
async function testEndpoint(name, url, options = {}) {
  const startTime = Date.now();
  try {
    console.log(`\n${COLORS.BLUE}Testing: ${name}${COLORS.RESET}`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.text();
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Not JSON response
    }
    
    const result = {
      name,
      url,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      headers: Object.fromEntries(response.headers.entries()),
      data: jsonData || data,
      success: response.ok
    };
    
    if (response.ok) {
      console.log(`${COLORS.GREEN}✅ PASS${COLORS.RESET} - Status: ${response.status} - Time: ${responseTime}ms`);
      testResults.passed.push(result);
    } else {
      console.log(`${COLORS.RED}❌ FAIL${COLORS.RESET} - Status: ${response.status} - ${response.statusText}`);
      testResults.failed.push(result);
    }
    
    return result;
  } catch (error) {
    console.log(`${COLORS.RED}❌ ERROR${COLORS.RESET} - ${error.message}`);
    const errorResult = {
      name,
      url,
      error: error.message,
      responseTime: Date.now() - startTime
    };
    testResults.errors.push(errorResult);
    return errorResult;
  }
}

// Main test suite
async function runTests() {
  console.log(`${COLORS.BOLD}
╔════════════════════════════════════════════════════════════╗
║     🧪 COMPREHENSIVE BACKEND TESTING SUITE                ║
║     Backend: Souk El-Syarat                               ║
║     Time: ${new Date().toISOString()}     ║
╚════════════════════════════════════════════════════════════╝
${COLORS.RESET}`);

  console.log('\n📋 Starting comprehensive tests...\n');
  console.log('=' .repeat(60));

  // Wait a bit for permissions to propagate
  console.log('\n⏳ Waiting 5 seconds for IAM permissions to fully propagate...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 1. INFRASTRUCTURE TESTS
  console.log(`\n${COLORS.BOLD}1️⃣ INFRASTRUCTURE TESTS${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  await testEndpoint('Root Endpoint', `${API_URL}/`);
  await testEndpoint('Health Check', `${API_URL}/health`);
  await testEndpoint('Robots.txt', `${API_URL}/robots.txt`);
  await testEndpoint('Non-existent endpoint (should 404)', `${API_URL}/api/nonexistent`);

  // 2. PUBLIC API TESTS
  console.log(`\n${COLORS.BOLD}2️⃣ PUBLIC API TESTS${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  await testEndpoint('Get Products', `${API_URL}/api/products`);
  await testEndpoint('Get Products with Limit', `${API_URL}/api/products?limit=5`);
  await testEndpoint('Get Products with Filters', `${API_URL}/api/products?category=cars&minPrice=10000&maxPrice=50000`);
  await testEndpoint('Get Categories', `${API_URL}/api/categories`);
  
  // 3. SEARCH TESTS
  console.log(`\n${COLORS.BOLD}3️⃣ SEARCH FUNCTIONALITY${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  await testEndpoint('Search - Valid Query', `${API_URL}/api/search`, {
    method: 'POST',
    body: JSON.stringify({ query: 'car' })
  });
  
  await testEndpoint('Search - Empty Query (should fail)', `${API_URL}/api/search`, {
    method: 'POST',
    body: JSON.stringify({ query: '' })
  });
  
  await testEndpoint('Search - Short Query (should fail)', `${API_URL}/api/search`, {
    method: 'POST',
    body: JSON.stringify({ query: 'a' })
  });

  // 4. AUTHENTICATION TESTS
  console.log(`\n${COLORS.BOLD}4️⃣ AUTHENTICATION TESTS${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  const testEmail = `test_${Date.now()}@example.com`;
  const registerResult = await testEndpoint('User Registration', `${API_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'Test123!@#',
      displayName: 'Test User',
      phoneNumber: '+201234567890'
    })
  });
  
  await testEndpoint('Registration - Missing Fields (should fail)', `${API_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'incomplete@test.com'
    })
  });
  
  await testEndpoint('Registration - Weak Password (should fail)', `${API_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'weak@test.com',
      password: '123',
      displayName: 'Weak Pass'
    })
  });
  
  // Try duplicate registration
  if (registerResult.success) {
    await testEndpoint('Registration - Duplicate Email (should fail)', `${API_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'Test123!@#',
        displayName: 'Duplicate User'
      })
    });
  }

  // 5. PROTECTED ENDPOINTS TESTS
  console.log(`\n${COLORS.BOLD}5️⃣ PROTECTED ENDPOINTS (Without Auth)${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  await testEndpoint('Get Orders - No Auth (should fail)', `${API_URL}/api/orders`);
  await testEndpoint('Create Order - No Auth (should fail)', `${API_URL}/api/orders`, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: 'test', quantity: 1 }],
      shippingAddress: 'Test Address'
    })
  });
  await testEndpoint('Vendor Apply - No Auth (should fail)', `${API_URL}/api/vendor/apply`, {
    method: 'POST',
    body: JSON.stringify({
      businessName: 'Test Business'
    })
  });
  await testEndpoint('Admin Users - No Auth (should fail)', `${API_URL}/api/admin/users`);

  // 6. CORS AND SECURITY TESTS
  console.log(`\n${COLORS.BOLD}6️⃣ CORS AND SECURITY TESTS${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  await testEndpoint('CORS - Valid Origin', `${API_URL}/api/products`, {
    headers: {
      'Origin': 'https://souk-el-syarat.web.app'
    }
  });
  
  await testEndpoint('CORS - Invalid Origin', `${API_URL}/api/products`, {
    headers: {
      'Origin': 'https://evil-site.com'
    }
  });
  
  await testEndpoint('OPTIONS Preflight', `${API_URL}/api/products`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://souk-el-syarat.web.app',
      'Access-Control-Request-Method': 'POST'
    }
  });

  // 7. PERFORMANCE TESTS
  console.log(`\n${COLORS.BOLD}7️⃣ PERFORMANCE TESTS${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  const perfTests = [];
  console.log('Running 10 concurrent requests...');
  for (let i = 0; i < 10; i++) {
    perfTests.push(
      fetch(`${API_URL}/health`).then(r => ({ 
        status: r.status, 
        time: Date.now() 
      }))
    );
  }
  
  const perfResults = await Promise.all(perfTests);
  const avgTime = perfResults.reduce((sum, r) => sum + r.time, 0) / perfResults.length;
  console.log(`Average response time: ${avgTime - perfResults[0].time}ms`);

  // 8. ERROR HANDLING TESTS
  console.log(`\n${COLORS.BOLD}8️⃣ ERROR HANDLING TESTS${COLORS.RESET}`);
  console.log('-'.repeat(60));
  
  await testEndpoint('Invalid JSON Body', `${API_URL}/api/search`, {
    method: 'POST',
    body: 'invalid json {{'
  });
  
  await testEndpoint('Large Payload', `${API_URL}/api/products`, {
    method: 'POST',
    body: JSON.stringify({ data: 'x'.repeat(11 * 1024 * 1024) }) // 11MB
  });

  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log(`${COLORS.BOLD}📊 TEST RESULTS SUMMARY${COLORS.RESET}`);
  console.log('='.repeat(60));
  
  console.log(`\n${COLORS.GREEN}✅ PASSED: ${testResults.passed.length}${COLORS.RESET}`);
  testResults.passed.forEach(t => {
    console.log(`   - ${t.name} (${t.responseTime}ms)`);
  });
  
  console.log(`\n${COLORS.RED}❌ FAILED: ${testResults.failed.length}${COLORS.RESET}`);
  testResults.failed.forEach(t => {
    console.log(`   - ${t.name}: ${t.status} ${t.statusText}`);
  });
  
  console.log(`\n${COLORS.RED}🔥 ERRORS: ${testResults.errors.length}${COLORS.RESET}`);
  testResults.errors.forEach(t => {
    console.log(`   - ${t.name}: ${t.error}`);
  });
  
  // Check critical services
  console.log('\n' + '='.repeat(60));
  console.log(`${COLORS.BOLD}🏥 HEALTH CHECK ANALYSIS${COLORS.RESET}`);
  console.log('='.repeat(60));
  
  const healthTest = testResults.passed.find(t => t.name === 'Health Check') || 
                     testResults.failed.find(t => t.name === 'Health Check');
  
  if (healthTest && healthTest.data) {
    console.log('\nServices Status:');
    if (healthTest.data.services) {
      Object.entries(healthTest.data.services).forEach(([service, status]) => {
        const icon = status === 'connected' || status === 'active' ? '✅' : '❌';
        console.log(`  ${icon} ${service}: ${status}`);
      });
    }
    
    if (healthTest.data.status === 'healthy') {
      console.log(`\n${COLORS.GREEN}🎉 Backend is HEALTHY and operational!${COLORS.RESET}`);
    } else {
      console.log(`\n${COLORS.YELLOW}⚠️ Backend is running but some services need attention${COLORS.RESET}`);
      if (healthTest.data.error) {
        console.log(`Error: ${healthTest.data.error}`);
      }
    }
  }
  
  // Performance Analysis
  console.log('\n' + '='.repeat(60));
  console.log(`${COLORS.BOLD}⚡ PERFORMANCE ANALYSIS${COLORS.RESET}`);
  console.log('='.repeat(60));
  
  const responseTimes = testResults.passed.map(t => t.responseTime);
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    console.log(`\n  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Fastest Response: ${minResponseTime}ms`);
    console.log(`  Slowest Response: ${maxResponseTime}ms`);
    
    if (avgResponseTime < 200) {
      console.log(`  ${COLORS.GREEN}✅ Excellent performance!${COLORS.RESET}`);
    } else if (avgResponseTime < 500) {
      console.log(`  ${COLORS.YELLOW}⚠️ Good performance, could be optimized${COLORS.RESET}`);
    } else {
      console.log(`  ${COLORS.RED}❌ Performance needs improvement${COLORS.RESET}`);
    }
  }
  
  // Security Analysis
  console.log('\n' + '='.repeat(60));
  console.log(`${COLORS.BOLD}🔒 SECURITY ANALYSIS${COLORS.RESET}`);
  console.log('='.repeat(60));
  
  const securityChecks = {
    'Protected endpoints reject unauthorized': testResults.failed.some(t => 
      t.name.includes('No Auth') && t.status === 401
    ),
    'CORS blocks invalid origins': testResults.failed.some(t => 
      t.name.includes('Invalid Origin')
    ),
    'Rate limiting headers present': testResults.passed.some(t => 
      t.headers && (t.headers['x-ratelimit-limit'] || t.headers['x-rate-limit-limit'])
    ),
    'Security headers present': testResults.passed.some(t => 
      t.headers && t.headers['x-content-type-options']
    )
  };
  
  console.log('\nSecurity Checks:');
  Object.entries(securityChecks).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${check}`);
  });
  
  // Final Verdict
  console.log('\n' + '='.repeat(60));
  console.log(`${COLORS.BOLD}🎯 FINAL VERDICT${COLORS.RESET}`);
  console.log('='.repeat(60));
  
  const totalTests = testResults.passed.length + testResults.failed.length + testResults.errors.length;
  const successRate = (testResults.passed.length / totalTests * 100).toFixed(1);
  
  console.log(`\n  Total Tests: ${totalTests}`);
  console.log(`  Success Rate: ${successRate}%`);
  
  if (successRate >= 80) {
    console.log(`\n${COLORS.GREEN}${COLORS.BOLD}✅ BACKEND IS PRODUCTION READY!${COLORS.RESET}`);
  } else if (successRate >= 60) {
    console.log(`\n${COLORS.YELLOW}${COLORS.BOLD}⚠️ BACKEND NEEDS SOME FIXES${COLORS.RESET}`);
  } else {
    console.log(`\n${COLORS.RED}${COLORS.BOLD}❌ BACKEND REQUIRES ATTENTION${COLORS.RESET}`);
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      errors: testResults.errors.length,
      successRate: successRate
    },
    details: testResults,
    analysis: {
      health: healthTest?.data,
      security: securityChecks,
      performance: {
        avg: avgResponseTime,
        min: minResponseTime,
        max: maxResponseTime
      }
    }
  };
  
  await fs.writeFile(
    'backend-test-report.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: backend-test-report.json');
  console.log('\n' + '='.repeat(60));
  console.log('Testing complete!\n');
}

// Run tests
runTests().catch(console.error);