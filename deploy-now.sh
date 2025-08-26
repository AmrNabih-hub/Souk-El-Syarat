#!/bin/bash

# 🚀 QUICK FIREBASE DEPLOYMENT - SOUK EL-SYARAT
# Simple one-command deployment for your automotive marketplace

set -e

echo "🚀 Deploying Souk El-Syarat (سوق السيارات) to Firebase..."
echo "Egyptian Automotive Marketplace - Professional Deployment"
echo "================================================"

# Set your Firebase token (replace with your actual token)
export FIREBASE_TOKEN="1//03jtuUQ2Praj5CgYIARAAGAMSNwF-L9Ir-a4AkXp9_-GWz3fVqC9ghMdFsxWgsv8jjBxmNwByx2QX7wPWJD76psKMtaHFk-8-yvo"

# Quick deployment steps
echo "📦 Installing dependencies..."
npm ci --silent

echo "🔨 Building for production..."
NODE_ENV=production npm run build:production || NODE_ENV=production npm run build

echo "🔥 Deploying to Firebase..."
firebase deploy --token "$FIREBASE_TOKEN" --non-interactive --force

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Your Souk El-Syarat marketplace is now LIVE!"
echo "🇪🇬 Egyptian automotive community can now access your platform"
echo ""
echo "Next steps:"
echo "1. Visit your Firebase console to verify deployment"
echo "2. Test the application functionality"
echo "3. Check authentication and user registration"
echo "4. Verify Arabic language support"
echo ""
echo "🎉 Professional deployment successful!"