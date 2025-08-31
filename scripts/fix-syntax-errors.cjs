#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/services/product.service.ts',
  'src/services/admin.service.ts',
  'src/services/analytics.service.ts',
  'src/services/order.service.ts',
  'src/services/enhanced-auth.service.ts',
  'src/hooks/usePerformanceOptimization.ts',
  'src/hooks/useRealTimeDashboard.ts',
  'src/test/setup.ts',
  'src/test/test-setup.ts',
];

function fixFile(filePath) {
  const fullPath = path.join('/workspace', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Fix double if statements
  content = content.replace(
    /if \(process\.env\.NODE_ENV === ['"]development['"]\)\s*if \(process\.env\.NODE_ENV === ['"]development['"]\)/g,
    'if (process.env.NODE_ENV === \'development\')'
  );
  
  // Fix orphaned console statements after if
  content = content.replace(
    /if \(process\.env\.NODE_ENV === ['"]development['"]\)\s*\/\/ console\.(log|error|warn)/g,
    'if (process.env.NODE_ENV === \'development\') {\n      // console.$1'
  );
  
  // Add missing closing braces after console statements
  content = content.replace(
    /(if \(process\.env\.NODE_ENV === ['"]development['"]\) \{\s*\/\/ console\.[^}]+)(\n\s*)(} catch|throw|return|\/\/|$)/gm,
    '$1\n    }$2$3'
  );
  
  // Fix broken argument expressions (empty console.log)
  content = content.replace(
    /\/\/ console\.(log|error|warn)\(\s*\)/g,
    '// console.$1(\'\')'
  );
  
  // Fix test-setup.ts specific issue
  if (filePath.includes('test-setup.ts')) {
    content = content.replace(
      /\/\/ console\.error\('Motion component received props:' props\)/g,
      '// console.error(\'Motion component received props:\', props)'
    );
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

// Fix all files
console.log('Fixing syntax errors in TypeScript files...\n');

filesToFix.forEach(file => {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n✅ All files processed!');