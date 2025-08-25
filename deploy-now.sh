#!/bin/bash

# 🚀 ONE-CLICK DEPLOYMENT SCRIPT
# Quick deployment with minimal configuration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 SOUK EL-SYARAT - QUICK DEPLOY${NC}"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Installing Firebase CLI...${NC}"
    npm install -g firebase-tools
fi

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Deploy to Firebase
echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy --only hosting --project souk-el-syarat

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 URL: https://souk-el-syarat.firebaseapp.com${NC}"