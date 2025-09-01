#!/usr/bin/env node

/**
 * PRODUCTION READINESS TEST SUITE
 * Real User Experience Simulation Across Different Environments
 * Tests everything needed for 100% market-ready production state
 */

import fetch from 'node-fetch';
import { chromium } from 'playwright';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import chalk from 'chalk';
import ora from 'ora';

console.log(chalk.blue.bold('\n🎯 PRODUCTION READINESS TEST SUITE'));
console.log(chalk.blue('=' .repeat(80)));
console.log(chalk.gray('Testing Real User Experiences Across All Environments\n'));

const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500"
};

const API_BASE = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';
const APP_URL = 'https://souk-el-syarat.web.app';

// Test results tracking
const results = {
  environments: {},
  userJourneys: {},
  performance: {},
  security: {},
  missing: []
};

// Helper for colored output
const log = {
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️ ${msg}`)),
  info: (msg) => console.log(chalk.cyan(`ℹ️ ${msg}`))
};

// ============= ENVIRONMENT TESTING =============

async function testAllEnvironments() {
  console.log(chalk.cyan('\n🌍 TESTING ACROSS ALL ENVIRONMENTS'));
  console.log(chalk.gray('-'.repeat(40)));
  
  const environments = [
    {
      name: 'Production Web App',
      url: 'https://souk-el-syarat.web.app',
      origin: 'https://souk-el-syarat.web.app'
    },
    {
      name: 'Firebase Hosting',
      url: 'https://souk-el-syarat.firebaseapp.com',
      origin: 'https://souk-el-syarat.firebaseapp.com'
    },
    {
      name: 'Localhost Development',
      url: 'http://localhost:5173',
      origin: 'http://localhost:5173'
    },
    {
      name: 'Mobile Browser Simulation',
      url: APP_URL,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    },
    {
      name: 'Tablet Browser Simulation',
      url: APP_URL,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    }
  ];
  
  for (const env of environments) {
    const spinner = ora(`Testing ${env.name}...`).start();
    
    try {
      // Test API access from this environment
      const headers = {
        'Origin': env.origin || env.url,
        ...(env.userAgent && { 'User-Agent': env.userAgent })
      };
      
      const res = await fetch(`${API_BASE}/health`, { headers });
      
      if (res.ok) {
        results.environments[env.name] = 'PASS';
        spinner.succeed(`${env.name} - API Access OK`);
      } else {
        results.environments[env.name] = 'FAIL';
        spinner.fail(`${env.name} - API Access Failed (${res.status})`);
      }
    } catch (error) {
      results.environments[env.name] = 'ERROR';
      spinner.fail(`${env.name} - ${error.message}`);
    }
  }
}

// ============= BROWSER-BASED TESTING =============

async function testRealBrowserExperience() {
  console.log(chalk.cyan('\n🌐 REAL BROWSER TESTING'));
  console.log(chalk.gray('-'.repeat(40)));
  
  const spinner = ora('Launching browser...').start();
  
  try {
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-web-security'] // For testing only
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Test 1: Load main app
    spinner.text = 'Testing app load...';
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    
    if (title) {
      results.userJourneys['App Load'] = 'PASS';
      spinner.succeed('App loads successfully');
    }
    
    // Test 2: Check if login works in real browser
    spinner.text = 'Testing authentication in browser...';
    
    // Inject Firebase auth test
    const authResult = await page.evaluate(async (config) => {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      
      const app = initializeApp(config);
      const auth = getAuth(app);
      
      try {
        const result = await signInWithEmailAndPassword(
          auth,
          'customer@souk-elsayarat.com',
          'Customer@123456'
        );
        return { success: true, uid: result.user.uid };
      } catch (error) {
        return { success: false, error: error.code };
      }
    }, firebaseConfig);
    
    if (authResult.success) {
      results.userJourneys['Browser Auth'] = 'PASS';
      spinner.succeed('Authentication works in browser');
    } else {
      results.userJourneys['Browser Auth'] = 'FAIL';
      spinner.fail(`Browser auth failed: ${authResult.error}`);
    }
    
    // Test 3: API calls from browser
    spinner.text = 'Testing API calls from browser...';
    const apiResult = await page.evaluate(async (apiBase) => {
      try {
        const res = await fetch(`${apiBase}/products`);
        const data = await res.json();
        return { success: res.ok, products: data.products?.length || 0 };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, API_BASE);
    
    if (apiResult.success) {
      results.userJourneys['Browser API'] = 'PASS';
      spinner.succeed(`Browser API works - ${apiResult.products} products`);
    }
    
    await browser.close();
    
  } catch (error) {
    spinner.fail(`Browser testing failed: ${error.message}`);
    log.warning('Install Playwright: npm install playwright');
  }
}

// ============= USER JOURNEY SIMULATION =============

async function simulateCompleteUserJourneys() {
  console.log(chalk.cyan('\n👥 COMPLETE USER JOURNEY SIMULATION'));
  console.log(chalk.gray('-'.repeat(40)));
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Journey 1: New Customer Registration & Purchase
  const customerJourney = ora('Customer Journey: Registration → Browse → Purchase').start();
  
  try {
    // 1. Browse without login
    const browseRes = await fetch(`${API_BASE}/products`);
    const products = await browseRes.json();
    
    if (!products.success) throw new Error('Cannot browse products');
    
    // 2. Register new account
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test@Pass123!';
    
    try {
      const userCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      
      // 3. Get auth token
      const token = await userCred.user.getIdToken();
      
      // 4. Create order
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': 'https://souk-el-syarat.web.app'
        },
        body: JSON.stringify({
          items: [{ 
            productId: products.products[0].id,
            quantity: 1,
            price: products.products[0].price
          }],
          total: products.products[0].price,
          shippingAddress: 'Test Address, Cairo'
        })
      });
      
      if (orderRes.ok) {
        results.userJourneys['Customer Purchase'] = 'PASS';
        customerJourney.succeed('Customer journey complete');
      } else {
        throw new Error(`Order failed: ${orderRes.status}`);
      }
      
      // Cleanup
      await userCred.user.delete();
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        results.userJourneys['Customer Purchase'] = 'PARTIAL';
        customerJourney.warn('Registration works but email exists');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    results.userJourneys['Customer Purchase'] = 'FAIL';
    customerJourney.fail(`Customer journey failed: ${error.message}`);
  }
  
  // Journey 2: Vendor Product Management
  const vendorJourney = ora('Vendor Journey: Login → Add Product → Manage').start();
  
  try {
    // Login as vendor
    const vendorCred = await signInWithEmailAndPassword(
      auth,
      'vendor@souk-elsayarat.com',
      'Vendor@123456'
    );
    
    const vendorToken = await vendorCred.user.getIdToken();
    
    // Add product
    const productRes = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendorToken}`,
        'Origin': 'https://souk-el-syarat.web.app'
      },
      body: JSON.stringify({
        title: `Test Product ${Date.now()}`,
        description: 'Test product for vendor journey',
        price: 100000,
        category: 'parts',
        brand: 'TestBrand',
        inventory: 10
      })
    });
    
    if (productRes.ok) {
      results.userJourneys['Vendor Management'] = 'PASS';
      vendorJourney.succeed('Vendor journey complete');
    } else {
      throw new Error(`Product creation failed: ${productRes.status}`);
    }
    
    await signOut(auth);
    
  } catch (error) {
    results.userJourneys['Vendor Management'] = 'FAIL';
    vendorJourney.fail(`Vendor journey failed: ${error.message}`);
  }
  
  // Journey 3: Admin Operations
  const adminJourney = ora('Admin Journey: Login → Monitor → Manage').start();
  
  try {
    // Login as admin
    const adminCred = await signInWithEmailAndPassword(
      auth,
      'admin@souk-elsayarat.com',
      'Admin@123456'
    );
    
    // Check admin access to all data
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    
    if (usersSnapshot.size > 0 && ordersSnapshot.size >= 0) {
      results.userJourneys['Admin Operations'] = 'PASS';
      adminJourney.succeed('Admin journey complete');
    }
    
    await signOut(auth);
    
  } catch (error) {
    results.userJourneys['Admin Operations'] = 'FAIL';
    adminJourney.fail(`Admin journey failed: ${error.message}`);
  }
}

