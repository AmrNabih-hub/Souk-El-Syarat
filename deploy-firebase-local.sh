#!/bin/bash

# Firebase Deployment Script for Local Execution
# Run this script on your local machine where you have Firebase CLI authenticated

echo "🚀 Firebase Deployment Script"
echo "============================="
echo ""
echo "This script will deploy your Souk El-Syarat app to Firebase Hosting"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed!"
    echo "Please install it first with: npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in the project root directory!"
    echo "Please run this script from the Souk-El-Syarat project root"
    exit 1
fi

echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🔥 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project souk-el-syarat

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment Successful!"
    echo "============================="
    echo "🌐 Your app is now live at:"
    echo "   https://souk-el-syarat.web.app"
    echo "   https://souk-el-syarat.firebaseapp.com"
    echo ""
    echo "Share these URLs with your client to see the app instantly!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please make sure you're authenticated with: firebase login"
fi