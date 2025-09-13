#!/bin/bash

# Quick Deployment Script for Souk El-Syarat
# For fast iterations during development

set -e

echo "⚡ Quick Deployment - Souk El-Syarat"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="${PROJECT_ID:-souk-el-syarat}"
VERSION="quick-$(date +%H%M%S)"

echo -e "${YELLOW}Building and deploying version: $VERSION${NC}"

# Build
npm run build:apphosting

# Deploy
gcloud app deploy --version="$VERSION" --quiet --no-promote

echo -e "${GREEN}✅ Quick deployment completed!${NC}"
echo "🌐 Test URL: https://$VERSION-dot-$PROJECT_ID.appspot.com"
echo ""
echo "To promote to production:"
echo "  gcloud app versions migrate $VERSION"