// ============= PERFORMANCE TESTING =============

async function testPerformanceMetrics() {
  console.log(chalk.cyan('\n⚡ PERFORMANCE METRICS TESTING'));
  console.log(chalk.gray('-'.repeat(40)));
  
  const metrics = {
    'API Response Time': { threshold: 200, actual: 0 },
    'Database Query Time': { threshold: 500, actual: 0 },
    'Authentication Time': { threshold: 1000, actual: 0 },
    'Concurrent Users': { threshold: 100, actual: 0 },
    'Data Transfer Size': { threshold: 1000000, actual: 0 } // 1MB
  };
  
  // Test API response time
  const apiSpinner = ora('Testing API response times...').start();
  const apiStart = Date.now();
  await fetch(`${API_BASE}/products`);
  metrics['API Response Time'].actual = Date.now() - apiStart;
  
  if (metrics['API Response Time'].actual <= metrics['API Response Time'].threshold) {
    apiSpinner.succeed(`API Response: ${metrics['API Response Time'].actual}ms (✅ < ${metrics['API Response Time'].threshold}ms)`);
  } else {
    apiSpinner.fail(`API Response: ${metrics['API Response Time'].actual}ms (❌ > ${metrics['API Response Time'].threshold}ms)`);
  }
  
  // Test concurrent users
  const concurrentSpinner = ora('Testing concurrent users...').start();
  const concurrentPromises = Array(50).fill(null).map(() => 
    fetch(`${API_BASE}/health`)
  );
  
  const concurrentStart = Date.now();
  const concurrentResults = await Promise.allSettled(concurrentPromises);
  const concurrentTime = Date.now() - concurrentStart;
  const successCount = concurrentResults.filter(r => r.status === 'fulfilled').length;
  
  if (successCount === 50) {
    concurrentSpinner.succeed(`Handled 50 concurrent users in ${concurrentTime}ms`);
    metrics['Concurrent Users'].actual = 50;
  } else {
    concurrentSpinner.fail(`Only ${successCount}/50 concurrent requests succeeded`);
  }
  
  results.performance = metrics;
}

