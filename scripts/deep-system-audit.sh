#!/bin/bash

# DEEP SYSTEM AUDIT SCRIPT
# Professional investigation of all services

set -e

echo "=========================================="
echo "🔍 DEEP SYSTEM AUDIT STARTING"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initialize counters
ERRORS=0
WARNINGS=0
SUCCESS=0

# Create audit log
AUDIT_LOG="/workspace/AUDIT_$(date +%Y%m%d_%H%M%S).log"
exec 2>&1 | tee -a "$AUDIT_LOG"

echo -e "${BLUE}Phase 1: Firebase Configuration Audit${NC}"
echo "----------------------------------------"

# Check Firebase project
echo -n "1. Firebase Project Status: "
firebase projects:list 2>/dev/null | grep -q "souk-el-syarat" && {
    echo -e "${GREEN}✓ Connected${NC}"
    ((SUCCESS++))
} || {
    echo -e "${RED}✗ Not connected${NC}"
    ((ERRORS++))
}

# Check Firebase services
echo -n "2. Authentication Service: "
firebase auth:export /tmp/users.json --project souk-el-syarat 2>/dev/null && {
    USER_COUNT=$(grep -c "localId" /tmp/users.json 2>/dev/null || echo "0")
    echo -e "${GREEN}✓ Active ($USER_COUNT users)${NC}"
    ((SUCCESS++))
    rm -f /tmp/users.json
} || {
    echo -e "${RED}✗ Failed${NC}"
    ((ERRORS++))
}

echo -n "3. Firestore Database: "
firebase firestore:indexes --project souk-el-syarat 2>/dev/null | grep -q "indexes" && {
    echo -e "${GREEN}✓ Active${NC}"
    ((SUCCESS++))
} || {
    echo -e "${YELLOW}⚠ Check manually${NC}"
    ((WARNINGS++))
}

echo -n "4. Realtime Database: "
curl -s "https://souk-el-syarat-default-rtdb.europe-west1.firebasedatabase.app/.json" | grep -q "denied" && {
    echo -e "${GREEN}✓ Secured${NC}"
    ((SUCCESS++))
} || {
    echo -e "${YELLOW}⚠ Check security${NC}"
    ((WARNINGS++))
}

echo ""
echo -e "${BLUE}Phase 2: Backend Services Audit${NC}"
echo "----------------------------------------"

API_BASE="https://us-central1-souk-el-syarat.cloudfunctions.net/api/api"

echo -n "5. API Health Check: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Healthy${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
    ((ERRORS++))
fi

echo -n "6. Products Endpoint: "
PRODUCTS=$(curl -s "$API_BASE/products" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('products', [])))" 2>/dev/null || echo "0")
if [ "$PRODUCTS" -gt "0" ]; then
    echo -e "${GREEN}✓ $PRODUCTS products${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}✗ No products${NC}"
    ((ERRORS++))
fi

echo ""
echo -e "${BLUE}Phase 3: Frontend Deployment Audit${NC}"
echo "----------------------------------------"

echo -n "7. Website Accessibility: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://souk-el-syarat.web.app")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
    ((ERRORS++))
fi

echo -n "8. Static Assets: "
curl -s "https://souk-el-syarat.web.app" | grep -q "root" && {
    echo -e "${GREEN}✓ Loading${NC}"
    ((SUCCESS++))
} || {
    echo -e "${RED}✗ Not loading${NC}"
    ((ERRORS++))
}

echo ""
echo -e "${BLUE}Phase 4: Configuration Files Audit${NC}"
echo "----------------------------------------"

echo -n "9. Environment Variables: "
if [ -f "/workspace/.env" ]; then
    echo -e "${GREEN}✓ Present${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}✗ Missing${NC}"
    ((ERRORS++))
fi

echo -n "10. Firebase Config: "
if [ -f "/workspace/src/config/firebase.config.ts" ]; then
    grep -q "AIzaSy" /workspace/src/config/firebase.config.ts && {
        echo -e "${GREEN}✓ Configured${NC}"
        ((SUCCESS++))
    } || {
        echo -e "${RED}✗ Invalid${NC}"
        ((ERRORS++))
    }
else
    echo -e "${RED}✗ Missing${NC}"
    ((ERRORS++))
fi

echo ""
echo "=========================================="
echo -e "${BLUE}AUDIT SUMMARY${NC}"
echo "=========================================="
echo -e "✅ Success: ${GREEN}$SUCCESS${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "❌ Errors: ${RED}$ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ System appears healthy${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS critical issues found${NC}"
    echo "Audit log saved to: $AUDIT_LOG"
    exit 1
fi