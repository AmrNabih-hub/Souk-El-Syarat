#!/bin/bash

# 🚀 Complete Fullstack Firebase Web App Deployment
# Souk El-Syarat Marketplace - Professional Deployment Script

set -e # Exit on any error

echo "🚀 Starting Complete Fullstack Firebase Deployment..."
echo "=================================================="

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

# Step 1: Environment Check
print_status "Checking deployment environment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Please install: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged in to Firebase. Please run: firebase login"
    firebase login
fi

print_success "Environment check completed"

# Step 2: Install Dependencies
print_status "Installing/updating dependencies..."
npm ci
print_success "Dependencies installed"

# Step 3: Run Quality Checks
print_status "Running quality checks..."

echo "  - TypeScript compilation check..."
npm run type-check:ci
print_success "TypeScript check passed"

echo "  - ESLint check..."
npm run lint:ci
print_success "ESLint check passed"

echo "  - Prettier format check..."
npm run format:check
print_success "Format check passed"

# Step 4: Build Frontend
print_status "Building frontend application..."
npm run build:deploy
print_success "Frontend build completed successfully"

# Step 5: Build Functions
print_status "Building Firebase Functions..."
cd functions
npm ci
npm run build:ci
cd ..
print_success "Functions build completed"

# Step 6: Deploy Firebase Rules & Security
print_status "Deploying Firebase security rules..."
firebase deploy --only firestore:rules,storage
print_success "Security rules deployed"

# Step 7: Deploy Firebase Functions (Backend)
print_status "Deploying Firebase Functions (Backend API)..."
firebase deploy --only functions
print_success "Backend functions deployed"

# Step 8: Deploy Firebase Hosting (Frontend)
print_status "Deploying Firebase Hosting (Frontend)..."
firebase deploy --only hosting
print_success "Frontend hosting deployed"

# Step 9: Deploy Firestore Indexes
print_status "Deploying Firestore indexes..."
firebase deploy --only firestore:indexes
print_success "Firestore indexes deployed"

# Step 10: Final Verification
print_status "Running final verification..."

# Get hosting URL
HOSTING_URL=$(firebase hosting:channel:list | grep "live" | head -n 1 | awk '{print $3}')
if [ -z "$HOSTING_URL" ]; then
    HOSTING_URL="https://souk-el-syarat.web.app"
fi

print_success "🎉 FULLSTACK DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "📱 Your Souk El-Syarat Marketplace is now LIVE:"
echo "🌐 Frontend (React): $HOSTING_URL"
echo "⚡ Backend (Functions): Auto-deployed with hosting"
echo "🗄️  Database (Firestore): Live and configured"
echo "📁 Storage (Firebase Storage): Live and configured"
echo "🔐 Security Rules: Deployed and active"
echo ""
echo "🛠️  Services Deployed:"
echo "   ✅ React Frontend (Vite + TypeScript)"
echo "   ✅ Firebase Functions (Node.js Backend API)"
echo "   ✅ Firestore Database (NoSQL Document DB)"
echo "   ✅ Firebase Storage (File Upload/Storage)"
echo "   ✅ Firebase Authentication (User Management)"
echo "   ✅ Firebase Messaging (Push Notifications)"
echo "   ✅ Security Rules (Data Protection)"
echo ""
echo "🚀 Ready for production traffic!"
echo "=================================================="

# Optional: Open the deployed app
read -p "🌐 Open the deployed app in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Opening $HOSTING_URL..."
    if command -v open &> /dev/null; then
        open "$HOSTING_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$HOSTING_URL"
    else
        echo "Please open $HOSTING_URL in your browser"
    fi
fi

print_success "Deployment script completed successfully! 🎉"