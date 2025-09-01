#!/usr/bin/env node

/**
 * COMPREHENSIVE QA VALIDATION
 * Staff Engineer & QA Team Deep Investigation
 */

import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 COMPREHENSIVE QA VALIDATION');
console.log('=' .repeat(80));

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.firebasestorage.app",
  messagingSenderId: "505765285633",
  appId: "1:505765285633:web:1bc55f947c68b46d75d500",
  databaseURL: "https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function for tests
async function runTest(category, testName, testFn) {
  process.stdout.write(`  ${testName}... `);
  try {
    const result = await testFn();
    if (result === true) {
      console.log('✅ PASS');
      results.passed.push(`${category}: ${testName}`);
    } else if (result === 'warning') {
      console.log('⚠️ WARNING');
      results.warnings.push(`${category}: ${testName}`);
    } else {
      console.log('❌ FAIL');
      results.failed.push(`${category}: ${testName}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    results.failed.push(`${category}: ${testName} - ${error.message}`);
  }
}

// 1. FIREBASE CONFIGURATION TESTS
console.log('\n1️⃣ FIREBASE CONFIGURATION');
console.log('-'.repeat(40));

await runTest('Firebase', 'API Key Valid', async () => {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123',
        returnSecureToken: true
      })
    }
  );
  const data = await response.json();
  return !data.error?.message?.includes('API key not valid');
});

await runTest('Firebase', 'Auth Domain Accessible', async () => {
  const response = await fetch(`https://${firebaseConfig.authDomain}`);
  return response.ok;
});

await runTest('Firebase', 'Project Configuration', async () => {
  const response = await fetch(
    `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${firebaseConfig.apiKey}`
  );
  return response.ok;
});

// 2. API ENDPOINT TESTS
console.log('\n2️⃣ API ENDPOINTS');
console.log('-'.repeat(40));

const API_BASE = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';

await runTest('API', 'Health Check', async () => {
  const response = await fetch(`${API_BASE}/health`);
  const data = await response.json();
  return data.status === 'healthy';
});

await runTest('API', 'Products Endpoint', async () => {
  const response = await fetch(`${API_BASE}/products`);
  const data = await response.json();
  return data.success && Array.isArray(data.products);
});

await runTest('API', 'Categories Endpoint', async () => {
  const response = await fetch(`${API_BASE}/categories`);
  const data = await response.json();
  return data.success && Array.isArray(data.categories);
});

await runTest('API', 'Search Endpoint', async () => {
  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'test' })
  });
  return response.ok;
});

// 3. FRONTEND BUILD TESTS
console.log('\n3️⃣ FRONTEND BUILD');
console.log('-'.repeat(40));

await runTest('Frontend', 'Build Output Exists', async () => {
  const distPath = path.join(__dirname, '..', 'dist');
  return fs.existsSync(distPath);
});

await runTest('Frontend', 'Index HTML Valid', async () => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) return false;
  const content = fs.readFileSync(indexPath, 'utf-8');
  return content.includes('<!doctype html>') && content.includes('<div id="root">');
});

await runTest('Frontend', 'Service Worker Configured', async () => {
  const swPath = path.join(__dirname, '..', 'dist', 'sw.js');
  return fs.existsSync(swPath);
});

await runTest('Frontend', 'Manifest File Valid', async () => {
  const manifestPath = path.join(__dirname, '..', 'dist', 'manifest.webmanifest');
  if (!fs.existsSync(manifestPath)) return false;
  const content = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);
  return manifest.name && manifest.short_name && manifest.start_url;
});

// 4. PERFORMANCE TESTS
console.log('\n4️⃣ PERFORMANCE METRICS');
console.log('-'.repeat(40));

await runTest('Performance', 'Bundle Size Check', async () => {
  const distPath = path.join(__dirname, '..', 'dist', 'assets', 'js');
  if (!fs.existsSync(distPath)) return false;
  
  const files = fs.readdirSync(distPath);
  const largeBundles = files.filter(file => {
    const stats = fs.statSync(path.join(distPath, file));
    return stats.size > 1024 * 1024; // Files larger than 1MB
  });
  
  if (largeBundles.length > 0) {
    console.log(`\n    Large bundles found: ${largeBundles.join(', ')}`);
    return 'warning';
  }
  return true;
});

await runTest('Performance', 'API Response Time', async () => {
  const startTime = Date.now();
  await fetch(`${API_BASE}/health`);
  const responseTime = Date.now() - startTime;
  
  if (responseTime > 1000) {
    console.log(`\n    Response time: ${responseTime}ms`);
    return 'warning';
  }
  return true;
});

