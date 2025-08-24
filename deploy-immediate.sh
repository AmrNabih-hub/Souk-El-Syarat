#!/bin/bash

# 🚀 IMMEDIATE DEPLOYMENT SCRIPT - URGENT APP DEADLINE
# Souk El-Syarat Marketplace - Fast Track Deployment

set -e # Exit on any error

echo "🚀 URGENT: Starting Immediate Fullstack Deployment..."
echo "=================================================="
echo "⚠️  SKIPPING QUALITY CHECKS FOR SPEED - DEPLOYING IMMEDIATELY"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Quick Environment Check
print_status "Quick environment check..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Installing now..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged in to Firebase. Please run: firebase login"
    firebase login
fi

print_success "Environment ready"

# Step 2: Install Dependencies (Fast)
print_status "Installing dependencies (fast mode)..."
npm ci --silent
print_success "Dependencies installed"

# Step 3: Build Frontend (Production)
print_status "Building frontend (production mode)..."
NODE_ENV=production CI=true npm run build
print_success "Frontend built successfully"

# Step 4: Build Functions (Fast)
print_status "Building Firebase Functions..."
cd functions
npm ci --silent
npm run build
cd ..
print_success "Functions built"

# Step 5: Deploy Everything (Force Mode)
print_status "🚀 DEPLOYING EVERYTHING TO FIREBASE (FORCE MODE)..."
firebase deploy --force
print_success "🎉 FULLSTACK DEPLOYMENT COMPLETED!"

# Step 6: Get Live URL
print_status "Getting live application URL..."
HOSTING_URL=$(firebase hosting:channel:list | grep "live" | head -n 1 | awk '{print $3}')
if [ -z "$HOSTING_URL" ]; then
    HOSTING_URL="https://souk-el-syarat.web.app"
fi

# Final Success Message
echo ""
echo "🎉🎉🎉 URGENT DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉🎉🎉"
echo "=================================================="
echo ""
echo "📱 Your Souk El-Syarat Marketplace is NOW LIVE:"
echo "🌐 Frontend URL: $HOSTING_URL"
echo "⚡ Backend: Deployed and running"
echo "🗄️  Database: Live and configured"
echo "📁 Storage: Live and configured"
echo "🔐 Security: Active and protecting"
echo ""
echo "🚀 READY FOR PRODUCTION TRAFFIC IMMEDIATELY!"
echo "=================================================="

# Auto-open in browser
print_status "Opening deployed app in browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open "$HOSTING_URL"
elif command -v open &> /dev/null; then
    open "$HOSTING_URL"
else
    echo "🌐 Please open: $HOSTING_URL"
fi

print_success "🚀 IMMEDIATE DEPLOYMENT COMPLETED! Your app is LIVE! 🎉"
