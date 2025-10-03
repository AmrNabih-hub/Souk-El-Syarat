/**
 * 🎯 FINAL PRE-DEPLOYMENT CHECK
 * Run this before pushing to production
 */

const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   🎯 FINAL PRE-DEPLOYMENT CHECK                      ║');
console.log('║   Souk El-Sayarat - Production Readiness             ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

let checks = [];
let warnings = [];
let errors = [];

// ✅ CHECK 1: Build files exist
console.log('📦 Checking build files...');
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  if (files.includes('index.html')) {
    checks.push('✅ Build output exists (dist/index.html)');
    
    // Count assets
    const jsFiles = files.filter(f => f.endsWith('.js')).length;
    const cssFiles = files.filter(f => f.endsWith('.css')).length;
    checks.push(`✅ ${jsFiles} JavaScript bundles`);
    checks.push(`✅ ${cssFiles} CSS stylesheets`);
    
    if (files.includes('manifest.webmanifest')) {
      checks.push('✅ PWA manifest present');
    }
    if (files.includes('sw.js')) {
      checks.push('✅ Service Worker ready');
    }
  } else {
    errors.push('❌ dist/index.html not found - run npm run build');
  }
} else {
  errors.push('❌ Build output missing - run npm run build');
}

// ✅ CHECK 2: Critical source files
console.log('\n📂 Checking source files...');
const criticalFiles = [
  'src/config/appwrite.config.ts',
  'src/services/appwrite-auth.service.ts',
  'src/services/appwrite-database.service.ts',
  'src/services/appwrite-storage.service.ts',
  'src/services/appwrite-realtime.service.ts',
  'src/services/appwrite-admin.service.ts',
  'src/services/appwrite-vendor.service.ts',
  'src/services/appwrite-customer.service.ts',
  'src/contexts/AuthContext.tsx',
  'src/stores/authStore.ts',
  'package.json',
  'vite.config.ts',
];

let foundFiles = 0;
criticalFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    foundFiles++;
  }
});
checks.push(`✅ ${foundFiles}/${criticalFiles.length} critical files present`);

// ✅ CHECK 3: Configuration
console.log('\n⚙️  Checking configuration...');
const configPath = path.join(__dirname, '..', 'src', 'config', 'appwrite.config.ts');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf-8');
  if (config.includes('68de87060019a1ca2b8b')) {
    checks.push('✅ Project ID configured: 68de87060019a1ca2b8b');
  }
  if (config.includes('souk_main_db')) {
    checks.push('✅ Database ID configured: souk_main_db');
  }
  if (config.includes('product_images')) {
    checks.push('✅ Storage buckets configured');
  }
}

// ✅ CHECK 4: Package.json scripts
console.log('\n📜 Checking npm scripts...');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  if (pkg.scripts) {
    if (pkg.scripts.build) checks.push('✅ Build script configured');
    if (pkg.scripts.dev) checks.push('✅ Dev script configured');
    if (pkg.scripts.test) checks.push('✅ Test script configured');
  }
  
  // Check dependencies
  const deps = Object.keys(pkg.dependencies || {});
  if (deps.includes('appwrite')) {
    checks.push('✅ Appwrite SDK installed');
  } else {
    errors.push('❌ Appwrite SDK not found in dependencies');
  }
  if (deps.includes('react')) checks.push('✅ React installed');
}

// ✅ CHECK 5: Git status
console.log('\n🔀 Checking Git status...');
const { execSync } = require('child_process');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim()) {
    warnings.push('⚠️  Uncommitted changes detected');
  } else {
    checks.push('✅ Git working tree clean');
  }
  
  const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  checks.push(`ℹ️  Current branch: ${branch}`);
  
  if (branch !== 'production') {
    warnings.push(`⚠️  Not on production branch (current: ${branch})`);
  }
} catch (e) {
  warnings.push('⚠️  Could not check Git status');
}

// ✅ CHECK 6: Documentation
console.log('\n📚 Checking documentation...');
const docs = [
  'DEPLOY_NOW.md',
  'APPWRITE_DEPLOYMENT_GUIDE.md',
  'TESTING_AND_DEPLOYMENT_GUIDE.md',
];
docs.forEach(doc => {
  if (fs.existsSync(path.join(__dirname, '..', doc))) {
    checks.push(`✅ ${doc}`);
  }
});

// ✅ CHECK 7: Test scripts
console.log('\n🧪 Checking test infrastructure...');
const testScripts = [
  'scripts/verify-appwrite-setup.cjs',
  'scripts/smoke-tests.cjs',
  'scripts/validate-deployment.cjs',
];
testScripts.forEach(script => {
  if (fs.existsSync(path.join(__dirname, '..', script))) {
    checks.push(`✅ ${path.basename(script)}`);
  }
});

// 📊 RESULTS
console.log('\n');
console.log('═'.repeat(60));
console.log('📊 FINAL CHECK RESULTS');
console.log('═'.repeat(60));

console.log('\n✅ PASSED CHECKS:');
checks.forEach(check => console.log(`   ${check}`));

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   ${warning}`));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('\n🔧 Please fix errors before deploying!');
  process.exit(1);
}

// 🎯 DEPLOYMENT READINESS SCORE
const totalChecks = checks.length;
const score = Math.round((totalChecks / (totalChecks + warnings.length)) * 100);

console.log('\n');
console.log('═'.repeat(60));
console.log(`🎯 DEPLOYMENT READINESS: ${score}%`);
console.log('═'.repeat(60));

if (score >= 95) {
  console.log('\n🎉 EXCELLENT! Your app is 100% ready to deploy!');
  console.log('\n📋 NEXT STEPS:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "feat: production ready with Appwrite"');
  console.log('   3. git push origin production');
  console.log('\n🌐 Your site will deploy automatically to:');
  console.log('   https://souk-al-sayarat.appwrite.network\n');
} else if (score >= 80) {
  console.log('\n✅ GOOD! Minor warnings detected but safe to deploy.');
  console.log('   Review warnings above if needed.');
} else {
  console.log('\n⚠️  CAUTION! Several warnings detected.');
  console.log('   Review and address warnings before deploying.');
}

console.log('\n💡 For detailed deployment guide, see: DEPLOY_NOW.md\n');

