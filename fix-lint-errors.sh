#!/bin/bash

# Script to fix remaining lint errors systematically

echo "🔧 Fixing remaining lint errors..."

# Fix EnhancedHeroSlider_Premium.tsx - unused setIsAutoPlaying
sed -i 's/const \[isAutoPlaying, setIsAutoPlaying\]/const [isAutoPlaying, _setIsAutoPlaying]/' src/components/ui/EnhancedHeroSlider_Premium.tsx

# Fix hooks/useRealTimeDashboard.ts - unused useEffect
sed -i 's/import { useEffect,/import {/' src/hooks/useRealTimeDashboard.ts

# Fix pages/admin/AdminDashboard.tsx - unused setUser
sed -i 's/const \[user, setUser\]/const [user, _setUser]/' src/pages/admin/AdminDashboard.tsx

# Fix pages/vendor/EnhancedVendorDashboard.tsx - unused variables
sed -i 's/const navigationEntry =/\/\/ const navigationEntry =/' src/pages/vendor/EnhancedVendorDashboard.tsx
sed -i 's/const registration =/\/\/ const registration =/' src/pages/vendor/EnhancedVendorDashboard.tsx

# Fix pages/vendor/VendorDashboard.tsx - unused React import
sed -i "s/^import React from 'react';$/\/\/ React import not needed with new JSX transform/" src/pages/vendor/VendorDashboard.tsx

# Fix hooks/useSearch.ts - unused imports
sed -i 's/, ProductCategory//' src/hooks/useSearch.ts
sed -i 's/language,//' src/hooks/useSearch.ts
sed -i '76s/const language =/\/\/ const language =/' src/hooks/useSearch.ts

# Fix middleware/security.middleware.ts - unused functions
sed -i 's/export const escapeHtml/\/\/ export const escapeHtml/' src/middleware/security.middleware.ts
sed -i 's/export const generateCSRFToken/\/\/ export const generateCSRFToken/' src/middleware/security.middleware.ts

# Fix utils/component-connector.ts - unused connection params
sed -i 's/connection: any/\_connection: any/g' src/utils/component-connector.ts

echo "✅ Fixed lint errors via script"
echo "🔍 Running lint check..."

npm run lint:ci 2>&1 | tail -20
