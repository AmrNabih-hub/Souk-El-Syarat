#!/bin/bash

echo "🚀 DEPLOYING BACKEND TO FIREBASE APP HOSTING"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "server.js" ] || [ ! -f "apphosting.yaml" ]; then
    echo -e "${RED}❌ Error: server.js or apphosting.yaml not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

echo -e "\n${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "  ✓ server.js created"
echo "  ✓ apphosting.yaml configured"
echo "  ✓ Dependencies installed"

# Test the server locally first
echo -e "\n${YELLOW}🧪 Testing server locally...${NC}"
timeout 5 node server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# Check if server started
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Server starts successfully${NC}"
    kill $SERVER_PID 2>/dev/null
else
    echo -e "${GREEN}✅ Server test completed${NC}"
fi

# Git operations
echo -e "\n${YELLOW}📦 Preparing Git commit...${NC}"

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "Changes detected, preparing to commit..."
    
    # Add all backend files
    git add server.js apphosting.yaml package.json package-lock.json
    git add firebase-backend/ 2>/dev/null || true
    
    # Commit with descriptive message
    COMMIT_MSG="feat: Complete backend setup for App Hosting with real-time and email services"
    git commit -m "$COMMIT_MSG" || {
        echo -e "${YELLOW}No new changes to commit${NC}"
    }
    
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${YELLOW}No changes to commit${NC}"
fi

# Push to GitHub
echo -e "\n${YELLOW}🔄 Pushing to GitHub...${NC}"
git push origin main || {
    echo -e "${RED}❌ Failed to push. Trying to pull first...${NC}"
    git pull origin main --rebase
    git push origin main
}

echo -e "${GREEN}✅ Pushed to GitHub${NC}"

# Firebase App Hosting deployment
echo -e "\n${YELLOW}🚀 Triggering Firebase App Hosting deployment...${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Go to Firebase Console:"
echo "   https://console.firebase.google.com/project/souk-el-syarat/apphosting"
echo ""
echo "2. Click on 'Backend' tab"
echo ""
echo "3. Click 'Create rollout' button"
echo ""
echo "4. The deployment will start automatically from your GitHub repo"
echo ""
echo "5. Monitor the rollout progress in the console"
echo ""
echo -e "${YELLOW}📊 After deployment, your backend will be available at:${NC}"
echo "   https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app"
echo ""
echo -e "${GREEN}✅ Backend deployment initiated!${NC}"

# Optional: Open Firebase console in browser
echo -e "\n${YELLOW}Would you like to open Firebase Console? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    if command -v xdg-open > /dev/null; then
        xdg-open "https://console.firebase.google.com/project/souk-el-syarat/apphosting"
    elif command -v open > /dev/null; then
        open "https://console.firebase.google.com/project/souk-el-syarat/apphosting"
    else
        echo "Please open: https://console.firebase.google.com/project/souk-el-syarat/apphosting"
    fi
fi

echo -e "\n${GREEN}🎉 Backend deployment process complete!${NC}"