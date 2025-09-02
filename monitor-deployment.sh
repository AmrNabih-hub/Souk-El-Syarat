#!/bin/bash

# DEPLOYMENT MONITORING SCRIPT
# Checks App Hosting deployment status continuously

echo "🔍 MONITORING APP HOSTING DEPLOYMENT"
echo "===================================="
echo ""

BACKEND_URL="https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app"
CHECK_INTERVAL=30
MAX_CHECKS=20

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

check_count=0
deployment_successful=false

while [ $check_count -lt $MAX_CHECKS ]; do
    check_count=$((check_count + 1))
    echo -e "${YELLOW}Check #$check_count of $MAX_CHECKS${NC}"
    
    # Check health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
    
    if [ "$HTTP_STATUS" == "200" ]; then
        echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
        echo -e "${GREEN}Backend is responding with status 200${NC}"
        
        # Get detailed health info
        echo -e "\n${GREEN}Health Check Response:${NC}"
        curl -s $BACKEND_URL/health | python3 -m json.tool
        
        # Test API endpoint
        echo -e "\n${GREEN}API Info:${NC}"
        curl -s $BACKEND_URL/api | python3 -m json.tool | head -20
        
        deployment_successful=true
        break
    elif [ "$HTTP_STATUS" == "503" ]; then
        echo -e "${YELLOW}⚠️ Backend starting up (503 - Service Unavailable)${NC}"
    elif [ "$HTTP_STATUS" == "500" ]; then
        echo -e "${RED}❌ Backend error (500 - Internal Server Error)${NC}"
        echo "Checking logs might be needed"
    elif [ "$HTTP_STATUS" == "000" ]; then
        echo -e "${YELLOW}⏳ Backend not responding yet (deployment in progress)${NC}"
    else
        echo -e "${YELLOW}Status: $HTTP_STATUS${NC}"
    fi
    
    if [ $check_count -lt $MAX_CHECKS ]; then
        echo "Waiting $CHECK_INTERVAL seconds before next check..."
        sleep $CHECK_INTERVAL
    fi
    echo ""
done

if [ "$deployment_successful" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}DEPLOYMENT MONITORING COMPLETE${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "✅ App Hosting backend is fully operational!"
    echo "📍 URL: $BACKEND_URL"
    echo ""
    echo "Next steps:"
    echo "1. Run comprehensive tests: cd qa-automation && node quick-test.js"
    echo "2. Update frontend configuration to use this backend URL"
    echo "3. Monitor logs for any issues"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}DEPLOYMENT TIMEOUT${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "⚠️ Backend did not become healthy within expected time"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Firebase Console: https://console.firebase.google.com/project/souk-el-syarat/apphosting"
    echo "2. View Cloud Run logs: https://console.cloud.google.com/run?project=souk-el-syarat"
    echo "3. Check deployment status: firebase apphosting:backends:list"
    echo "4. View build logs: firebase apphosting:backends:builds:list souk-el-sayarat-backend"
fi