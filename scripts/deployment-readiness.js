#!/usr/bin/env node

/**
 * 🚀 DEPLOYMENT READINESS SCRIPT
 * Comprehensive deployment readiness check for Souk El-Sayarat
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deployment readiness checklist
const DEPLOYMENT_CHECKLIST = {
  // Build requirements
  build: {
    'dist/index.html': 'Main HTML file',
    'dist/css/': 'CSS directory',
    'dist/js/': 'JavaScript directory',
    'dist/manifest.json': 'PWA manifest',
    'dist/sw.js': 'Service worker',
  },
  
  // Configuration files
  config: {
    'amplify.yml': 'AWS Amplify configuration',
    'package.json': 'Package configuration',
    'vite.config.ts': 'Vite build configuration',
    'tsconfig.json': 'TypeScript configuration',
    'tailwind.config.js': 'Tailwind CSS configuration',
    'postcss.config.js': 'PostCSS configuration',
  },
  
  // Security files
  security: {
    'src/utils/security.ts': 'Security utilities',
    'src/middleware/security.middleware.ts': 'Security middleware',
  },
  
  // Performance files
  performance: {
    'scripts/analyze-bundle.js': 'Bundle analysis script',
    'scripts/verify-env.js': 'Environment verification script',
  },
};

function checkDeploymentReadiness() {
  console.log('🚀 DEPLOYMENT READINESS CHECK\n');
  
  let allChecksPassed = true;
  const results = {
    build: { passed: 0, total: 0, issues: [] },
    config: { passed: 0, total: 0, issues: [] },
    security: { passed: 0, total: 0, issues: [] },
    performance: { passed: 0, total: 0, issues: [] },
  };
  
  // Check build artifacts
  console.log('📦 BUILD ARTIFACTS CHECK:\n');
  console.log('='.repeat(80));
  console.log('FILE'.padEnd(50) + 'STATUS'.padStart(15) + 'DESCRIPTION'.padStart(15));
  console.log('='.repeat(80));
  
  Object.entries(DEPLOYMENT_CHECKLIST.build).forEach(([pattern, description]) => {
    results.build.total++;
    const files = findFiles(pattern);
    if (files.length > 0) {
      console.log(pattern.padEnd(50) + '✅ FOUND'.padStart(15) + description.padStart(15));
      results.build.passed++;
    } else {
      // Check if it's a specific file that should exist
      const specificFile = path.join(__dirname, '..', pattern);
      if (fs.existsSync(specificFile)) {
        console.log(pattern.padEnd(50) + '✅ FOUND'.padStart(15) + description.padStart(15));
        results.build.passed++;
      } else {
        console.log(pattern.padEnd(50) + '❌ MISSING'.padStart(15) + description.padStart(15));
        results.build.issues.push(`Missing: ${pattern}`);
        allChecksPassed = false;
      }
    }
  });
  
  console.log('='.repeat(80));
  
  // Check configuration files
  console.log('\n⚙️  CONFIGURATION FILES CHECK:\n');
  console.log('='.repeat(80));
  console.log('FILE'.padEnd(50) + 'STATUS'.padStart(15) + 'DESCRIPTION'.padStart(15));
  console.log('='.repeat(80));
  
  Object.entries(DEPLOYMENT_CHECKLIST.config).forEach(([file, description]) => {
    results.config.total++;
    if (fs.existsSync(path.join(__dirname, '..', file))) {
      console.log(file.padEnd(50) + '✅ FOUND'.padStart(15) + description.padStart(15));
      results.config.passed++;
    } else {
      console.log(file.padEnd(50) + '❌ MISSING'.padStart(15) + description.padStart(15));
      results.config.issues.push(`Missing: ${file}`);
      allChecksPassed = false;
    }
  });
  
  console.log('='.repeat(80));
  
  // Check security files
  console.log('\n🛡️  SECURITY FILES CHECK:\n');
  console.log('='.repeat(80));
  console.log('FILE'.padEnd(50) + 'STATUS'.padStart(15) + 'DESCRIPTION'.padStart(15));
  console.log('='.repeat(80));
  
  Object.entries(DEPLOYMENT_CHECKLIST.security).forEach(([file, description]) => {
    results.security.total++;
    if (fs.existsSync(path.join(__dirname, '..', file))) {
      console.log(file.padEnd(50) + '✅ FOUND'.padStart(15) + description.padStart(15));
      results.security.passed++;
    } else {
      console.log(file.padEnd(50) + '❌ MISSING'.padStart(15) + description.padStart(15));
      results.security.issues.push(`Missing: ${file}`);
      allChecksPassed = false;
    }
  });
  
  console.log('='.repeat(80));
  
  // Check performance files
  console.log('\n⚡ PERFORMANCE FILES CHECK:\n');
  console.log('='.repeat(80));
  console.log('FILE'.padEnd(50) + 'STATUS'.padStart(15) + 'DESCRIPTION'.padStart(15));
  console.log('='.repeat(80));
  
  Object.entries(DEPLOYMENT_CHECKLIST.performance).forEach(([file, description]) => {
    results.performance.total++;
    if (fs.existsSync(path.join(__dirname, '..', file))) {
      console.log(file.padEnd(50) + '✅ FOUND'.padStart(15) + description.padStart(15));
      results.performance.passed++;
    } else {
      console.log(file.padEnd(50) + '❌ MISSING'.padStart(15) + description.padStart(15));
      results.performance.issues.push(`Missing: ${file}`);
      allChecksPassed = false;
    }
  });
  
  console.log('='.repeat(80));
  
  // Summary
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY:\n');
  console.log('='.repeat(80));
  console.log('CATEGORY'.padEnd(20) + 'PASSED'.padStart(10) + 'TOTAL'.padStart(10) + 'STATUS'.padStart(20));
  console.log('='.repeat(80));
  
  Object.entries(results).forEach(([category, result]) => {
    const status = result.passed === result.total ? '✅ READY' : '❌ ISSUES';
    console.log(category.toUpperCase().padEnd(20) + 
                `${result.passed}`.padStart(10) + 
                `${result.total}`.padStart(10) + 
                status.padStart(20));
  });
  
  console.log('='.repeat(80));
  
  // Overall status
  const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const totalChecks = Object.values(results).reduce((sum, result) => sum + result.total, 0);
  const readinessScore = Math.round((totalPassed / totalChecks) * 100);
  
  console.log(`\n📈 DEPLOYMENT READINESS SCORE: ${readinessScore}%`);
  
  if (readinessScore >= 90) {
    console.log('🎉 DEPLOYMENT READY!');
    console.log('✅ All critical components are present');
    console.log('✅ Ready for AWS Amplify deployment');
  } else if (readinessScore >= 70) {
    console.log('⚠️  DEPLOYMENT READY WITH WARNINGS');
    console.log('⚠️  Some components are missing but core functionality is present');
    console.log('⚠️  Review missing components before deployment');
  } else {
    console.log('❌ DEPLOYMENT NOT READY');
    console.log('❌ Critical components are missing');
    console.log('❌ Cannot proceed with deployment');
    allChecksPassed = false;
  }
  
  // Recommendations
  console.log('\n🔧 DEPLOYMENT RECOMMENDATIONS:\n');
  console.log('1. Run npm run build to generate production build');
  console.log('2. Verify all environment variables are set');
  console.log('3. Test the application locally before deployment');
  console.log('4. Configure AWS Amplify with proper settings');
  console.log('5. Set up monitoring and logging');
  console.log('6. Configure custom domain if needed');
  console.log('7. Set up SSL certificates');
  console.log('8. Configure CDN for better performance');
  
  // Next steps
  console.log('\n🚀 NEXT STEPS:\n');
  console.log('1. Run: npm run build');
  console.log('2. Run: npm run security:audit');
  console.log('3. Run: npm run analyze:bundle');
  console.log('4. Deploy to AWS Amplify');
  console.log('5. Configure monitoring and alerts');
  
  if (!allChecksPassed) {
    console.log('\n❌ DEPLOYMENT BLOCKED');
    console.log('❌ Please resolve all issues before deployment');
    process.exit(1);
  } else {
    console.log('\n✅ DEPLOYMENT APPROVED');
    console.log('✅ All checks passed - ready for deployment');
    process.exit(0);
  }
}

// Helper function to find files matching pattern
function findFiles(pattern) {
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) return [];
  
  const files = [];
  const searchDir = (dir) => {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else {
        const relativePath = path.relative(distPath, fullPath);
        if (matchPattern(relativePath, pattern)) {
          files.push(relativePath);
        }
      }
    });
  };
  
  searchDir(distPath);
  return files;
}

// Helper function to match file patterns
function matchPattern(filename, pattern) {
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
  }
  return filename === pattern;
}

checkDeploymentReadiness();
