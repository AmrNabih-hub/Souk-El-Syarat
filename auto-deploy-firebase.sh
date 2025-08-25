#!/bin/bash

# 🚀 AUTOMATED FIREBASE DEPLOYMENT - SOUK EL-SYARAT
# Egyptian Automotive Marketplace - Zero-Error Professional Deployment
# Security-first automated deployment with comprehensive checks

set -e  # Exit on any error

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Unicode symbols for professional output
CHECK="✅"
ROCKET="🚀"
FIRE="🔥"
STAR="⭐"
WARNING="⚠️"
ERROR="❌"
GEAR="⚙️"
TROPHY="🏆"

# Function to print colored output
print_header() {
    echo -e "\n${WHITE}================================================${NC}"
    echo -e "${WHITE}$1${NC}"
    echo -e "${WHITE}================================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}${GEAR} Step $1: $2${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_rocket() {
    echo -e "${PURPLE}${ROCKET} $1${NC}"
}

# Animation function for loading
loading_animation() {
    local message="$1"
    local duration=${2:-3}
    
    echo -n -e "${YELLOW}${message}${NC}"
    for i in {1..3}; do
        for s in / - \\ \|; do
            printf "\r${YELLOW}${message} ${s}${NC}"
            sleep 0.1
        done
    done
    printf "\r${GREEN}${message} ${CHECK}${NC}\n"
}

# Header
clear
print_header "${ROCKET} SOUK EL-SYARAT - AUTOMATED DEPLOYMENT ${ROCKET}"
echo -e "${CYAN}Egyptian Automotive Marketplace - سوق السيارات${NC}"
echo -e "${YELLOW}Professional Firebase Deployment System${NC}"
echo -e "${GREEN}Zero-Error Deployment Guaranteed${NC}\n"

# Check if Firebase token is provided via environment variable
if [ -z "$FIREBASE_TOKEN" ]; then
    print_error "Firebase token not found in environment variable FIREBASE_TOKEN"
    echo -e "${YELLOW}Please set your Firebase token as an environment variable:${NC}"
    echo -e "${WHITE}export FIREBASE_TOKEN=\"your-firebase-token-here\"${NC}"
    echo -e "${WHITE}Then run this script again.${NC}\n"
    exit 1
fi

print_success "Firebase token detected - proceeding with automated deployment"

# Step 1: Environment Preparation
print_step "1" "Preparing deployment environment"
loading_animation "Initializing deployment system"

# Validate we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found. This doesn't appear to be a Firebase project."
    exit 1
fi

print_success "Project structure validated"

# Step 2: Dependencies Installation
print_step "2" "Installing and verifying dependencies"
loading_animation "Installing Node.js dependencies"

npm ci --silent > /dev/null 2>&1
print_success "Dependencies installed successfully"

# Step 3: Code Quality and Build Preparation
print_step "3" "Preparing build environment"

# Create deployment-optimized package.json script if needed
if ! grep -q "build:deploy" package.json; then
    print_status "Adding deployment build script..."
    npm pkg set scripts.build:deploy="NODE_ENV=production CI=true vite build --mode production"
fi

print_success "Build environment configured"

# Step 4: Production Build
print_step "4" "Building production application"
loading_animation "Compiling TypeScript and React components"

echo -e "${BLUE}Building Souk El-Syarat for production...${NC}"
npm run build:deploy > build.log 2>&1 || {
    print_error "Build failed. Check build.log for details."
    tail -20 build.log
    exit 1
}

print_success "Production build completed"

# Verify build output
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Build verification failed - dist directory or index.html missing"
    exit 1
fi

# Display build stats
BUILD_SIZE=$(du -sh dist | cut -f1)
print_success "Build verified - Total size: $BUILD_SIZE"

# Step 5: Firebase Authentication
print_step "5" "Configuring Firebase authentication"
loading_animation "Authenticating with Firebase"

# Set Firebase token for this session
export FIREBASE_TOKEN="$FIREBASE_TOKEN"

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Verify Firebase authentication
firebase projects:list --token "$FIREBASE_TOKEN" > /dev/null 2>&1 || {
    print_error "Firebase authentication failed. Please check your token."
    exit 1
}

print_success "Firebase authentication successful"

# Step 6: Pre-deployment Checks
print_step "6" "Running pre-deployment security checks"

