#!/bin/bash

# Setup Production Environment for Souk El-Syarat
# This configures all real API services

echo "🔧 Configuring Production Environment for Souk El-Syarat"
echo "========================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${YELLOW}Setting up Firebase Functions configuration...${NC}"

# Basic configuration that works without external APIs
firebase functions:config:set \
  app.environment="production" \
  app.domain="https://souk-el-syarat.web.app" \
  app.name="Souk El-Syarat" \
  app.support_email="support@souk-el-syarat.com" \
  --project souk-el-syarat

# Egyptian payment configuration (InstaPay)
echo -e "\n${YELLOW}Configuring Egyptian Payment Systems...${NC}"
firebase functions:config:set \
  instapay.enabled="true" \
  instapay.merchant_ipa="SOUKSAYARAT@CIB" \
  instapay.merchant_name="Souk El-Sayarat" \
  instapay.bank_name="CIB" \
  vodafone.enabled="false" \
  --project souk-el-syarat

# Default service configuration (using Firebase built-in services)
echo -e "\n${YELLOW}Configuring Default Services...${NC}"
firebase functions:config:set \
  services.use_firebase_auth="true" \
  services.use_firestore="true" \
  services.use_realtime_db="true" \
  services.use_cloud_storage="true" \
  services.enable_analytics="true" \
  --project souk-el-syarat

# Security configuration
echo -e "\n${YELLOW}Setting Security Configuration...${NC}"
firebase functions:config:set \
  security.jwt_secret="$(openssl rand -hex 32)" \
  security.api_key="$(openssl rand -hex 16)" \
  security.enable_rate_limiting="true" \
  security.max_requests_per_minute="100" \
  --project souk-el-syarat

# Commission rates for marketplace
echo -e "\n${YELLOW}Setting Marketplace Configuration...${NC}"
firebase functions:config:set \
  marketplace.platform_commission="0.025" \
  marketplace.payment_processing_fee="0.029" \
  marketplace.vendor_payout_schedule="weekly" \
  marketplace.min_payout_amount="100" \
  marketplace.currency="EGP" \
  --project souk-el-syarat

# Download configuration for local testing
echo -e "\n${BLUE}Downloading configuration...${NC}"
cd /workspace/firebase-backend/functions
firebase functions:config:get --project souk-el-syarat > .runtimeconfig.json

echo -e "\n${GREEN}✅ Production configuration complete!${NC}"
echo -e "${GREEN}The backend will work with:${NC}"
echo "  • Firebase Authentication (built-in)"
echo "  • Firestore Database (built-in)"
echo "  • Realtime Database for chat (built-in)"
echo "  • Cloud Storage for files (built-in)"
echo "  • InstaPay configuration for Egyptian payments"
echo "  • Built-in search (Firestore queries)"

echo -e "\n${YELLOW}Optional: Add these services later for enhanced features:${NC}"
echo "  • Stripe (stripe.secret_key) - International payments"
echo "  • SendGrid (sendgrid.api_key) - Email notifications"
echo "  • Twilio (twilio.auth_token) - SMS notifications"
echo "  • Elasticsearch (elasticsearch.url) - Advanced search"

echo -e "\n${BLUE}To add optional services later, run:${NC}"
echo "firebase functions:config:set SERVICE_NAME.key=\"your-key\" --project souk-el-syarat"