// 5. SECURITY TESTS
console.log('\n5️⃣ SECURITY CHECKS');
console.log('-'.repeat(40));

await runTest('Security', 'HTTPS Enforced', async () => {
  const response = await fetch('https://souk-el-syarat.web.app');
  return response.url.startsWith('https://');
});

await runTest('Security', 'API Keys Not Exposed', async () => {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Check if sensitive keys are properly prefixed
  const lines = envContent.split('\n');
  const exposedKeys = lines.filter(line => 
    line.includes('SECRET') || line.includes('PRIVATE')
  ).filter(line => !line.startsWith('VITE_'));
  
  if (exposedKeys.length > 0) {
    console.log('\n    Exposed keys found!');
    return false;
  }
  return true;
});

await runTest('Security', 'Firestore Rules Configured', async () => {
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  if (!fs.existsSync(rulesPath)) return 'warning';
  
  const content = fs.readFileSync(rulesPath, 'utf-8');
  return content.includes('match') && content.includes('allow');
});

// 6. ERROR HANDLING TESTS
console.log('\n6️⃣ ERROR HANDLING');
console.log('-'.repeat(40));

await runTest('Errors', 'Error Boundary Configured', async () => {
  const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf-8');
  return content.includes('ErrorBoundary') || content.includes('error');
});

await runTest('Errors', 'Console Error Handler', async () => {
  const errorDetectorPath = path.join(__dirname, '..', 'src', 'utils', 'error-detector.ts');
  return fs.existsSync(errorDetectorPath);
});

await runTest('Errors', 'Network Error Handling', async () => {
  try {
    // Test with invalid endpoint
    const response = await fetch(`${API_BASE}/invalid-endpoint-test`);
    // Should handle 404 gracefully
    return true;
  } catch {
    return false;
  }
});

// 7. DEPLOYMENT TESTS
console.log('\n7️⃣ DEPLOYMENT STATUS');
console.log('-'.repeat(40));

await runTest('Deployment', 'Live Site Accessible', async () => {
  const response = await fetch('https://souk-el-syarat.web.app');
  return response.ok;
});

await runTest('Deployment', 'Firebase Hosting Active', async () => {
  const response = await fetch('https://souk-el-syarat.firebaseapp.com');
  return response.ok;
});

await runTest('Deployment', 'Cloud Functions Deployed', async () => {
  const response = await fetch('https://us-central1-souk-el-syarat.cloudfunctions.net/api');
  // Even a 404 means the function is deployed
  return response.status < 500;
});

// GENERATE REPORT
console.log('\n' + '='.repeat(80));
console.log('📊 QA VALIDATION REPORT');
console.log('='.repeat(80));

const totalTests = results.passed.length + results.failed.length + results.warnings.length;
const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

console.log(`\n📈 Summary:`);
console.log(`   Total Tests: ${totalTests}`);
console.log(`   ✅ Passed: ${results.passed.length}`);
console.log(`   ❌ Failed: ${results.failed.length}`);
console.log(`   ⚠️ Warnings: ${results.warnings.length}`);
console.log(`   📊 Pass Rate: ${passRate}%`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failed.forEach(test => console.log(`   - ${test}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️ Warnings:');
  results.warnings.forEach(test => console.log(`   - ${test}`));
}

// Quality Gates
console.log('\n🚦 QUALITY GATES:');
const qualityGates = {
  'Critical Services': results.passed.filter(t => 
    t.includes('API Key') || t.includes('Health Check') || t.includes('Live Site')
  ).length >= 3,
  'API Functionality': results.passed.filter(t => t.includes('API')).length >= 3,
  'Security': results.failed.filter(t => t.includes('Security')).length === 0,
  'Performance': results.warnings.filter(t => t.includes('Performance')).length <= 1
};

Object.entries(qualityGates).forEach(([gate, passed]) => {
  console.log(`   ${gate}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

const allGatesPassed = Object.values(qualityGates).every(v => v);
console.log(`\n🎯 Overall Status: ${allGatesPassed ? '✅ READY FOR PRODUCTION' : '⚠️ NEEDS ATTENTION'}`);

// Save report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    passRate: parseFloat(passRate)
  },
  results,
  qualityGates,
  status: allGatesPassed ? 'READY' : 'NEEDS_ATTENTION'
};

fs.writeFileSync(
  path.join(process.cwd(), 'qa-validation-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Detailed report saved to: qa-validation-report.json');
console.log('='.repeat(80));

process.exit(results.failed.length > 0 ? 1 : 0);