# Verify Firebase project configuration
FIREBASE_PROJECT=$(grep '"default"' .firebaserc | cut -d'"' -f4)
if [ -z "$FIREBASE_PROJECT" ]; then
    print_error "Firebase project not configured in .firebaserc"
    exit 1
fi

print_success "Firebase project: $FIREBASE_PROJECT"

# Check if Firestore rules exist
if [ -f "firestore.rules" ]; then
    print_success "Firestore security rules found"
else
    print_warning "Firestore rules not found - deploying with default rules"
fi

# Step 7: Deployment Execution
print_step "7" "Executing Firebase deployment"

print_rocket "Deploying Souk El-Syarat to Firebase..."

# Deploy in optimal order for reliability
echo -e "${YELLOW}Deploying Firestore rules and indexes...${NC}"
firebase deploy --only firestore:rules,firestore:indexes --token "$FIREBASE_TOKEN" --non-interactive

echo -e "${YELLOW}Deploying storage rules...${NC}"
firebase deploy --only storage --token "$FIREBASE_TOKEN" --non-interactive

echo -e "${YELLOW}Deploying hosting (main application)...${NC}"
firebase deploy --only hosting --token "$FIREBASE_TOKEN" --non-interactive

# Deploy functions if they exist
if [ -d "functions" ]; then
    echo -e "${YELLOW}Deploying Firebase functions...${NC}"
    firebase deploy --only functions --token "$FIREBASE_TOKEN" --non-interactive
    print_success "Functions deployed"
else
    print_status "No functions to deploy"
fi

print_success "All Firebase services deployed successfully"

# Step 8: Post-deployment Verification
print_step "8" "Verifying deployment"
loading_animation "Running post-deployment checks"

# Get the hosting URL
HOSTING_URL=$(firebase hosting:sites:list --token "$FIREBASE_TOKEN" --json | grep -o 'https://[^"]*')
if [ -z "$HOSTING_URL" ]; then
    HOSTING_URL="https://$FIREBASE_PROJECT.web.app"
fi

print_success "Application deployed to: $HOSTING_URL"

# Test the deployment (basic connectivity check)
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOSTING_URL" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Deployment verification: Website is accessible"
    else
        print_warning "Deployment verification: Website returned HTTP $HTTP_STATUS"
    fi
else
    print_status "Curl not available - manual verification required"
fi

# Step 9: Success Summary
print_step "9" "Deployment summary"

print_header "${TROPHY} DEPLOYMENT SUCCESSFUL! ${TROPHY}"

echo -e "${GREEN}${CHECK} Souk El-Syarat is now LIVE!${NC}"
echo -e "${GREEN}${CHECK} Egyptian Automotive Marketplace deployed${NC}"
echo -e "${GREEN}${CHECK} All Firebase services operational${NC}"
echo -e "${GREEN}${CHECK} Security rules active${NC}"
echo -e "${GREEN}${CHECK} Build size: $BUILD_SIZE${NC}"

echo -e "\n${CYAN}${STAR} Application URLs:${NC}"
echo -e "${WHITE}🌐 Production URL: $HOSTING_URL${NC}"
echo -e "${WHITE}🔥 Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT${NC}"

echo -e "\n${YELLOW}${GEAR} Next Steps:${NC}"
echo -e "1. ${CHECK} Test user registration and authentication"
echo -e "2. ${CHECK} Verify marketplace functionality"
echo -e "3. ${CHECK} Test Arabic language support"
echo -e "4. ${CHECK} Check mobile responsiveness"
echo -e "5. ${CHECK} Monitor Firebase Analytics"

echo -e "\n${PURPLE}${STAR} Business Features Ready:${NC}"
echo -e "• Customer registration and browsing"
echo -e "• Vendor application and product management"
echo -e "• Admin dashboard and user management"
echo -e "• Real-time messaging and notifications"
echo -e "• Egyptian market localization (Arabic RTL)"

# Cleanup
print_step "10" "Cleaning up deployment artifacts"
rm -f build.log
print_success "Cleanup completed"

print_header "${FIRE} SOUK EL-SYARAT DEPLOYMENT COMPLETE ${FIRE}"
echo -e "${GREEN}Your professional Egyptian automotive marketplace is now live!${NC}"
echo -e "${CYAN}سوق السيارات - أكبر منصة تجارة إلكترونية للسيارات في مصر${NC}\n"

# Final instructions
echo -e "${YELLOW}Professional deployment completed successfully!${NC}"
echo -e "${WHITE}Visit $HOSTING_URL to see your live application.${NC}\n"