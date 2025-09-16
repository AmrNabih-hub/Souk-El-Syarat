#!/bin/bash
# Souk El-Sayarat Backend API Testing Script
# Usage: ./test-backend.sh

set -e

echo "🧪 Testing Souk El-Sayarat Backend API"
echo "======================================"

BASE_URL="http://localhost:8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}📍 Testing: $description${NC}"
    echo "   URL: $BASE_URL$endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=${response: -3}
    body=${response%???}
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "   ${GREEN}✅ Success ($http_code)${NC}"
        echo "   Response: $body"
    else
        echo -e "   ${RED}❌ Error ($http_code)${NC}"
        echo "   Response: $body"
    fi
    echo
}

# Test Health Check
echo -e "${GREEN}🔍 Testing Health Check...${NC}"
test_endpoint "GET" "/health" "Health Check"

# Test API Endpoints
echo -e "${GREEN}🚗 Testing Vehicle Endpoints...${NC}"
test_endpoint "GET" "/api/vehicles" "Get All Vehicles"
test_endpoint "GET" "/api/vehicles/sample123" "Get Vehicle Details"

echo -e "${GREEN}📋 Testing Order Endpoints...${NC}"
test_endpoint "GET" "/api/orders" "Get All Orders"
test_endpoint "GET" "/api/orders/user/sample123" "Get User Orders"

echo -e "${GREEN}🔐 Testing Auth Endpoints...${NC}"
test_endpoint "POST" "/api/auth/register" "User Registration" '{"email":"test@example.com","password":"password123","name":"Test User"}'
test_endpoint "POST" "/api/auth/login" "User Login" '{"email":"test@example.com","password":"password123"}'

echo -e "${GREEN}🎉 Testing Complete!${NC}"