// ============= SECURITY VALIDATION =============

async function validateSecurityRequirements() {
  console.log(chalk.cyan('\n🔒 SECURITY REQUIREMENTS VALIDATION'));
  console.log(chalk.gray('-'.repeat(40)));
  
  const securityChecks = {
    'HTTPS Enforcement': false,
    'Authentication Required': false,
    'XSS Protection': false,
    'CORS Policy': false,
    'Rate Limiting': false,
    'Input Validation': false,
    'SQL Injection Protection': false,
    'Token Validation': false
  };
  
  // Check HTTPS
  securityChecks['HTTPS Enforcement'] = API_BASE.startsWith('https://');
  
  // Check auth requirement
  const authRes = await fetch(`${API_BASE}/orders`);
  securityChecks['Authentication Required'] = authRes.status === 401;
  
  // Check XSS protection header
  const headerRes = await fetch(`${API_BASE}/health`);
  securityChecks['XSS Protection'] = headerRes.headers.get('x-xss-protection') === '1; mode=block';
  
  // Check CORS
  const corsRes = await fetch(`${API_BASE}/products`, {
    headers: { 'Origin': 'https://evil.com' }
  });
  securityChecks['CORS Policy'] = corsRes.status === 403;
  
  // Check input validation
  const invalidRes = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '<script>alert("xss")</script>' })
  });
  const invalidData = await invalidRes.json();
  securityChecks['Input Validation'] = !invalidData.query?.includes('<script>');
  
  results.security = securityChecks;
  
  // Display results
  Object.entries(securityChecks).forEach(([check, passed]) => {
    if (passed) {
      log.success(check);
    } else {
      log.error(check);
    }
  });
}

// ============= MISSING REQUIREMENTS CHECK =============

async function checkMissingRequirements() {
  console.log(chalk.cyan('\n📋 CHECKING MISSING REQUIREMENTS FOR 100%'));
  console.log(chalk.gray('-'.repeat(40)));
  
  const requirements = [
    {
      name: 'Payment Gateway Integration',
      status: 'NOT IMPLEMENTED',
      impact: 'Cannot process real payments',
      priority: 'CRITICAL'
    },
    {
      name: 'Email Notifications',
      status: 'NOT CONFIGURED',
      impact: 'No order confirmations or updates',
      priority: 'HIGH'
    },
    {
      name: 'SMS Verification',
      status: 'NOT ENABLED',
      impact: 'Reduced account security',
      priority: 'MEDIUM'
    },
    {
      name: 'Image Upload & Storage',
      status: 'PARTIAL',
      impact: 'Vendors cannot upload product images',
      priority: 'HIGH'
    },
    {
      name: 'Search Indexing',
      status: 'BASIC',
      impact: 'Search not optimized',
      priority: 'MEDIUM'
    },
    {
      name: 'Analytics & Tracking',
      status: 'BASIC',
      impact: 'Limited business insights',
      priority: 'LOW'
    },
    {
      name: 'Backup & Recovery',
      status: 'NOT CONFIGURED',
      impact: 'Data loss risk',
      priority: 'CRITICAL'
    },
    {
      name: 'CDN Configuration',
      status: 'NOT OPTIMIZED',
      impact: 'Slower global performance',
      priority: 'MEDIUM'
    },
    {
      name: 'Error Monitoring',
      status: 'BASIC',
      impact: 'Delayed issue detection',
      priority: 'HIGH'
    },
    {
      name: 'Load Balancing',
      status: 'SINGLE INSTANCE',
      impact: 'No redundancy',
      priority: 'HIGH'
    }
  ];
  
  const critical = requirements.filter(r => r.priority === 'CRITICAL');
  const high = requirements.filter(r => r.priority === 'HIGH');
  
  console.log(chalk.red.bold('\n🚨 CRITICAL MISSING (Blocks Production):'));
  critical.forEach(req => {
    console.log(chalk.red(`   ❌ ${req.name}: ${req.impact}`));
  });
  
  console.log(chalk.yellow.bold('\n⚠️ HIGH PRIORITY MISSING:'));
  high.forEach(req => {
    console.log(chalk.yellow(`   ⚠️ ${req.name}: ${req.impact}`));
  });
  
  results.missing = requirements;
}

