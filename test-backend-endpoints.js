/**
 * 🧪 BACKEND ENDPOINTS TEST
 * Comprehensive testing of all App Hosting backend endpoints
 */

const https = require('https');

const BACKEND_URL = 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app';

async function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}${path}`;
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData,
            path: path
          });
        } catch (e) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Invalid JSON response',
            data: data,
            path: path
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        status: 0,
        error: error.message,
        path: path
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: 'Request timeout',
        path: path
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing App Hosting Backend Endpoints...\n');
  console.log(`🌐 Backend URL: ${BACKEND_URL}\n`);

  const tests = [
    // Basic endpoints
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/api/status', method: 'GET', name: 'API Status' },
    { path: '/api/realtime/status', method: 'GET', name: 'Real-time Status' },
    
    // Authentication endpoints
    { path: '/api/auth/verify', method: 'POST', name: 'Auth Verify' },
    { 
      path: '/api/auth/login', 
      method: 'POST', 
      name: 'Auth Login',
      body: { email: 'test@example.com', password: 'password123' }
    },
    { 
      path: '/api/auth/signup', 
      method: 'POST', 
      name: 'Auth Signup',
      body: { email: 'test@example.com', password: 'password123', name: 'Test User' }
    },
    { path: '/api/auth/logout', method: 'POST', name: 'Auth Logout' },
    { 
      path: '/api/auth/reset', 
      method: 'POST', 
      name: 'Auth Reset',
      body: { email: 'test@example.com' }
    },
    
    // Service endpoints
    { path: '/api/vendors/status', method: 'GET', name: 'Vendors Status' },
    { path: '/api/products/status', method: 'GET', name: 'Products Status' },
    { path: '/api/analytics/dashboard', method: 'GET', name: 'Analytics Dashboard' },
    { 
      path: '/api/orders/process', 
      method: 'POST', 
      name: 'Order Process',
      body: { orderId: 'TEST-123', amount: 100 }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    
    const result = await testEndpoint(test.path, test.method, test.body);
    
    if (result.success) {
      console.log(`✅ ${test.name}: ${result.status} - ${result.data?.message || 'OK'}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: ${result.status} - ${result.error || 'Failed'}`);
      failed++;
    }
    
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is fully operational.');
  } else {
    console.log('\n⚠️ Some tests failed. Check backend deployment status.');
  }

  console.log('\n🔗 Backend URLs:');
  console.log(`Health: ${BACKEND_URL}/health`);
  console.log(`Status: ${BACKEND_URL}/api/status`);
  console.log(`Login: ${BACKEND_URL}/api/auth/login`);
  console.log(`Signup: ${BACKEND_URL}/api/auth/signup`);
}

// Run the tests
runTests().catch(console.error);
