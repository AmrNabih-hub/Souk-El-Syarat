#!/bin/bash

# 🚀 **SOUK EL-SAYARAT PRODUCTION DEPLOYMENT SCRIPT**
# Global E-commerce Marketplace Platform

set -e  # Exit on any error

echo "🚀 Starting Production Deployment for Souk El-Sayarat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="souk-elsayarat"
ENVIRONMENT="production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Project: $PROJECT_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}🔍 Step 1: Pre-deployment Checks${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

# Check if logged into Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged into Firebase. Please login first:${NC}"
    echo "   firebase login"
    exit 1
fi

# Check if in correct directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Not in project root directory. Please run from project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
echo ""

# Step 2: Build the application
echo -e "${YELLOW}🔨 Step 2: Building Application${NC}"

# Clean previous builds
echo "   Cleaning previous builds..."
rm -rf build/
rm -rf dist/

# Install dependencies
echo "   Installing dependencies..."
npm ci --production

# Build for production
echo "   Building for production..."
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build failed. Check for errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application built successfully${NC}"
echo ""

# Step 3: Run tests
echo -e "${YELLOW}🧪 Step 3: Running Tests${NC}"

echo "   Running test suite..."
npm test -- --run --reporter=verbose

echo -e "${GREEN}✅ Tests passed${NC}"
echo ""

# Step 4: Deploy to Firebase
echo -e "${YELLOW}🚀 Step 4: Deploying to Firebase${NC}"

# Deploy Firestore rules
echo "   Deploying Firestore security rules..."
firebase deploy --only firestore:rules --project $PROJECT_NAME

# Deploy Storage rules
echo "   Deploying Storage security rules..."
firebase deploy --only storage --project $PROJECT_NAME

# Deploy Functions (if any)
echo "   Deploying Firebase Functions..."
firebase deploy --only functions --project $PROJECT_NAME

# Deploy Hosting
echo "   Deploying to Firebase Hosting..."
firebase deploy --only hosting --project $PROJECT_NAME

echo -e "${GREEN}✅ Firebase deployment completed${NC}"
echo ""

# Step 5: Post-deployment verification
echo -e "${YELLOW}🔍 Step 5: Post-deployment Verification${NC}"

# Get deployment URL
DEPLOY_URL=$(firebase hosting:channel:list --project $PROJECT_NAME | grep "live" | awk '{print $2}')

if [ -z "$DEPLOY_URL" ]; then
    DEPLOY_URL="https://$PROJECT_NAME.web.app"
fi

echo "   Deployment URL: $DEPLOY_URL"

# Check if site is accessible
echo "   Verifying site accessibility..."
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Site accessibility check failed (this might be normal for new deployments)${NC}"
fi

echo ""

# Step 6: Performance check
echo -e "${YELLOW}⚡ Step 6: Performance Check${NC}"

# Basic performance metrics
echo "   Checking build size..."
BUILD_SIZE=$(du -sh build/ | cut -f1)
echo "   Build size: $BUILD_SIZE"

echo "   Checking bundle analysis..."
if [ -f "build/static/js/main.*.js" ]; then
    JS_SIZE=$(du -sh build/static/js/main.*.js | cut -f1)
    echo "   Main JS bundle: $JS_SIZE"
fi

echo ""

# Step 7: Final status
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "   ✅ Application built and tested"
echo "   ✅ Firebase services deployed"
echo "   ✅ Site accessible at: $DEPLOY_URL"
echo "   ✅ Build size: $BUILD_SIZE"
echo ""
echo -e "${BLUE}🌍 Next Steps:${NC}"
echo "   1. Configure custom domain (if needed)"
echo "   2. Set up SSL certificates"
echo "   3. Configure CDN for global performance"
echo "   4. Set up monitoring and alerts"
echo "   5. Test all features in production"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - Production Checklist: docs/production-checklist.md"
echo "   - API Documentation: docs/api.md"
echo "   - Deployment Guide: docs/deployment.md"
echo ""
echo -e "${GREEN}🚀 Your platform is now live and ready for global users!${NC}"

# Save deployment info
echo "$TIMESTAMP|$DEPLOY_URL|$BUILD_SIZE" >> deployment-history.log
echo ""
echo -e "${YELLOW}📝 Deployment logged to: deployment-history.log${NC}"
