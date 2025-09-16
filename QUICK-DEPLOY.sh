#!/bin/bash

echo "🚀 QUICK DEPLOYMENT - BUDGET OPTIMIZED"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Check budget
echo "💰 Remaining budget: $5"
echo "🎯 Target: Deploy for FREE using Firebase Hosting"

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Step 2: Build optimized production bundle
echo "🔧 Building optimized production bundle..."
npm run build

# Check build size
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
    
    # Warn if build is too large
    if [ $(du -s dist/ | cut -f1) -gt 50000 ]; then
        echo "⚠️  Warning: Build size is large. Consider optimization."
    fi
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Step 3: Check Firebase configuration
echo "🔍 Checking Firebase configuration..."
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if Firebase is initialized
if [ ! -f "firebase.json" ]; then
    echo "🔧 Initializing Firebase..."
    firebase init hosting --project souk-el-syarat
fi

# Step 4: Deploy to Firebase Hosting
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be live at: https://souk-el-syarat.web.app"
    echo "📊 Check Firebase Console for details"
else
    echo "❌ Deployment failed"
    echo "🔧 Try running: firebase login"
    echo "🔧 Then run this script again"
fi

echo "💰 Cost: $0 (Free tier)"
echo "🎉 Deployment complete!"