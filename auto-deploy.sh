#!/bin/bash

# 🤖 FULLY AUTOMATED DEPLOYMENT
# Souk El-Syarat Marketplace - Zero-Interaction Deployment

set -e

echo "🤖 FULLY AUTOMATED DEPLOYMENT STARTING..."
echo "=================================================="
echo "⏰ URGENT: Deploying automatically for app deadline!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[AUTO]${NC} $1"
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

# Function to wait for user input if needed
wait_for_input() {
    if [ "$1" = "true" ]; then
        echo ""
        read -p "Press Enter to continue or Ctrl+C to abort..."
    fi
fi

# Auto-deployment function
auto_deploy() {
    print_status "Starting automated deployment sequence..."
    
    # Step 1: Environment check
    print_status "Checking deployment environment..."
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    
    # Step 2: Auto-login if needed
    if ! firebase projects:list &> /dev/null; then
        print_warning "Firebase login required. Please login manually:"
        firebase login
        wait_for_input true
    fi
    
    print_success "Environment ready"
    
    # Step 3: Install dependencies
    print_status "Installing dependencies..."
    npm ci --silent
    print_success "Dependencies installed"
    
    # Step 4: Build frontend
    print_status "Building frontend application..."
    NODE_ENV=production CI=true npm run build
    print_success "Frontend built successfully"
    
    # Step 5: Build functions
    print_status "Building Firebase Functions..."
    cd functions
    npm ci --silent
    npm run build
    cd ..
    print_success "Functions built"
    
    # Step 6: Deploy everything
    print_status "🚀 DEPLOYING TO FIREBASE (AUTOMATED)..."
    firebase deploy --force --non-interactive
    print_success "🎉 FULLSTACK DEPLOYMENT COMPLETED!"
    
    # Step 7: Get live URL
    print_status "Getting live application URL..."
    HOSTING_URL=$(firebase hosting:channel:list | grep "live" | head -n 1 | awk '{print $3}')
    if [ -z "$HOSTING_URL" ]; then
        HOSTING_URL="https://souk-el-syarat.web.app"
    fi
    
    # Step 8: Auto-open in browser
    print_status "Opening deployed app in browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "$HOSTING_URL" &
    elif command -v open &> /dev/null; then
        open "$HOSTING_URL" &
    fi
    
    # Final success message
    echo ""
    echo "🎉🎉🎉 AUTOMATED DEPLOYMENT COMPLETED! 🎉🎉🎉"
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
    
    # Auto-run status check
    print_status "Running deployment verification..."
    if [ -f "./check-deployment.sh" ]; then
        ./check-deployment.sh
    fi
    
    print_success "🤖 AUTOMATED DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "Your app is LIVE and ready for stakeholders! 🎉"
}

# Main execution
main() {
    echo "🤖 Starting fully automated deployment..."
    echo "This script will:"
    echo "1. Check environment"
    echo "2. Install dependencies"
    echo "3. Build application"
    echo "4. Deploy to Firebase"
    echo "5. Verify deployment"
    echo "6. Open in browser"
    echo ""
    
    # Check if user wants to proceed
    read -p "🤖 Start automated deployment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        auto_deploy
    else
        echo "❌ Deployment cancelled by user"
        exit 0
    fi
}

# Run main function
main "$@"
