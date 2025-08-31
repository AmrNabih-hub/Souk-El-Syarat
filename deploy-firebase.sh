#!/bin/bash

# Firebase Deployment Script
# Complete deployment automation for Souk El-Sayarat

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="souk-elsayarat"
ENVIRONMENT=${1:-staging}
SKIP_TESTS=${2:-false}

echo -e "${BLUE}🚀 Firebase Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Skip Tests: ${YELLOW}$SKIP_TESTS${NC}\n"

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ Error: $1${NC}"
    exit 1
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed"
fi

if ! command_exists npm; then
    print_error "npm is not installed"
fi

if ! command_exists firebase; then
    echo -e "${YELLOW}Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

print_success "All prerequisites met"

# Set Firebase project
print_step "Setting Firebase project..."
FIREBASE_PROJECT="${PROJECT_NAME}-${ENVIRONMENT}"

if [ "$ENVIRONMENT" == "production" ]; then
    FIREBASE_PROJECT="${PROJECT_NAME}-prod"
fi

firebase use $FIREBASE_PROJECT || {
    echo -e "${YELLOW}Project $FIREBASE_PROJECT not found. Creating...${NC}"
    firebase projects:create $FIREBASE_PROJECT --display-name "$PROJECT_NAME $ENVIRONMENT"
    firebase use $FIREBASE_PROJECT
}

print_success "Using project: $FIREBASE_PROJECT"

# Install dependencies
print_step "Installing dependencies..."

# Backend dependencies
cd /workspace/firebase-backend/functions
npm ci --production=false

# Frontend dependencies
cd /workspace
npm ci --production=false

print_success "Dependencies installed"

# Run tests (unless skipped)
if [ "$SKIP_TESTS" != "true" ]; then
    print_step "Running tests..."
    
    # Backend tests
    cd /workspace/firebase-backend/functions
    npm test || print_error "Backend tests failed"
    
    # Frontend tests
    cd /workspace
    npm test -- --run || print_error "Frontend tests failed"
    
    print_success "All tests passed"
else
    echo -e "${YELLOW}⚠ Skipping tests (not recommended for production)${NC}"
fi

# Build frontend
print_step "Building frontend..."
cd /workspace

if [ "$ENVIRONMENT" == "production" ]; then
    npm run build -- --mode production
else
    npm run build -- --mode staging
fi

print_success "Frontend built successfully"

# Build backend
print_step "Building backend..."
cd /workspace/firebase-backend/functions
npm run build

print_success "Backend built successfully"

# Deploy Firestore rules
print_step "Deploying Firestore rules..."
cd /workspace/firebase-backend
firebase deploy --only firestore:rules

print_success "Firestore rules deployed"

# Deploy Storage rules
print_step "Deploying Storage rules..."
firebase deploy --only storage:rules

print_success "Storage rules deployed"

# Deploy Realtime Database rules
print_step "Deploying Realtime Database rules..."
firebase deploy --only database

print_success "Realtime Database rules deployed"

# Deploy Cloud Functions
print_step "Deploying Cloud Functions..."
firebase deploy --only functions

print_success "Cloud Functions deployed"

# Deploy Hosting
print_step "Deploying Frontend to Hosting..."
firebase deploy --only hosting

print_success "Frontend deployed to hosting"

# Verify deployment
print_step "Verifying deployment..."

# Get the deployed URL
if [ "$ENVIRONMENT" == "production" ]; then
    API_URL="https://api.${PROJECT_NAME}.com"
    APP_URL="https://${PROJECT_NAME}.com"
else
    API_URL="https://us-central1-${FIREBASE_PROJECT}.cloudfunctions.net/api"
    APP_URL="https://${FIREBASE_PROJECT}.web.app"
fi

# Test API health
echo -e "\nTesting API at: ${BLUE}$API_URL/health${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$HTTP_STATUS" == "200" ]; then
    print_success "API is healthy (HTTP $HTTP_STATUS)"
else
    print_error "API health check failed (HTTP $HTTP_STATUS)"
fi

# Print deployment summary
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "\n📊 Deployment Summary:"
echo -e "  • Project: ${BLUE}$FIREBASE_PROJECT${NC}"
echo -e "  • Environment: ${BLUE}$ENVIRONMENT${NC}"
echo -e "  • API URL: ${BLUE}$API_URL${NC}"
echo -e "  • App URL: ${BLUE}$APP_URL${NC}"
echo -e "  • Functions: ${GREEN}Deployed${NC}"
echo -e "  • Hosting: ${GREEN}Deployed${NC}"
echo -e "  • Rules: ${GREEN}Deployed${NC}"

# Show next steps
echo -e "\n📝 Next Steps:"
echo -e "  1. Visit your app: ${BLUE}$APP_URL${NC}"
echo -e "  2. Check function logs: ${YELLOW}firebase functions:log${NC}"
echo -e "  3. Monitor dashboard: ${YELLOW}https://console.firebase.google.com/project/$FIREBASE_PROJECT${NC}"

# Additional production checks
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "\n${YELLOW}⚠ Production Deployment Checklist:${NC}"
    echo -e "  [ ] Enable App Check"
    echo -e "  [ ] Configure custom domain"
    echo -e "  [ ] Setup SSL certificates"
    echo -e "  [ ] Enable monitoring alerts"
    echo -e "  [ ] Configure backup automation"
    echo -e "  [ ] Update DNS records"
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"