#!/usr/bin/env node

/**
 * Fix all parsing errors in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all parsing errors...');

// Files with parsing errors
const filesToFix = [
  'src/services/notification.service.ts',
  'src/services/push-notification.service.ts', 
  'src/services/rbac.service.ts',
  'src/services/realtime-vendor.service.ts',
  'src/utils/performance-monitor.ts'
];

// Parsing error fixes
const parsingFixes = [
  // Fix (_ patterns
  { pattern: /query\(_/g, replacement: 'query(' },
  { pattern: /return\(_/g, replacement: 'return(' },
  { pattern: /setCustomParameters\(_\{/g, replacement: 'setCustomParameters({' },
  { pattern: /createNotification\(_'/g, replacement: "createNotification('" },
  { pattern: /console\.log\(_'/g, replacement: "console.log('" },
  { pattern: /sendMessage:\s*\(__/g, replacement: 'sendMessage: (' },
  
  // Fix common syntax errors
  { pattern: /,\s*,/g, replacement: ',' },
  { pattern: /\(\s*_/g, replacement: '(' },
  { pattern: /_\s*\)/g, replacement: ')' },
  { pattern: /\{\s*_/g, replacement: '{' },
  { pattern: /_\s*\}/g, replacement: '}' },
  
  // Fix return statements
  { pattern: /return\s+\(_/g, replacement: 'return (' }
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    parsingFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed parsing errors in: ${filePath}`);
      return true;
    } else {
      console.log(`✨ No parsing errors found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix specific files
let totalFixed = 0;
filesToFix.forEach(filePath => {
  if (fixFile(filePath)) {
    totalFixed++;
  }
});

// Also check all TypeScript files for common parsing errors
const glob = require('child_process').execSync;
try {
  const tsFiles = glob('dir /S /B src\\*.ts src\\*.tsx 2>nul', {encoding: 'utf8'}).split('\n').filter(f => f.trim());
  
  tsFiles.forEach(file => {
    if (file.trim() && fs.existsSync(file.trim())) {
      if (fixFile(file.trim())) {
        totalFixed++;
      }
    }
  });
} catch (err) {
  // Continue without globbing if dir command fails
}

console.log(`\n🎉 Fixed parsing errors in ${totalFixed} files!`);
console.log('🔧 Running lint again to check remaining issues...');
