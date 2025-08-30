#!/bin/bash

# 🚀 Souk El-Sayarat Deployment Script
# This script builds and prepares the app for Firebase deployment

echo "🚀 Starting Souk El-Sayarat Deployment Process..."
echo "================================================"

# Step 1: Check Node and npm
echo "📦 Checking Node.js and npm versions..."
node --version
npm --version

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Step 3: Build the application
echo ""
echo "🏗️ Building the application..."
npm run build

# Step 4: Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful! dist folder created."
    echo ""
    echo "📁 Build contents:"
    ls -la dist/
else
    echo "❌ Build failed! dist folder not found."
    exit 1
fi

# Step 5: Firebase deployment instructions
echo ""
echo "================================================"
echo "🔥 FIREBASE DEPLOYMENT INSTRUCTIONS"
echo "================================================"
echo ""
echo "The app is now built and ready for deployment!"
echo ""
echo "To deploy to Firebase Hosting, run:"
echo ""
echo "  1. First, login to Firebase (if not already logged in):"
echo "     firebase login"
echo ""
echo "  2. Then deploy to Firebase Hosting:"
echo "     firebase deploy --only hosting"
echo ""
echo "  3. Your app will be available at:"
echo "     🌐 https://souk-el-syarat.web.app"
echo "     🌐 https://souk-el-syarat.firebaseapp.com"
echo ""
echo "================================================"
echo ""
echo "📋 Post-deployment checklist:"
echo "  ✓ Test authentication (login/register)"
echo "  ✓ Check real-time features (chat widget)"
echo "  ✓ Verify product listings"
echo "  ✓ Test order placement"
echo "  ✓ Check mobile responsiveness"
echo ""
echo "🎉 Good luck with your deployment!"