#!/bin/bash

echo "================================================"
echo "🔧 AUTHENTICATION PROVIDER FIX"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}IMPORTANT: Manual Steps Required in Firebase Console${NC}"
echo ""
echo -e "${BLUE}Step 1: Disable and Re-enable Authentication Providers${NC}"
echo "--------------------------------------------------------"
echo ""
echo "1. Go to: https://console.firebase.google.com/project/souk-el-syarat/authentication/providers"
echo ""
echo "2. For Email/Password Provider:"
echo "   a. Click on 'Email/Password'"
echo "   b. Toggle OFF the 'Enable' switch"
echo "   c. Click 'Save'"
echo "   d. Wait 5 seconds"
echo "   e. Click on 'Email/Password' again"
echo "   f. Toggle ON the 'Enable' switch"
echo "   g. Click 'Save'"
echo ""
echo "3. For Google Provider:"
echo "   a. Click on 'Google'"
echo "   b. Toggle OFF the 'Enable' switch"
echo "   c. Click 'Save'"
echo "   d. Wait 5 seconds"
echo "   e. Click on 'Google' again"
echo "   f. Toggle ON the 'Enable' switch"
echo "   g. Make sure 'Web SDK configuration' shows:"
echo "      - Web client ID: 505765285633-[...].apps.googleusercontent.com"
echo "      - Web client secret: (should be filled)"
echo "   h. Click 'Save'"
echo ""
echo -e "${BLUE}Step 2: Verify OAuth 2.0 Client IDs${NC}"
echo "------------------------------------"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=souk-el-syarat"
echo ""
echo "2. Under 'OAuth 2.0 Client IDs', you should see:"
echo "   - 'Web client (auto created by Google Service)'"
echo ""
echo "3. Click on it and verify:"
echo "   - Authorized JavaScript origins includes:"
echo "     • https://souk-el-syarat.firebaseapp.com"
echo "     • https://souk-el-syarat.web.app"
echo "     • http://localhost (for testing)"
echo "     • http://localhost:5173 (for development)"
echo ""
echo "   - Authorized redirect URIs includes:"
echo "     • https://souk-el-syarat.firebaseapp.com/__/auth/handler"
echo ""
echo "4. If any are missing, add them and click 'Save'"
echo ""
echo -e "${BLUE}Step 3: Update Google OAuth Consent Screen${NC}"
echo "------------------------------------------"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=souk-el-syarat"
echo ""
echo "2. Verify the following:"
echo "   - App name: Souk El-Sayarat"
echo "   - User support email: (your email)"
echo "   - Authorized domains: souk-el-syarat.firebaseapp.com"
echo ""
echo "3. Under 'Test users' (if in testing mode), add:"
echo "   - customer@souk-elsayarat.com"
echo "   - vendor@souk-elsayarat.com"
echo "   - admin@souk-elsayarat.com"
echo ""
echo "================================================"
echo ""

# Now let's verify the configuration programmatically
echo -e "${BLUE}Verifying Firebase Configuration...${NC}"
echo ""

# Get current config
firebase apps:sdkconfig web --project souk-el-syarat > /tmp/current-config.json 2>/dev/null

# Extract values
API_KEY=$(grep '"apiKey"' /tmp/current-config.json | cut -d'"' -f4)
AUTH_DOMAIN=$(grep '"authDomain"' /tmp/current-config.json | cut -d'"' -f4)

echo "Current Configuration:"
echo "API Key: $API_KEY"
echo "Auth Domain: $AUTH_DOMAIN"
echo ""

# Check if the API key matches what we expect
EXPECTED_API_KEY="AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q"
if [ "$API_KEY" = "$EXPECTED_API_KEY" ]; then
    echo -e "${GREEN}✓ API Key is correct${NC}"
else
    echo -e "${RED}✗ API Key mismatch!${NC}"
    echo "Expected: $EXPECTED_API_KEY"
    echo "Got: $API_KEY"
fi

echo ""
echo "================================================"
echo -e "${YELLOW}After completing the manual steps above:${NC}"
echo "================================================"
echo ""
echo "Run this command to rebuild and redeploy:"
echo ""
echo -e "${GREEN}npm run build && firebase deploy --only hosting${NC}"
echo ""
echo "Then test login at: https://souk-el-syarat.web.app/login"
echo ""
echo "================================================"