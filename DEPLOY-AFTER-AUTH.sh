#!/bin/bash

echo "🚀 DEPLOYMENT SCRIPT - RUN AFTER FIREBASE LOGIN"
echo "=============================================="

# Check if Firebase is authenticated
echo "🔍 Checking Firebase authentication..."
if ! firebase projects:list > /dev/null 2>&1; then
    echo "❌ Firebase not authenticated. Please run: firebase login"
    exit 1
fi

echo "✅ Firebase authenticated"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Set Firebase project
echo "🔧 Setting Firebase project..."
firebase use souk-el-syarat

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production bundle
echo "🔧 Building production bundle..."
npm run build

# Check build size
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
    
    # Check if build is too large
    BUILD_KB=$(du -s dist/ | cut -f1)
    if [ $BUILD_KB -gt 50000 ]; then
        echo "⚠️  Warning: Build size is large ($BUILD_SIZE). Consider optimization."
    else
        echo "✅ Build size is acceptable"
    fi
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Deploy to Firebase Hosting
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo "🌐 Your app is live at: https://souk-el-syarat.web.app"
    echo "💰 Cost: $0/month (Free tier)"
    echo "📊 Check Firebase Console for analytics"
    echo ""
    echo "🔍 Next steps:"
    echo "1. Test the live app"
    echo "2. Check authentication"
    echo "3. Verify all pages work"
    echo "4. Test on mobile"
    echo ""
else
    echo "❌ Deployment failed"
    echo "🔧 Troubleshooting:"
    echo "1. Check Firebase project: firebase projects:list"
    echo "2. Check hosting config: firebase hosting:channel:list"
    echo "3. Try again: firebase deploy --only hosting"
fi