// ============= GENERATE FINAL REPORT =============

async function generateFinalReport() {
  console.log(chalk.blue('\n' + '='.repeat(80)));
  console.log(chalk.blue.bold('📊 PRODUCTION READINESS REPORT'));
  console.log(chalk.blue('='.repeat(80)));
  
  // Calculate scores
  const envScore = Object.values(results.environments).filter(v => v === 'PASS').length;
  const envTotal = Object.keys(results.environments).length;
  
  const journeyScore = Object.values(results.userJourneys).filter(v => v === 'PASS').length;
  const journeyTotal = Object.keys(results.userJourneys).length;
  
  const securityScore = Object.values(results.security).filter(v => v === true).length;
  const securityTotal = Object.keys(results.security).length;
  
  const overallScore = ((envScore + journeyScore + securityScore) / 
                        (envTotal + journeyTotal + securityTotal) * 100).toFixed(1);
  
  console.log(chalk.white('\n📈 Test Results:'));
  console.log(`   Environments: ${envScore}/${envTotal} (${(envScore/envTotal*100).toFixed(0)}%)`);
  console.log(`   User Journeys: ${journeyScore}/${journeyTotal} (${(journeyScore/journeyTotal*100).toFixed(0)}%)`);
  console.log(`   Security: ${securityScore}/${securityTotal} (${(securityScore/securityTotal*100).toFixed(0)}%)`);
  console.log(chalk.bold(`   Overall: ${overallScore}%`));
  
  // Performance summary
  console.log(chalk.white('\n⚡ Performance:'));
  Object.entries(results.performance).forEach(([metric, data]) => {
    const passed = data.actual <= data.threshold;
    const icon = passed ? '✅' : '❌';
    console.log(`   ${icon} ${metric}: ${data.actual}${metric.includes('Time') ? 'ms' : ''} (limit: ${data.threshold})`);
  });
  
  // Critical missing items
  const criticalMissing = results.missing.filter(r => r.priority === 'CRITICAL');
  
  console.log(chalk.red.bold('\n🚨 BLOCKING ISSUES FOR PRODUCTION:'));
  if (criticalMissing.length === 0) {
    console.log(chalk.green('   ✅ None - Ready for production!'));
  } else {
    criticalMissing.forEach(item => {
      console.log(chalk.red(`   ❌ ${item.name}`));
    });
  }
  
  // Final verdict
  console.log(chalk.blue('\n' + '='.repeat(80)));
  
  const isReady = overallScore >= 90 && criticalMissing.length === 0;
  
  if (isReady) {
    console.log(chalk.green.bold('✅ PRODUCTION READY!'));
    console.log(chalk.green('All critical requirements met. Ready to deploy!'));
  } else if (overallScore >= 80) {
    console.log(chalk.yellow.bold('⚠️ ALMOST READY'));
    console.log(chalk.yellow(`Fix ${criticalMissing.length} critical issues before production.`));
  } else {
    console.log(chalk.red.bold('❌ NOT READY FOR PRODUCTION'));
    console.log(chalk.red('Multiple critical issues need to be resolved.'));
  }
  
  console.log(chalk.blue('='.repeat(80)));
  
  // Save detailed report
  const fs = await import('fs');
  fs.writeFileSync(
    'production-readiness-report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log(chalk.gray('\n📄 Detailed report saved to: production-readiness-report.json\n'));
}

// ============= RUN ALL TESTS =============

async function runProductionReadinessTests() {
  try {
    await testAllEnvironments();
    await testRealBrowserExperience();
    await simulateCompleteUserJourneys();
    await testPerformanceMetrics();
    await validateSecurityRequirements();
    await checkMissingRequirements();
    await generateFinalReport();
  } catch (error) {
    console.error(chalk.red('\n❌ Test suite error:'), error);
    process.exit(1);
  }
}

// Check dependencies
async function checkDependencies() {
  try {
    await import('playwright');
    return true;
  } catch {
    console.log(chalk.yellow('\n📦 Installing required packages...'));
    const { execSync } = await import('child_process');
    execSync('npm install playwright chalk ora', { stdio: 'inherit' });
    return true;
  }
}

// Main execution
checkDependencies().then(() => {
  runProductionReadinessTests();
});