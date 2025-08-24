#!/bin/bash

echo "🔧 RECOVERY: Fixing Syntax Errors and Restoring Build"
echo "==================================================="

# Step 1: Fix the malformed timestamp patterns
echo "📝 Step 1: Fixing malformed timestamp patterns..."

# Fix the double question mark patterns that are causing syntax errors
find src -name "*.ts" -o -name "*.tsx" -exec sed -i 's/??.toDate?.() || new Date()/.toDate() || new Date()/g' {} \;

# Step 2: Fix critical syntax errors in react.d.ts
echo "📝 Step 2: Fixing react.d.ts syntax errors..."

# Remove the malformed function declaration
sed -i '/export function useEffect(): void (effect:/d' src/types/react.d.ts

# Step 3: Restore essential React imports that were removed
echo "📝 Step 3: Restoring essential imports..."

# Add React import to files that need it
files_needing_react=(
  "src/pages/admin/EnhancedAdminDashboard.tsx"
  "src/pages/auth/AdminLoginPage.tsx"
  "src/pages/auth/LoginPage.tsx"  
  "src/pages/auth/RegisterPage.tsx"
  "src/pages/customer/CartPage.tsx"
  "src/pages/customer/MarketplacePage.tsx"
  "src/pages/customer/ProductDetailsPage.tsx"
  "src/pages/customer/VendorsPage.tsx"
  "src/pages/customer/WishlistPage.tsx"
  "src/test/utils/test-utils.tsx"
)

for file in "${files_needing_react[@]}"; do
  if [ -f "$file" ]; then
    # Add React import if not present
    if ! grep -q "import React" "$file"; then
      sed -i '1i import React from '\''react'\'';' "$file"
    fi
  fi
done

# Step 4: Restore useState, useEffect imports where needed
echo "📝 Step 4: Restoring React hooks imports..."

# Add useState, useEffect imports to files that use them
hooks_files=(
  "src/pages/admin/EnhancedAdminDashboard.tsx"
  "src/pages/auth/AdminLoginPage.tsx"
  "src/pages/auth/RegisterPage.tsx"
  "src/pages/customer/CartPage.tsx"
  "src/pages/customer/MarketplacePage.tsx"
  "src/pages/customer/ProductDetailsPage.tsx"
  "src/pages/customer/VendorsPage.tsx"
  "src/pages/customer/WishlistPage.tsx"
)

for file in "${hooks_files[@]}"; do
  if [ -f "$file" ]; then
    # Add hooks import if useState or useEffect is used but not imported
    if grep -q "useState\|useEffect" "$file" && ! grep -q "import.*{.*useState\|useEffect" "$file"; then
      sed -i '/import React/a import { useState, useEffect } from '\''react'\'';' "$file"
    fi
  fi
done

# Step 5: Fix specific critical files
echo "📝 Step 5: Fixing specific critical issues..."

# Fix Firebase imports in services
firebase_services=(
  "src/services/auth.service.ts"
  "src/services/firebase.ts"
  "src/services/push-notification.service.ts"
)

for file in "${firebase_services[@]}"; do
  if [ -f "$file" ]; then
    # Add missing Firebase imports
    if ! grep -q "import { db, auth" "$file"; then
      sed -i '1i import { db, auth } from '\''@/config/firebase.config'\'';' "$file"
    fi
  fi
done

# Step 6: Basic lint fixes that are safe
echo "📝 Step 6: Applying safe lint fixes..."

# Only fix the most basic issues without breaking anything
npm run lint:fix 2>/dev/null || true

# Step 7: Test the build
echo "📝 Step 7: Testing the build..."

if npm run build:deploy; then
  echo "✅ Build is now working!"
else
  echo "❌ Build still failing - needs manual intervention"
fi

echo "🔄 Recovery script completed!"