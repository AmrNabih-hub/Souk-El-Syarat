#!/bin/bash

# Development Setup Script for Souk El-Syarat
echo "🚀 Setting up Souk El-Syarat Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

# Check if running in Firebase environment
if [ -n "$FIREBASE_CONFIG" ]; then
    echo -e "${GREEN}✅ Running in Firebase environment${NC}"
    export GOOGLE_APPLICATION_CREDENTIALS=""
else
    echo -e "${YELLOW}📝 Running in local development mode${NC}"
    
    # Check for service account key
    if [ ! -f "service-account-key.json" ]; then
        echo -e "${YELLOW}⚠️  No service account key found.${NC}"
        echo "To use Firebase services locally, you need to:"
        echo "1. Go to Firebase Console > Project Settings > Service Accounts"
        echo "2. Generate a new private key"
        echo "3. Save it as 'service-account-key.json' in the project root"
        echo ""
        echo "Or use Firebase emulators for local development:"
        echo "  firebase emulators:start"
    else
        export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account-key.json"
        echo -e "${GREEN}✅ Service account key found and configured${NC}"
    fi
fi

# Load environment variables
if [ -f ".env.development" ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check Firebase project
echo -e "${YELLOW}🔍 Checking Firebase project...${NC}"
firebase use --add 2>/dev/null || firebase use souk-el-syarat 2>/dev/null || true

# Start the server
echo -e "${GREEN}🚀 Starting development server...${NC}"
echo "Server will be available at: http://localhost:8080"
echo "Health check: http://localhost:8080/health"
echo ""

# Run the server
npm run start