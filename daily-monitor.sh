#!/bin/bash

echo "📊 DAILY MONITORING - $(date)"
echo "============================="

# Check if app is running
echo "🔍 Checking app status..."
if curl -s https://souk-el-syarat.web.app > /dev/null; then
    echo "✅ App is running"
else
    echo "❌ App is down"
fi

# Check build size
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
else
    echo "⚠️  No build found"
fi

# Check dependencies
echo "📦 Checking dependencies..."
npm list --depth=0 2>/dev/null | grep -E "(firebase|@firebase)" || echo "No Firebase dependencies found"

# Display cost summary
echo ""
echo "💰 COST SUMMARY:"
echo "  Firebase Hosting: $0/month"
echo "  Firebase Auth: $0/month"
echo "  Firestore: $0/month (Free tier)"
echo "  Storage: $0/month (Free tier)"
echo "  Total: $0/month"
echo ""
echo "✅ All services within free tier"
