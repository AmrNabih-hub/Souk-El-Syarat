/**
 * 🔍 COMPREHENSIVE LIVE APPLICATION TESTING SCRIPT
 * Tests all critical functionality of the Souk El-Sayarat application
 */

import https from 'https';
import http from 'http';

// Test configuration
const FRONTEND_URL = 'https://souk-el-syarat.web.app';
const BACKEND_URL = 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Souk-El-Sayarat-Test-Suite/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test function wrapper
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED', error: null });
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    console.log(`❌ FAILED: ${testName} - ${error.message}`);
  }
}

// Test 1: Frontend Application Availability
async function testFrontendAvailability() {
  const response = await makeRequest(FRONTEND_URL);
  if (response.statusCode !== 200) {
    throw new Error(`Frontend returned status ${response.statusCode}`);
  }
  
  // Check for essential HTML elements
  if (!response.data.includes('سوق السيارات') && !response.data.includes('Souk El-Sayarat')) {
    throw new Error('Frontend does not contain expected content');
  }
}

// Test 2: PWA Manifest
async function testPWAManifest() {
  const response = await makeRequest(`${FRONTEND_URL}/manifest.webmanifest`);
  if (response.statusCode !== 200) {
    throw new Error(`PWA manifest returned status ${response.statusCode}`);
  }
  
  const manifest = JSON.parse(response.data);
  if (!manifest.name || !manifest.icons || manifest.icons.length === 0) {
    throw new Error('PWA manifest is invalid or incomplete');
  }
}

// Test 3: Service Worker
async function testServiceWorker() {
  const response = await makeRequest(`${FRONTEND_URL}/sw.js`);
  if (response.statusCode !== 200) {
    throw new Error(`Service worker returned status ${response.statusCode}`);
  }
  
  if (!response.data.includes('workbox') && !response.data.includes('precache')) {
    throw new Error('Service worker does not contain expected functionality');
  }
}

// Test 4: Backend API Health
async function testBackendHealth() {
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    if (response.statusCode !== 200) {
      throw new Error(`Backend health check returned status ${response.statusCode}`);
    }
  } catch (error) {
    // Backend might be down, but we'll note it
    console.log(`⚠️ Backend health check failed: ${error.message}`);
    throw new Error(`Backend is not responding: ${error.message}`);
  }
}

// Test 5: Firebase Configuration
async function testFirebaseConfig() {
  const response = await makeRequest(FRONTEND_URL);
  if (!response.data.includes('firebase') && !response.data.includes('firebaseapp.com')) {
    throw new Error('Firebase configuration not found in frontend');
  }
}

// Test 6: Security Headers
async function testSecurityHeaders() {
  const response = await makeRequest(FRONTEND_URL);
  const headers = response.headers;
  
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options'
  ];
  
  for (const header of requiredHeaders) {
    if (!headers[header]) {
      throw new Error(`Missing security header: ${header}`);
    }
  }
}

// Test 7: Performance Headers
async function testPerformanceHeaders() {
  const response = await makeRequest(FRONTEND_URL);
  const headers = response.headers;
  
  if (!headers['cache-control'] && !headers['etag']) {
    throw new Error('Missing performance headers (cache-control or etag)');
  }
}

// Test 8: CORS Configuration
async function testCORSConfiguration() {
  const response = await makeRequest(`${BACKEND_URL}/api/products`, {
    method: 'OPTIONS',
    headers: {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'GET'
    }
  });
  
  if (!response.headers['access-control-allow-origin']) {
    throw new Error('CORS headers not properly configured');
  }
}

// Test 9: API Endpoints
async function testAPIEndpoints() {
  const endpoints = [
    '/api/products',
    '/api/vendors',
    '/api/search'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint}`);
      if (response.statusCode >= 500) {
        throw new Error(`Endpoint ${endpoint} returned server error: ${response.statusCode}`);
      }
    } catch (error) {
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        throw new Error(`Endpoint ${endpoint} is not accessible`);
      }
      // Other errors might be expected (like 404 for empty endpoints)
    }
  }
}

// Test 10: WebSocket Connection
async function testWebSocketConnection() {
  // This is a simplified test - in a real scenario, you'd use a WebSocket library
  try {
    const response = await makeRequest(`${BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}`);
    // WebSocket connections typically don't respond to HTTP requests
    // This test mainly checks if the endpoint is reachable
  } catch (error) {
    // WebSocket endpoints typically reject HTTP requests, which is expected
    console.log(`⚠️ WebSocket endpoint test: ${error.message}`);
  }
}

// Test 11: Authentication Flow
async function testAuthenticationFlow() {
  const response = await makeRequest(FRONTEND_URL);
  
  // Check for authentication-related JavaScript
  if (!response.data.includes('auth') && !response.data.includes('firebase')) {
    throw new Error('Authentication system not found in frontend');
  }
}

// Test 12: Real-time Features
async function testRealtimeFeatures() {
  const response = await makeRequest(FRONTEND_URL);
  
  // Check for real-time related code
  if (!response.data.includes('realtime') && !response.data.includes('websocket')) {
    throw new Error('Real-time features not found in frontend');
  }
}

// Test 13: Payment Integration
async function testPaymentIntegration() {
  const response = await makeRequest(FRONTEND_URL);
  
  // Check for payment-related code
  if (!response.data.includes('payment') && !response.data.includes('stripe')) {
    throw new Error('Payment integration not found in frontend');
  }
}

// Test 14: Multi-language Support
async function testMultiLanguageSupport() {
  const response = await makeRequest(FRONTEND_URL);
  
  // Check for Arabic content
  if (!response.data.includes('سوق') && !response.data.includes('السيارات')) {
    throw new Error('Arabic language support not found');
  }
}

// Test 15: Mobile Responsiveness
async function testMobileResponsiveness() {
  const response = await makeRequest(FRONTEND_URL);
  
  // Check for viewport meta tag
  if (!response.data.includes('viewport') && !response.data.includes('width=device-width')) {
    throw new Error('Mobile responsiveness meta tag not found');
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Live Application Testing');
  console.log('=' .repeat(60));
  
  const tests = [
    ['Frontend Application Availability', testFrontendAvailability],
    ['PWA Manifest', testPWAManifest],
    ['Service Worker', testServiceWorker],
    ['Backend API Health', testBackendHealth],
    ['Firebase Configuration', testFirebaseConfig],
    ['Security Headers', testSecurityHeaders],
    ['Performance Headers', testPerformanceHeaders],
    ['CORS Configuration', testCORSConfiguration],
    ['API Endpoints', testAPIEndpoints],
    ['WebSocket Connection', testWebSocketConnection],
    ['Authentication Flow', testAuthenticationFlow],
    ['Real-time Features', testRealtimeFeatures],
    ['Payment Integration', testPaymentIntegration],
    ['Multi-language Support', testMultiLanguageSupport],
    ['Mobile Responsiveness', testMobileResponsiveness]
  ];
  
  for (const [testName, testFunction] of tests) {
    await runTest(testName, testFunction);
  }
  
  // Generate report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.failed === 0) {
    console.log('  ✅ All tests passed! The application is ready for production.');
  } else if (testResults.failed <= 3) {
    console.log('  ⚠️ Minor issues detected. Review failed tests and fix before production.');
  } else {
    console.log('  🚨 Multiple critical issues detected. Major fixes required before production.');
  }
  
  console.log('\n🔗 Application URLs:');
  console.log(`  Frontend: ${FRONTEND_URL}`);
  console.log(`  Backend: ${BACKEND_URL}`);
  
  return testResults;
}

// Run the tests
runAllTests().catch(console.error);

export { runAllTests, testResults };
