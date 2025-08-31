#!/bin/bash

# Firebase Setup Verification Script
# Checks if everything is ready for deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Firebase Setup Verification${NC}"
echo -e "${BLUE}================================${NC}\n"

READY=true
WARNINGS=0
ERRORS=0

# Function to check item
check_item() {
    local name=$1
    local condition=$2
    local required=${3:-true}
    
    if eval $condition; then
        echo -e "${GREEN}✓${NC} $name"
        return 0
    else
        if [ "$required" == "true" ]; then
            echo -e "${RED}✗${NC} $name"
            ERRORS=$((ERRORS + 1))
            READY=false
        else
            echo -e "${YELLOW}⚠${NC} $name (optional)"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

echo -e "${YELLOW}1. System Requirements${NC}"
echo "------------------------"
check_item "Node.js installed" "command -v node >/dev/null 2>&1"
check_item "Node.js version >= 18" "node -v | grep -E 'v(1[89]|2[0-9])' >/dev/null 2>&1"
check_item "npm installed" "command -v npm >/dev/null 2>&1"
check_item "Firebase CLI installed" "command -v firebase >/dev/null 2>&1"
check_item "Git installed" "command -v git >/dev/null 2>&1"

echo -e "\n${YELLOW}2. Project Structure${NC}"
echo "------------------------"
check_item "Firebase backend directory" "[ -d /workspace/firebase-backend ]"
check_item "Functions directory" "[ -d /workspace/firebase-backend/functions ]"
check_item "Functions package.json" "[ -f /workspace/firebase-backend/functions/package.json ]"
check_item "Firebase config" "[ -f /workspace/firebase-backend/firebase.json ]"
check_item "Firestore rules" "[ -f /workspace/firebase-backend/firestore.rules ]"
check_item "Storage rules" "[ -f /workspace/firebase-backend/storage.rules ]"
check_item "Database rules" "[ -f /workspace/firebase-backend/database.rules.json ]"
check_item "Frontend build directory" "[ -d /workspace/dist ]" false

echo -e "\n${YELLOW}3. Configuration Files${NC}"
echo "------------------------"
check_item "Firebase RC file" "[ -f /workspace/firebase-backend/.firebaserc ]"
check_item "TypeScript config" "[ -f /workspace/firebase-backend/functions/tsconfig.json ]"
check_item "Frontend package.json" "[ -f /workspace/package.json ]"
check_item "Deployment script" "[ -f /workspace/deploy-firebase.sh ]"
check_item "Environment variables" "[ -f /workspace/.env.production ]" false

echo -e "\n${YELLOW}4. Source Code${NC}"
echo "------------------------"
check_item "Functions index.ts" "[ -f /workspace/firebase-backend/functions/src/index.ts ]"
check_item "Payment service test" "[ -f /workspace/firebase-backend/functions/tests/unit/payment.service.test.ts ]"
check_item "Frontend App.tsx" "[ -f /workspace/src/App.tsx ]"
check_item "API contracts" "[ -f /workspace/src/api/contracts/index.ts ]"

echo -e "\n${YELLOW}5. Dependencies Check${NC}"
echo "------------------------"
if [ -f /workspace/firebase-backend/functions/package.json ]; then
    cd /workspace/firebase-backend/functions
    if [ ! -d node_modules ]; then
        echo -e "${YELLOW}⚠${NC} Backend dependencies not installed (run: npm install)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Backend dependencies installed"
    fi
else
    echo -e "${RED}✗${NC} Cannot check backend dependencies"
    ERRORS=$((ERRORS + 1))
fi

if [ -f /workspace/package.json ]; then
    cd /workspace
    if [ ! -d node_modules ]; then
        echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed (run: npm install)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Frontend dependencies installed"
    fi
else
    echo -e "${RED}✗${NC} Cannot check frontend dependencies"
    ERRORS=$((ERRORS + 1))
fi

echo -e "\n${YELLOW}6. Firebase Authentication${NC}"
echo "------------------------"
# Check if user is logged in to Firebase
if firebase projects:list >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Firebase CLI authenticated"
    
    # Check if project exists
    if firebase projects:list 2>/dev/null | grep -q "souk-elsayarat"; then
        echo -e "${GREEN}✓${NC} Firebase project found"
    else
        echo -e "${YELLOW}⚠${NC} Firebase project not created yet"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Not logged in to Firebase (run: firebase login)"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo -e "\n${BLUE}════════════════════════════════${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}Your Firebase backend is ready for deployment!${NC}"
    echo -e "\nNext step: Run ${YELLOW}./deploy-firebase.sh staging${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "\n${YELLOW}⚠ READY WITH WARNINGS${NC}"
    echo -e "Errors: ${GREEN}0${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo -e "\nYou can proceed with deployment, but review warnings first."
    echo -e "Next step: Run ${YELLOW}./deploy-firebase.sh staging${NC}"
else
    echo -e "\n${RED}❌ NOT READY FOR DEPLOYMENT${NC}"
    echo -e "Errors: ${RED}$ERRORS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo -e "\nPlease fix the errors before proceeding."
fi

# Provide helpful commands
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo -e "\n${YELLOW}Helpful Commands:${NC}"
    
    if ! command -v firebase >/dev/null 2>&1; then
        echo -e "  • Install Firebase CLI: ${BLUE}npm install -g firebase-tools${NC}"
    fi
    
    if ! firebase projects:list >/dev/null 2>&1; then
        echo -e "  • Login to Firebase: ${BLUE}firebase login${NC}"
    fi
    
    if [ ! -d /workspace/firebase-backend/functions/node_modules ]; then
        echo -e "  • Install backend deps: ${BLUE}cd /workspace/firebase-backend/functions && npm install${NC}"
    fi
    
    if [ ! -d /workspace/node_modules ]; then
        echo -e "  • Install frontend deps: ${BLUE}cd /workspace && npm install${NC}"
    fi
    
    if [ ! -d /workspace/dist ]; then
        echo -e "  • Build frontend: ${BLUE}cd /workspace && npm run build${NC}"
    fi
fi

echo ""
exit $([ "$READY" == "true" ] && echo 0 || echo 1)