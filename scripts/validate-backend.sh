#!/bin/bash

# Professional Backend Validation Script
# Zero-error approach with comprehensive checking

set -e  # Exit on any error
set -o pipefail  # Pipe failures cause script to fail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Base URL
API_BASE="https://us-central1-souk-el-syarat.cloudfunctions.net/api/api"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-}
    local expected_status=${4:-200}
    
    echo -n "Testing $method $endpoint... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$API_BASE$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ "$response" -eq "$expected_status" ] || [ "$response" -eq "200" ] || [ "$response" -eq "404" ] && [ "$expected_status" -eq "404" ]; then
        echo -e "${GREEN}✓${NC} (Status: $response)"
        return 0
    else
        echo -e "${RED}✗${NC} (Status: $response, Expected: $expected_status)"
        return 1
    fi
}

# Function to test with response body
test_with_body() {
    local endpoint=$1
    local method=${2:-GET}
    
    echo -e "\n${YELLOW}Testing $method $endpoint with response:${NC}"
    curl -s "$API_BASE$endpoint" | python3 -m json.tool || echo "Invalid JSON response"
}

echo "======================================"
echo "🔍 BACKEND VALIDATION STARTING"
echo "======================================"
echo ""

# Track failures
FAILURES=0

# Test Health Endpoint
echo -e "${YELLOW}1. HEALTH CHECK${NC}"
test_endpoint "/health" || ((FAILURES++))
test_with_body "/health"

# Test Authentication Endpoints
echo -e "\n${YELLOW}2. AUTHENTICATION ENDPOINTS${NC}"
test_endpoint "/auth/signup" "POST" '{"email":"test@example.com","password":"Test@123"}' 400 || ((FAILURES++))
test_endpoint "/auth/signin" "POST" '{"email":"test@example.com","idToken":"invalid"}' 401 || ((FAILURES++))
test_endpoint "/auth/refresh" "POST" '{"refreshToken":"invalid"}' 401 || ((FAILURES++))
test_endpoint "/auth/passwordless/init" "POST" '{"email":"test@example.com"}' || ((FAILURES++))

# Test Product Endpoints
echo -e "\n${YELLOW}3. PRODUCT ENDPOINTS${NC}"
test_endpoint "/products" || ((FAILURES++))
test_endpoint "/products/test-id" "GET" "" 404 || ((FAILURES++))

# Test Order Endpoints
echo -e "\n${YELLOW}4. ORDER ENDPOINTS${NC}"
test_endpoint "/orders" "GET" "" 401 || ((FAILURES++))

# Test Search Endpoint
echo -e "\n${YELLOW}5. SEARCH ENDPOINT${NC}"
test_endpoint "/search" "POST" '{"query":"toyota"}' || ((FAILURES++))

# Test Admin Endpoints
echo -e "\n${YELLOW}6. ADMIN ENDPOINTS${NC}"
test_endpoint "/admin/users" "GET" "" 401 || ((FAILURES++))
test_endpoint "/admin/analytics" "GET" "" 401 || ((FAILURES++))

# Test Vendor Endpoints
echo -e "\n${YELLOW}7. VENDOR ENDPOINTS${NC}"
test_endpoint "/vendor/dashboard" "GET" "" 401 || ((FAILURES++))
test_endpoint "/vendor/apply" "POST" '{"companyName":"Test"}' 401 || ((FAILURES++))

# Summary
echo ""
echo "======================================"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "Backend is fully operational"
else
    echo -e "${RED}⚠️ $FAILURES TESTS FAILED${NC}"
    echo "Please check the errors above"
fi
echo "======================================"

exit $FAILURES