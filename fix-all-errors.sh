#!/bin/bash

echo "🔧 Comprehensive Lint Error Fix Script"
echo "======================================"

# Fix 1: EnhancedHeroSlider_Premium.tsx
echo "Fixing EnhancedHeroSlider_Premium.tsx..."
sed -i 's/const \[isAutoPlaying, _setIsAutoPlaying\]/const [isAutoPlaying] = useState(true); \/\/ setIsAutoPlaying not needed currently/' src/components/ui/EnhancedHeroSlider_Premium.tsx

# Fix 2: useRealTimeDashboard.ts  
echo "Fixing useRealTimeDashboard.ts..."
sed -i 's/import { useEffect, useState }/import { useState }/' src/hooks/useRealTimeDashboard.ts

# Fix 3: AdminDashboard.tsx
echo "Fixing AdminDashboard.tsx..."
sed -i 's/const \[user, setUser\] = useState/const [user] = useState/' src/pages/admin/AdminDashboard.tsx

# Fix 4: Enhanced VendorDashboard.tsx
echo "Fixing EnhancedVendorDashboard.tsx..."
sed -i 's/const navigationEntry = /\/\/ const navigationEntry = /' src/pages/vendor/EnhancedVendorDashboard.tsx
sed -i 's/const registration = /\/\/ const registration = /' src/pages/vendor/EnhancedVendorDashboard.tsx

# Fix 5: VendorDashboard.tsx - Remove unused React
echo "Fixing VendorDashboard.tsx..."
sed -i "/^import React from 'react';$/d" src/pages/vendor/VendorDashboard.tsx

# Fix 6: useSearch.ts
echo "Fixing useSearch.ts..."
sed -i 's/const { language } = useAppStore();/\/\/ Language support - currently using default/' src/hooks/useSearch.ts

# Fix 7: middleware security - comment out unused
echo "Fixing security.middleware.ts..."
sed -i 's/^export const escapeHtml/\/\/ eslint-disable-next-line @typescript-eslint\/no-unused-vars\nexport const escapeHtml/' src/middleware/security.middleware.ts
sed -i 's/^export const generateCSRFToken/\/\/ eslint-disable-next-line @typescript-eslint\/no-unused-vars\nexport const generateCSRFToken/' src/middleware/security.middleware.ts

# Fix 8: component-connector - prefix params
echo "Fixing component-connector.ts..."
sed -i 's/connection: any/_connection: any/g' src/utils/component-connector.ts

echo "✅ Applied all fixes!"
echo "📊 Checking remaining errors..."

npm run lint:ci 2>&1 | tail -30
