#!/usr/bin/env node

/**
 * 🚀 PROFESSIONAL BUNDLE ANALYSIS SCRIPT
 * Analyzes bundle size and provides optimization recommendations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist');
const jsPath = path.join(distPath, 'js');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('🔍 ANALYZING BUNDLE SIZE...\n');
  
  if (!fs.existsSync(jsPath)) {
    console.error('❌ No dist/js directory found. Run npm run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(jsPath);
  const fileStats = files.map(file => {
    const filePath = path.join(jsPath, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      path: filePath
    };
  });

  // Sort by size (largest first)
  fileStats.sort((a, b) => b.size - a.size);

  console.log('📊 BUNDLE ANALYSIS RESULTS:\n');
  console.log('='.repeat(80));
  console.log('FILE NAME'.padEnd(50) + 'SIZE'.padStart(15) + 'STATUS'.padStart(15));
  console.log('='.repeat(80));

  let totalSize = 0;
  const criticalFiles = [];
  const warningFiles = [];

  fileStats.forEach(file => {
    totalSize += file.size;
    const sizeFormatted = formatBytes(file.size);
    let status = '✅ OK';
    
    if (file.size > 500 * 1024) { // 500KB
      status = '🚨 CRITICAL';
      criticalFiles.push(file);
    } else if (file.size > 200 * 1024) { // 200KB
      status = '⚠️  WARNING';
      warningFiles.push(file);
    }

    console.log(file.name.padEnd(50) + sizeFormatted.padStart(15) + status.padStart(15));
  });

  console.log('='.repeat(80));
  console.log(`TOTAL SIZE: ${formatBytes(totalSize)}`);
  console.log('='.repeat(80));

  // Recommendations
  console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:\n');

  if (criticalFiles.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Files > 500KB):');
    criticalFiles.forEach(file => {
      console.log(`   - ${file.name} (${formatBytes(file.size)})`);
    });
    console.log('\n   💡 ACTIONS REQUIRED:');
    console.log('   - Implement code splitting for large chunks');
    console.log('   - Use dynamic imports for heavy libraries');
    console.log('   - Consider lazy loading for non-critical features');
    console.log('   - Remove unused dependencies');
  }

  if (warningFiles.length > 0) {
    console.log('\n⚠️  WARNINGS (Files > 200KB):');
    warningFiles.forEach(file => {
      console.log(`   - ${file.name} (${formatBytes(file.size)})`);
    });
    console.log('\n   💡 OPTIMIZATION SUGGESTIONS:');
    console.log('   - Review chunk splitting strategy');
    console.log('   - Consider tree shaking unused code');
    console.log('   - Implement lazy loading where possible');
  }

  // Performance score
  const performanceScore = Math.max(0, 100 - (totalSize / 1024 / 1024) * 10); // Penalty for each MB
  console.log(`\n📈 PERFORMANCE SCORE: ${performanceScore.toFixed(1)}/100`);
  
  if (performanceScore < 70) {
    console.log('🚨 PERFORMANCE CRITICAL - IMMEDIATE OPTIMIZATION REQUIRED');
  } else if (performanceScore < 85) {
    console.log('⚠️  PERFORMANCE WARNING - OPTIMIZATION RECOMMENDED');
  } else {
    console.log('✅ PERFORMANCE GOOD - MINOR OPTIMIZATIONS POSSIBLE');
  }

  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Run npm run build to generate optimized bundle');
  console.log('2. Implement lazy loading for large components');
  console.log('3. Use dynamic imports for heavy libraries');
  console.log('4. Remove unused dependencies');
  console.log('5. Optimize images and assets');
}

analyzeBundle();
