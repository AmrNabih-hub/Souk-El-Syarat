/**
 * 🔥 POST-DEPLOYMENT SMOKE TESTS
 * Quick tests to verify deployed application is working
 * Run after deployment to ensure everything is functional
 */

const https = require('https');
const http = require('http');

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || process.argv[2];

if (!DEPLOYMENT_URL) {
  console.log('❌ ERROR: No deployment URL provided!');
  console.log('\nUsage:');
  console.log('  node scripts/smoke-tests.js https://your-site.appwrite.network');
  console.log('  OR');
  console.log('  DEPLOYMENT_URL=https://your-site.appwrite.network node scripts/smoke-tests.js\n');
  process.exit(1);
}

console.log('🔥 Starting Post-Deployment Smoke Tests...\n');
console.log(`Testing: ${DEPLOYMENT_URL}\n`);

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

function logTest(name, status, message = '') {
  testResults.total++;
  const emoji = status === 'pass' ? '✅' : '❌';
  console.log(`${emoji} ${name}${message ? ': ' + message : ''}`);
  
  if (status === 'pass') testResults.passed++;
  else testResults.failed++;
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBasicConnectivity() {
  console.log('🌐 Testing Basic Connectivity...\n');
  
  try {
    const response = await makeRequest(DEPLOYMENT_URL);
    
    logTest(
      'Site is accessible',
      response.statusCode === 200 ? 'pass' : 'fail',
      `Status: ${response.statusCode}`
    );
    
    logTest(
      'Returns HTML content',
      response.body.includes('<!DOCTYPE html') || response.body.includes('<html') ? 'pass' : 'fail'
    );
    
    logTest(
      'Has meta tags',
      response.body.includes('<meta') ? 'pass' : 'fail'
    );
    
    logTest(
      'Has title tag',
      response.body.includes('<title>') ? 'pass' : 'fail'
    );
  } catch (error) {
    logTest('Basic connectivity', 'fail', error.message);
  }
}

async function testStaticAssets() {
  console.log('\n📦 Testing Static Assets...\n');
  
  const assets = [
    '/manifest.json',
    '/manifest.webmanifest',
  ];
  
  for (const asset of assets) {
    try {
      const response = await makeRequest(`${DEPLOYMENT_URL}${asset}`);
      logTest(
        `Asset: ${asset}`,
        response.statusCode === 200 ? 'pass' : 'fail',
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      logTest(`Asset: ${asset}`, 'fail', 'Not found');
    }
  }
}

async function testPageRoutes() {
  console.log('\n🗺️  Testing Page Routes...\n');
  
  const routes = [
    '/',
    '/login',
    '/register',
    '/marketplace',
  ];
  
  for (const route of routes) {
    try {
      const response = await makeRequest(`${DEPLOYMENT_URL}${route}`);
      logTest(
        `Route: ${route}`,
        response.statusCode === 200 ? 'pass' : 'fail',
        `Status: ${response.statusCode}`
      );
    } catch (error) {
      logTest(`Route: ${route}`, 'fail', error.message);
    }
  }
}

async function testSecurityHeaders() {
  console.log('\n🔐 Testing Security Headers...\n');
  
  try {
    const response = await makeRequest(DEPLOYMENT_URL);
    
    const securityHeaders = {
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-xss-protection': 'X-XSS-Protection',
    };
    
    Object.entries(securityHeaders).forEach(([header, name]) => {
      logTest(
        `Security header: ${name}`,
        response.headers[header] ? 'pass' : 'fail',
        response.headers[header] || 'Not set'
      );
    });
  } catch (error) {
    logTest('Security headers test', 'fail', error.message);
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(DEPLOYMENT_URL);
    const loadTime = Date.now() - startTime;
    
    logTest(
      'Page load time',
      loadTime < 3000 ? 'pass' : 'fail',
      `${loadTime}ms ${loadTime < 1000 ? '(Excellent!)' : loadTime < 3000 ? '(Good)' : '(Slow)'}`
    );
    
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      const sizeKB = Math.round(parseInt(contentLength) / 1024);
      logTest(
        'Page size',
        sizeKB < 500 ? 'pass' : 'fail',
        `${sizeKB}KB ${sizeKB < 200 ? '(Excellent!)' : sizeKB < 500 ? '(Good)' : '(Large)'}`
      );
    }
  } catch (error) {
    logTest('Performance test', 'fail', error.message);
  }
}

async function testAppwriteIntegration() {
  console.log('\n🔌 Testing Appwrite Integration...\n');
  
  try {
    const response = await makeRequest(DEPLOYMENT_URL);
    
    // Check if Appwrite SDK is loaded
    logTest(
      'Appwrite SDK referenced',
      response.body.includes('appwrite') || response.body.includes('cloud.appwrite.io') ? 'pass' : 'fail'
    );
    
    // Check for environment variables in built files
    logTest(
      'Environment configured',
      response.body.includes('VITE_') ? 'pass' : 'fail',
      'Build includes environment variables'
    );
  } catch (error) {
    logTest('Appwrite integration test', 'fail', error.message);
  }
}

async function testPWASupport() {
  console.log('\n📱 Testing PWA Support...\n');
  
  try {
    // Test manifest
    const manifestResponse = await makeRequest(`${DEPLOYMENT_URL}/manifest.webmanifest`);
    logTest(
      'PWA manifest exists',
      manifestResponse.statusCode === 200 ? 'pass' : 'fail'
    );
    
    if (manifestResponse.statusCode === 200) {
      try {
        const manifest = JSON.parse(manifestResponse.body);
        logTest(
          'Manifest has name',
          manifest.name ? 'pass' : 'fail',
          manifest.name || ''
        );
        
        logTest(
          'Manifest has icons',
          manifest.icons && manifest.icons.length > 0 ? 'pass' : 'fail'
        );
      } catch (e) {
        logTest('PWA manifest parsing', 'fail', 'Invalid JSON');
      }
    }
    
    // Test service worker
    try {
      const swResponse = await makeRequest(`${DEPLOYMENT_URL}/sw.js`);
      logTest(
        'Service worker exists',
        swResponse.statusCode === 200 ? 'pass' : 'fail'
      );
    } catch (error) {
      logTest('Service worker', 'fail', 'Not found');
    }
  } catch (error) {
    logTest('PWA support test', 'fail', error.message);
  }
}

async function testResponsiveness() {
  console.log('\n📱 Testing Responsive Design...\n');
  
  try {
    const response = await makeRequest(DEPLOYMENT_URL);
    
    logTest(
      'Viewport meta tag',
      response.body.includes('viewport') ? 'pass' : 'fail'
    );
    
    logTest(
      'Mobile-friendly',
      response.body.includes('width=device-width') ? 'pass' : 'fail'
    );
  } catch (error) {
    logTest('Responsiveness test', 'fail', error.message);
  }
}

async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('🔥 POST-DEPLOYMENT SMOKE TESTS');
  console.log('═'.repeat(60));
  console.log(`URL: ${DEPLOYMENT_URL}\n`);
  
  await testBasicConnectivity();
  await testStaticAssets();
  await testPageRoutes();
  await testSecurityHeaders();
  await testPerformance();
  await testAppwriteIntegration();
  await testPWASupport();
  await testResponsiveness();
  
  console.log('\n═'.repeat(60));
  console.log('📊 SMOKE TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests:     ${testResults.total}`);
  console.log(`Passed:          ${testResults.passed} ✅`);
  console.log(`Failed:          ${testResults.failed} ❌`);
  console.log(`Success Rate:    ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  console.log('═'.repeat(60));
  
  if (testResults.failed > 0) {
    console.log('\n⚠️  SOME TESTS FAILED!');
    console.log('\n💡 Your site is deployed but some features may not work correctly.');
    console.log('   Review the failed tests above and fix any issues.\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL SMOKE TESTS PASSED!');
    console.log('\n🎉 Your site is live and working correctly!');
    console.log('\n📋 Recommended Next Steps:');
    console.log('   1. Test user registration');
    console.log('   2. Test login functionality');
    console.log('   3. Test vendor application');
    console.log('   4. Test car listing submission');
    console.log('   5. Test order placement');
    console.log('   6. Verify real-time updates');
    console.log('   7. Test on mobile devices');
    console.log('   8. Test PWA installation\n');
    process.exit(0);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});

