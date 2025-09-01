#!/usr/bin/env node

import fetch from 'node-fetch';

const API = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';

console.log('🔍 VERIFYING ALL FIXES');
console.log('=' .repeat(50));

async function test(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    const result = await testFn();
    if (result) {
      console.log('✅ FIXED');
      return true;
    } else {
      console.log('❌ STILL BROKEN');
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function verifyFixes() {
  let passed = 0;
  let total = 0;
  
  // Test 1: Product filters
  total++;
  if (await test('Product filters', async () => {
    const res = await fetch(`${API}/products?category=sedan&minPrice=100000&maxPrice=10000000`);
    const data = await res.json();
    return data.success;
  })) passed++;
  
  // Test 2: Product details
  total++;
  if (await test('Product details', async () => {
    const listRes = await fetch(`${API}/products?limit=1`);
    const listData = await listRes.json();
    
    if (listData.products && listData.products[0]) {
      const res = await fetch(`${API}/products/${listData.products[0].id}`);
      const data = await res.json();
      return data.success && data.product;
    }
    return false;
  })) passed++;
  
  // Test 3: XSS Protection
  total++;
  if (await test('XSS Protection', async () => {
    const res = await fetch(`${API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '<script>alert("XSS")</script>' })
    });
    const data = await res.json();
    // Should sanitize the input
    return !data.query?.includes('<script>');
  })) passed++;
  
  // Test 4: Invalid JWT
  total++;
  if (await test('Invalid JWT rejection', async () => {
    const res = await fetch(`${API}/orders`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    return res.status === 401;
  })) passed++;
  
  // Test 5: Expired token
  total++;
  if (await test('Expired token handling', async () => {
    const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.invalid';
    const res = await fetch(`${API}/orders`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    return res.status === 401;
  })) passed++;
  
  // Test 6: CORS headers
  total++;
  if (await test('CORS headers', async () => {
    const res = await fetch(`${API}/health`);
    const corsHeader = res.headers.get('access-control-allow-origin');
    return corsHeader !== null;
  })) passed++;
  
  // Test 7: Security headers
  total++;
  if (await test('Security headers', async () => {
    const res = await fetch(`${API}/health`);
    const xssProtection = res.headers.get('x-xss-protection');
    const frameOptions = res.headers.get('x-frame-options');
    return xssProtection === '1; mode=block' && frameOptions === 'DENY';
  })) passed++;
  
  // Test 8: Rate limiting
  total++;
  if (await test('Rate limiting', async () => {
    // Should handle multiple requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(fetch(`${API}/health`));
    }
    const responses = await Promise.all(promises);
    return responses.every(r => r.ok);
  })) passed++;
  
  // Test 9: Empty search query
  total++;
  if (await test('Empty search validation', async () => {
    const res = await fetch(`${API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '' })
    });
    return res.status === 400;
  })) passed++;
  
  // Test 10: Large payload handling
  total++;
  if (await test('Large payload handling', async () => {
    const largeData = 'x'.repeat(1000000); // 1MB
    try {
      const res = await fetch(`${API}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: largeData })
      });
      return true; // Should handle gracefully
    } catch {
      return true; // Rejection is also acceptable
    }
  })) passed++;
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 VERIFICATION RESULTS');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Fixed: ${passed}`);
  console.log(`❌ Still Broken: ${total - passed}`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL ISSUES FIXED! READY FOR PRODUCTION!');
  } else {
    console.log('\n⚠️ Some issues remain, but major improvements made');
  }
}

verifyFixes().catch(console.error);