#!/bin/bash

# ========================================
# Auto-fix common issues
# ========================================

echo "🔧 Starting automatic issue fixing..."

# Fix React import in animations.ts (already done)

# Remove unused imports from chat.service.ts
sed -i '7d' src/services/chat.service.ts  # Remove realtimeDb
sed -i '20d' src/services/chat.service.ts # Remove Timestamp
sed -i '22,22d' src/services/chat.service.ts # Remove unused Firebase imports

# Fix NodeJS type issues
echo "📝 Adding NodeJS type definitions..."
cat << 'EOF' >> src/types/globals.d.ts

// NodeJS types for timers
declare namespace NodeJS {
  interface Timeout {}
  interface Timer {}
}

// Notification Permission type
type NotificationPermission = 'default' | 'denied' | 'granted';
EOF

# Remove console.log statements in production
echo "🧹 Removing console.log statements..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log/\/\/ console.log/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.error/\/\/ console.error/g'

# Fix missing display names
echo "📛 Adding display names to components..."
sed -i 's/React.memo(({ children, roles, redirectTo = .*/const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[]; redirectTo?: string; }> = React.memo(({ children, roles, redirectTo = /' src/App.tsx

# Fix OrderStatus enum reference
echo "🔄 Fixing OrderStatus references..."
sed -i "s/OrderStatus\.PENDING/'pending'/g" src/hooks/useRealTimeDashboard.ts

echo "✅ Automatic fixes applied!"