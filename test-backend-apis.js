#!/usr/bin/env node

/**
 * COMPREHENSIVE BACKEND API TESTING SCRIPT
 * Tests all endpoints and validates responses
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make API calls
async function testEndpoint(method, endpoint, data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    const result = {
      endpoint,
      method,
      status: response.status,
      responseTime: `${responseTime}ms`,
      success: response.ok,
      data: responseData
    };
    
    if (response.ok) {
      TEST_RESULTS.passed++;
      console.log(`✅ ${method} ${endpoint} - ${response.status} (${responseTime}ms)`);
    } else {
      TEST_RESULTS.failed++;
      console.log(`❌ ${method} ${endpoint} - ${response.status} (${responseTime}ms)`);
      console.log(`   Error: ${JSON.stringify(responseData)}`);
    }
    
    TEST_RESULTS.total++;
    TEST_RESULTS.details.push(result);
    
    return result;
  } catch (error) {
    TEST_RESULTS.failed++;
    TEST_RESULTS.total++;
    console.log(`💥 ${method} ${endpoint} - ERROR: ${error.message}`);
    return { endpoint, method, error: error.message, success: false };
  }
}

// Test all endpoints
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Backend API Testing...\n');
  
  // 1. Health Check Tests
  console.log('📊 HEALTH CHECK TESTS');
  console.log('====================');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/');
  await testEndpoint('GET', '/api');
  console.log('');
  
  // 2. Authentication Tests
  console.log('🔐 AUTHENTICATION TESTS');
  console.log('=======================');
  
  // Test registration
  await testEndpoint('POST', '/api/auth/register', {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'customer'
  });
  
  // Test login
  await testEndpoint('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  // Test invalid login
  await testEndpoint('POST', '/api/auth/login', {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  });
  console.log('');
  
  // 3. Products Tests
  console.log('🛍️ PRODUCTS TESTS');
  console.log('==================');
  await testEndpoint('GET', '/api/products');
  await testEndpoint('GET', '/api/products?page=1&limit=10');
  await testEndpoint('GET', '/api/products?category=cars');
  await testEndpoint('GET', '/api/products/nonexistent-id');
  console.log('');
  
  // 4. Vendors Tests
  console.log('🏪 VENDORS TESTS');
  console.log('=================');
  await testEndpoint('GET', '/api/vendors');
  await testEndpoint('GET', '/api/vendors?page=1&limit=10');
  await testEndpoint('GET', '/api/vendors/nonexistent-id');
  console.log('');
  
  // 5. Search Tests
  console.log('🔍 SEARCH TESTS');
  console.log('================');
  await testEndpoint('GET', '/api/search/products?q=car');
  await testEndpoint('GET', '/api/search/products?q=bmw');
  await testEndpoint('GET', '/api/search/products?q=mercedes&category=cars');
  await testEndpoint('GET', '/api/search/products?q=audi&minPrice=10000&maxPrice=50000');
  console.log('');
  
  // 6. Orders Tests (without authentication)
  console.log('📦 ORDERS TESTS (Unauthenticated)');
  console.log('==================================');
  await testEndpoint('GET', '/api/orders');
  await testEndpoint('POST', '/api/orders/create', {
    items: [{ productId: 'test', quantity: 1, price: 100 }],
    shippingAddress: { street: 'Test St', city: 'Cairo' },
    paymentMethod: 'credit_card'
  });
  console.log('');
  
  // 7. Users Tests (without authentication)
  console.log('👤 USERS TESTS (Unauthenticated)');
  console.log('=================================');
  await testEndpoint('GET', '/api/users/profile');
  await testEndpoint('PUT', '/api/users/profile', {
    name: 'Updated Name'
  });
  console.log('');
  
  // 8. Error Handling Tests
  console.log('⚠️ ERROR HANDLING TESTS');
  console.log('========================');
  await testEndpoint('GET', '/nonexistent-endpoint');
  await testEndpoint('POST', '/api/auth/register', {
    email: 'invalid-email',
    password: '123'
  });
  console.log('');
  
  // 8. Performance Tests
  console.log('⚡ PERFORMANCE TESTS');
  console.log('====================');
  const performanceTests = [];
  for (let i = 0; i < 10; i++) {
    performanceTests.push(testEndpoint('GET', '/health'));
  }
  await Promise.all(performanceTests);
  console.log('');
  
  // Generate Summary Report
  console.log('📋 TEST SUMMARY REPORT');
  console.log('======================');
  console.log(`Total Tests: ${TEST_RESULTS.total}`);
  console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
  console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
  console.log(`Success Rate: ${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(1)}%`);
  
  // Response Time Analysis
  const responseTimes = TEST_RESULTS.details
    .filter(test => test.responseTime)
    .map(test => parseInt(test.responseTime.replace('ms', '')));
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    console.log('\n📊 RESPONSE TIME ANALYSIS');
    console.log('==========================');
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Fastest Response: ${minResponseTime}ms`);
    console.log(`Slowest Response: ${maxResponseTime}ms`);
  }
  
  // Detailed Results
  console.log('\n📝 DETAILED RESULTS');
  console.log('===================');
  TEST_RESULTS.details.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.method} ${test.endpoint}`);
    if (test.responseTime) {
      console.log(`   Response Time: ${test.responseTime}`);
    }
    if (test.status) {
      console.log(`   Status: ${test.status}`);
    }
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  // Final Status
  console.log('\n🎯 FINAL STATUS');
  console.log('================');
  if (TEST_RESULTS.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Backend is 100% functional!');
  } else if (TEST_RESULTS.passed > TEST_RESULTS.failed) {
    console.log('⚠️ Most tests passed, but some issues detected.');
  } else {
    console.log('❌ Multiple test failures detected. Backend needs attention.');
  }
  
  process.exit(TEST_RESULTS.failed === 0 ? 0 : 1);
}

// Run the tests
runAllTests().catch(console.error);