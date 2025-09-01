import fetch from 'node-fetch';

const API = 'https://us-central1-souk-el-syarat.cloudfunctions.net/api/api';

console.log('🔍 VERIFYING CRITICAL SECURITY FIXES\n');
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

// Test 1: Malicious origin MUST be blocked
console.log('\n1. Testing malicious origin blocking:');
const maliciousRes = await fetch(`${API}/products`, {
  headers: { 
    'Origin': 'https://evil-hacker-site.com'
  }
});

console.log('   Status code:', maliciousRes.status);
if (maliciousRes.status === 403 || maliciousRes.status === 401) {
  console.log('   ✅ FIXED: Malicious origin BLOCKED!');
  passed++;
} else if (maliciousRes.ok) {
  const data = await maliciousRes.json();
  console.log('   ❌ CRITICAL: Malicious site can still access data!');
  console.log('   Data leaked:', data.products?.length, 'products');
  failed++;
} else {
  console.log('   ⚠️ Unclear status:', maliciousRes.status);
  failed++;
}

// Test 2: X-XSS-Protection header MUST be set
console.log('\n2. Testing X-XSS-Protection header:');
const headersRes = await fetch(`${API}/health`);
const xssHeader = headersRes.headers.get('x-xss-protection');

console.log('   X-XSS-Protection:', xssHeader);
if (xssHeader === '1; mode=block') {
  console.log('   ✅ FIXED: XSS Protection header correct!');
  passed++;
} else {
  console.log('   ❌ STILL BROKEN: XSS header not set properly!');
  failed++;
}

// Test 3: All security headers present
console.log('\n3. Testing all security headers:');
const securityHeaders = {
  'X-Content-Type-Options': headersRes.headers.get('x-content-type-options'),
  'X-Frame-Options': headersRes.headers.get('x-frame-options'),
  'X-XSS-Protection': headersRes.headers.get('x-xss-protection'),
  'Referrer-Policy': headersRes.headers.get('referrer-policy'),
  'Content-Security-Policy': headersRes.headers.get('content-security-policy')
};

let allHeadersGood = true;
for (const [header, value] of Object.entries(securityHeaders)) {
  const isGood = value && value !== 'MISSING';
  console.log(`   ${header}: ${value || 'MISSING'} ${isGood ? '✅' : '❌'}`);
  if (!isGood) allHeadersGood = false;
}

if (allHeadersGood) {
  console.log('   ✅ All security headers present!');
  passed++;
} else {
  console.log('   ❌ Some security headers missing!');
  failed++;
}

// Test 4: Authorized origin should work
console.log('\n4. Testing authorized origin:');
const authorizedRes = await fetch(`${API}/health`, {
  headers: { 
    'Origin': 'https://souk-el-syarat.web.app'
  }
});

if (authorizedRes.ok) {
  console.log('   ✅ Authorized origin works correctly');
  passed++;
} else {
  console.log('   ❌ Authorized origin blocked (should work!)');
  failed++;
}

// Test 5: No origin (server-to-server) should work
console.log('\n5. Testing server-to-server (no origin):');
const serverRes = await fetch(`${API}/health`);
if (serverRes.ok) {
  console.log('   ✅ Server-to-server calls work');
  passed++;
} else {
  console.log('   ❌ Server-to-server blocked (should work!)');
  failed++;
}

console.log('\n' + '=' .repeat(50));
console.log('📊 CRITICAL SECURITY TEST RESULTS');
console.log('=' .repeat(50));
console.log(`\n✅ Passed: ${passed}/5`);
console.log(`❌ Failed: ${failed}/5`);

if (failed === 0) {
  console.log('\n🎉 ALL CRITICAL ISSUES FIXED!');
  console.log('✅ The app is NOW secure for production!');
} else {
  console.log(`\n⚠️ STILL ${failed} CRITICAL ISSUES!`);
  console.log('❌ NOT ready for production!');
}
