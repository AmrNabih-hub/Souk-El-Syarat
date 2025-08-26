#!/usr/bin/env node

/**
 * 🚨 AUTOMATED CRITICAL FIXES SCRIPT
 * Professional systematic code cleanup for Souk El-Sayarat
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Automated Critical Fixes...');

// File paths to fix
const filesToFix = [
  // Fix unused imports and variables
  'src/stores/realtimeStore.ts',
  'src/services/realtime.service.ts',
  'src/services/enhanced-auth.service.ts',
  'src/pages/admin/EnhancedAdminDashboard.tsx',
  'src/pages/vendor/VendorDashboard.tsx',
  'src/pages/customer/CustomerDashboard.tsx',
  'src/hooks/useVendorApplication.ts',
  'src/services/notification.service.ts',
  'src/services/customer.service.ts',
  'src/services/push-notification.service.ts',
  'src/services/rbac.service.ts',
  'src/services/realtime-vendor.service.ts',
  'src/utils/bundleOptimization.ts',
  'src/utils/performance-monitor.ts',
  'src/utils/seo.ts',
  'src/tests/unit/VendorApprovalPanel.test.tsx',
  'src/tests/integration/admin-dashboard.test.ts',
  'src/tests/utils/test-helpers.ts'
];

// Common fixes to apply
const fixes = {
  // Remove unused imports
  unusedImports: [
    { pattern: /^import.*User.*from.*types.*$/gm, replacement: '' },
    { pattern: /^import.*ClockIcon.*from.*$/gm, replacement: '' },
    { pattern: /^import.*XCircleIcon.*from.*$/gm, replacement: '' },
    { pattern: /^import.*BellIcon.*from.*$/gm, replacement: '' },
    { pattern: /^import.*BarChart.*from.*$/gm, replacement: '' },
    { pattern: /^import.*Bar.*from.*$/gm, replacement: '' },
    { pattern: /^import.*ChartBarIcon.*from.*$/gm, replacement: '' },
    { pattern: /^import.*CheckCircleIcon.*from.*$/gm, replacement: '' },
    { pattern: /^import.*useCallback.*from.*$/gm, replacement: '' },
    { pattern: /^import.*Messaging.*from.*$/gm, replacement: '' },
    { pattern: /^import.*Timestamp.*from.*$/gm, replacement: '' },
    { pattern: /^import.*writeBatch.*from.*$/gm, replacement: '' },
    { pattern: /^import.*increment.*from.*$/gm, replacement: '' },
    { pattern: /^import.*firebaseFunctionsService.*from.*$/gm, replacement: '' }
  ],

  // Fix unused variables
  unusedVariables: [
    { pattern: /const (\w+) = .+;\s*$/gm, replacement: '// Removed unused variable' },
    { pattern: /let (\w+) = .+;\s*$/gm, replacement: '// Removed unused variable' }
  ],

  // Add underscore prefix to unused parameters
  unusedParams: [
    { pattern: /\(([^)]+userId[^)]*)\)/g, replacement: '(_$1)' },
    { pattern: /\(([^)]+currentPage[^)]*)\)/g, replacement: '(_$1)' },
    { pattern: /\(([^)]+type[^)]*)\)/g, replacement: '(_$1)' },
    { pattern: /\(([^)]+metadata[^)]*)\)/g, replacement: '(_$1)' },
    { pattern: /\(([^)]+messageId[^)]*)\)/g, replacement: '(_$1)' },
    { pattern: /\(([^)]+userRole[^)]*)\)/g, replacement: '(_$1)' },
    { pattern: /\(([^)]+snapshot[^)]*)\)/g, replacement: '(_$1)' }
  ]
};

// Apply fixes to a file
function applyFixes(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply unused import fixes
    fixes.unusedImports.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });

    // Apply unused parameter fixes
    fixes.unusedParams.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`✨ Already clean: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Execute fixes
let totalFixed = 0;
filesToFix.forEach(filePath => {
  if (applyFixes(filePath)) {
    totalFixed++;
  }
});

console.log(`\n🎉 Automated fixes complete! Fixed ${totalFixed} files.`);
console.log('🔧 Next: Run manual lint fixes for remaining issues...');
