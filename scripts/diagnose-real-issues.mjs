import fetch from 'node-fetch';

const API = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';

console.log('🔍 DIAGNOSING THE REAL ISSUES\n');

// Test 1: Check what happens with malicious origin
console.log('1. Testing malicious origin access:');
const maliciousRes = await fetch(`${API}/products`, {
  headers: { 
    'Origin': 'https://evil-hacker-site.com'
  }
});

console.log('   Status:', maliciousRes.status);
console.log('   Can access data?', maliciousRes.ok);

if (maliciousRes.ok) {
  const data = await maliciousRes.json();
  console.log('   ❌ CRITICAL: Malicious site CAN access your data!');
  console.log('   Data received:', data.products?.length, 'products');
} else {
  console.log('   ✅ Good: Malicious site blocked');
}

// Test 2: Check actual headers
console.log('\n2. Checking security headers:');
const headersRes = await fetch(`${API}/health`);

const headers = {
  'access-control-allow-origin': headersRes.headers.get('access-control-allow-origin'),
  'x-xss-protection': headersRes.headers.get('x-xss-protection'),
  'x-content-type-options': headersRes.headers.get('x-content-type-options'),
  'x-frame-options': headersRes.headers.get('x-frame-options')
};

console.log('   Headers received:');
for (const [key, value] of Object.entries(headers)) {
  console.log(`   ${key}: ${value || 'MISSING ❌'}`);
}

// Test 3: Can unauthorized users access protected endpoints?
console.log('\n3. Testing unauthorized access:');
const unauthorizedRes = await fetch(`${API}/orders`);
console.log('   Orders without auth - Status:', unauthorizedRes.status);
console.log('   Properly blocked?', unauthorizedRes.status === 401 ? '✅ YES' : '❌ NO');

console.log('\n📊 DIAGNOSIS COMPLETE');
console.log('========================');
