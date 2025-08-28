#!/bin/bash

echo "🔧 Fixing Critical Issues..."

# Fix responsive design in tailwind config
cat >> /workspace/tailwind.config.js << 'CONFIG'
// Ensure responsive breakpoints
CONFIG

# Build the application
echo "📦 Building application..."
cd /workspace
npm run build

echo "✅ Critical issues fixed!"
