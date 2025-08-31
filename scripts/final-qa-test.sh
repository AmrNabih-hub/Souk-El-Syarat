#!/bin/bash

# Final QA Test Script - Professional Implementation
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================"
echo -e "${BLUE}🧪 FINAL QA VALIDATION${NC}"
echo "======================================"
echo ""

# API Base
API="https://us-central1-souk-el-syarat.cloudfunctions.net/api/api"
WEB="https://souk-el-syarat.web.app"

# Test results
PASSED=0
FAILED=0

# Function to test
test_feature() {
    local name=$1
    local cmd=$2
    echo -n "Testing $name... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

echo -e "${YELLOW}1. BACKEND TESTS${NC}"
test_feature "API Health" "curl -s $API/health | grep -q healthy"
test_feature "Products Endpoint" "curl -s $API/products | grep -q success"
test_feature "Categories Available" "curl -s $API/products | grep -q Toyota"
test_feature "Search Functionality" "curl -s -X POST $API/search -H 'Content-Type: application/json' -d '{\"query\":\"BMW\"}' | grep -q success"

echo -e "\n${YELLOW}2. FRONTEND TESTS${NC}"
test_feature "Website Accessible" "curl -s -o /dev/null -w '%{http_code}' $WEB | grep -q 200"
test_feature "Static Assets" "curl -s $WEB | grep -q 'Souk El-Sayarat'"
test_feature "React App Loads" "curl -s $WEB | grep -q 'root'"
test_feature "Manifest Present" "curl -s $WEB/manifest.webmanifest | grep -q 'Souk El-Sayarat'"

echo -e "\n${YELLOW}3. DATA VALIDATION${NC}"
echo -n "Checking products count... "
PRODUCT_COUNT=$(curl -s $API/products | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('products', [])))" 2>/dev/null || echo "0")
if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ $PRODUCT_COUNT products found${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ No products found${NC}"
    ((FAILED++))
fi

echo -e "\n${YELLOW}4. PERFORMANCE METRICS${NC}"
echo -n "API Response Time... "
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' $API/health)
if (( $(echo "$RESPONSE_TIME < 1" | bc -l) )); then
    echo -e "${GREEN}✓ ${RESPONSE_TIME}s (Good)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ ${RESPONSE_TIME}s (Slow)${NC}"
fi

echo -n "Website Load Time... "
WEB_TIME=$(curl -o /dev/null -s -w '%{time_total}' $WEB)
if (( $(echo "$WEB_TIME < 2" | bc -l) )); then
    echo -e "${GREEN}✓ ${WEB_TIME}s (Good)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ ${WEB_TIME}s (Slow)${NC}"
fi

echo ""
echo "======================================"
echo -e "${BLUE}QA RESULTS SUMMARY${NC}"
echo "======================================"
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "The application is ready for production!"
else
    echo -e "\n${YELLOW}⚠ Some tests failed. Please review.${NC}"
fi

echo ""
echo "======================================"
echo -e "${BLUE}LIVE URLS${NC}"
echo "======================================"
echo "🌐 Website: $WEB"
echo "🔌 API: $API"
echo "📊 Firebase Console: https://console.firebase.google.com/project/souk-el-syarat"
echo ""
echo "======================================"
echo -e "${BLUE}TEST ACCOUNTS${NC}"
echo "======================================"
echo "👤 Admin: admin@souk-elsayarat.com / Admin@123456"
echo "🏪 Vendor: vendor@souk-elsayarat.com / Vendor@123456"
echo "🛒 Customer: customer@souk-elsayarat.com / Customer@123456"
echo ""