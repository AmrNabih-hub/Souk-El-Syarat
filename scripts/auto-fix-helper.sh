#!/bin/bash

echo "🤖 AUTOMATED FIX HELPER"
echo "======================="
echo "This script will automate what can be automated."
echo "Manual steps will be clearly indicated."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT="souk-el-syarat"

echo -e "${GREEN}✅ STEP 1: Updating Backend with Strict Origin Check${NC}"
echo "--------------------------------------------------------"

# Create the security middleware
cat > /workspace/firebase-backend/functions/src/security-complete.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGINS = [
  'https://souk-el-syarat.web.app',
  'https://souk-el-syarat.firebaseapp.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

export const strictOriginCheck = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || req.headers.referer;
  
  if (!origin) {
    return next();
  }
  
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed)
  );
  
  if (!isAllowed) {
    console.warn(`BLOCKED: Unauthorized origin attempt from ${origin}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed',
      code: 'CORS_ORIGIN_BLOCKED'
    });
  }
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};
EOF

echo "✅ Security middleware created"

echo -e "\n${GREEN}✅ STEP 2: Checking Firebase Configuration${NC}"
echo "--------------------------------------------"

# Check current Firebase project
firebase use $PROJECT 2>/dev/null && echo "✅ Using project: $PROJECT" || echo "❌ Cannot set project"

# List current functions
echo -e "\n${GREEN}Current deployed functions:${NC}"
firebase functions:list --project $PROJECT 2>/dev/null | head -10

echo -e "\n${GREEN}✅ STEP 3: Updating Firestore Security Rules${NC}"
echo "----------------------------------------------"

cat > /workspace/firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /products/{productId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        resource.data.vendorId == request.auth.uid;
      allow delete: if isAdmin();
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);
    }
    
    match /orders/{orderId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    match /vendorApplications/{applicationId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
EOF

echo "✅ Firestore rules file created"

echo -e "\n${YELLOW}📋 MANUAL STEPS REQUIRED:${NC}"
echo "========================="
echo ""
echo -e "${YELLOW}1. FIX API KEY (CRITICAL):${NC}"
echo "   Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT"
echo "   - Find API key: AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q"
echo "   - Set HTTP referrers restrictions"
echo "   - Add these EXACT URLs:"
echo "     • https://souk-el-syarat.web.app/*"
echo "     • https://souk-el-syarat.firebaseapp.com/*"
echo "     • http://localhost:3000/*"
echo "     • http://localhost:5173/*"
echo ""
echo -e "${YELLOW}2. ENABLE GOOGLE CLOUD APIS:${NC}"
echo "   Go to: https://console.cloud.google.com/apis/library?project=$PROJECT"
echo "   Enable these if not already enabled:"
echo "   • Identity Toolkit API"
echo "   • Cloud Firestore API"
echo "   • Cloud Functions API"
echo "   • Cloud Run API"
echo "   • Cloud Build API"
echo "   • Artifact Registry API"
echo ""
echo -e "${YELLOW}3. CONFIGURE AUTH PROVIDERS:${NC}"
echo "   Go to: https://console.firebase.google.com/project/$PROJECT/authentication/providers"
echo "   • Enable Email/Password"
echo "   • Enable Google"
echo "   • Add authorized domains"
echo ""

echo -e "\n${GREEN}📦 READY TO DEPLOY:${NC}"
echo "==================="
echo "After completing manual steps above, run these commands:"
echo ""
echo "  cd /workspace/firebase-backend/functions"
echo "  npm run build"
echo "  firebase deploy --only functions:api --project $PROJECT"
echo "  firebase deploy --only firestore:rules --project $PROJECT"
echo ""

echo -e "\n${GREEN}🧪 VERIFICATION:${NC}"
echo "==============="
echo "After deployment, test with:"
echo ""
echo "  # Test API Key (should return 200 or 400, not 403):"
echo "  curl -H \"Referer: https://souk-el-syarat.web.app\" \\"
echo "    \"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAdkK2OlebHPUsWFCEqY5sWHs5ZL3wUk0Q\" \\"
echo "    -X POST -H \"Content-Type: application/json\" -d '{}'"
echo ""
echo "  # Test Origin Blocking (should return 403):"
echo "  curl -H \"Origin: https://evil-site.com\" \\"
echo "    \"https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/products\""
echo ""
echo "  # Run full audit:"
echo "  cd /workspace && node scripts/quick-cloud-audit.mjs"
echo ""

echo -e "${GREEN}✅ Helper script complete!${NC}"
echo "Follow the manual steps above to achieve 100% configuration."