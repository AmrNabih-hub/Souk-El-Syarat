#!/bin/bash

# Rollback Script for Souk El-Syarat
# Emergency rollback to previous stable version

set -e

echo "🔄 Rollback - Souk El-Syarat"
echo "==========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="${PROJECT_ID:-souk-el-syarat}"

# Get current serving version
CURRENT_VERSION=$(gcloud app versions list --filter="SERVING=true" --format="value(VERSION.ID)" | head -1)

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}❌ No currently serving version found${NC}"
    exit 1
fi

echo "Current serving version: $CURRENT_VERSION"

# List available versions
echo -e "${YELLOW}Available versions:${NC}"
gcloud app versions list --format="table[box](VERSION.ID,LAST_DEPLOYED_TIME,TRAFFIC_SPLIT)"

# Get the most recent stable version (excluding current)
PREVIOUS_VERSION=$(gcloud app versions list --sort-by="~LAST_DEPLOYED_TIME" --format="value(VERSION.ID)" | sed -n '2p')

if [ -z "$PREVIOUS_VERSION" ]; then
    echo -e "${RED}❌ No previous version available for rollback${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Rolling back to version: $PREVIOUS_VERSION${NC}"

# Stop current version and start previous version
gcloud app versions stop "$CURRENT_VERSION" --quiet
gcloud app versions start "$PREVIOUS_VERSION" --quiet

# Migrate traffic to previous version
gcloud app versions migrate "$PREVIOUS_VERSION" --quiet

echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
echo "🌐 Application is now running version: $PREVIOUS_VERSION"
echo ""
echo "Previous version $CURRENT_VERSION has been stopped but not deleted."
echo "You can restart it later if needed:"
echo "  gcloud app versions start $CURRENT_VERSION"
