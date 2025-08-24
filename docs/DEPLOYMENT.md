# 🚀 **SOUK EL-SAYARAT DEPLOYMENT GUIDE**

## **Overview**
This guide provides comprehensive instructions for deploying the Souk El-Sayarat e-commerce marketplace platform to production and staging environments. The platform uses Firebase for backend services and can be deployed to various hosting platforms.

## **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Firebase Configuration](#firebase-configuration)
4. [Build & Deploy](#build--deploy)
5. [Production Deployment](#production-deployment)
6. [Staging Deployment](#staging-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## **📋 Prerequisites**

### **Required Tools**
- **Node.js:** Version 18+ (LTS recommended)
- **npm:** Version 9+ or **yarn:** Version 1.22+
- **Firebase CLI:** Version 12+
- **Git:** Version 2.30+

### **Required Accounts**
- **Firebase:** Google Cloud Project with billing enabled
- **GitHub/GitLab:** Source code repository
- **Domain Provider:** Custom domain (optional but recommended)

### **Install Required Tools**
```bash
# Install Node.js (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Firebase CLI
npm install -g firebase-tools

# Install project dependencies
npm install
```

---

## **⚙️ Environment Setup**

### **1. Clone Repository**
```bash
git clone https://github.com/your-org/souk-elsayarat.git
cd souk-elsayarat
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create environment files for different environments:

#### **Development (.env.development)**
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_dev_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-dev-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
REACT_APP_FIREBASE_APP_ID=your_dev_app_id

# Development Settings
REACT_APP_USE_EMULATORS=true
REACT_APP_EMULATOR_HOST=localhost
REACT_APP_ENVIRONMENT=development
REACT_APP_API_URL=http://localhost:5001
```

#### **Staging (.env.staging)**
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_staging_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-staging-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
REACT_APP_FIREBASE_APP_ID=your_staging_app_id

# Staging Settings
REACT_APP_USE_EMULATORS=false
REACT_APP_ENVIRONMENT=staging
REACT_APP_API_URL=https://your-staging-api.com
```

#### **Production (.env.production)**
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_prod_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-prod-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
REACT_APP_FIREBASE_APP_ID=your_prod_app_id

# Production Settings
REACT_APP_USE_EMULATORS=false
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://your-prod-api.com
REACT_APP_ANALYTICS_ID=your_analytics_id
```

---

## **🔥 Firebase Configuration**

### **1. Firebase Project Setup**
```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select your project
# Choose: Hosting, Firestore, Functions, Storage
# Set public directory: build
# Configure as SPA: Yes
# Set up automatic builds: Yes
```

### **2. Firebase Configuration Files**

#### **firebase.json**
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### **firestore.rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isVendor() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'vendor';
    }
    
    function isCustomer() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'customer';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Vendors collection
    match /vendors/{vendorId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isAdmin();
      allow update: if isAuthenticated() && isAdmin();
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create: if isAuthenticated() && isVendor();
      allow update: if isAuthenticated() && 
        (resource.data.vendorId == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && 
        (resource.data.vendorId == request.auth.uid || isAdmin());
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isAuthenticated() && 
        (resource.data.customerId == request.auth.uid || 
         resource.data.vendorId == request.auth.uid || 
         isAdmin());
      allow create: if isAuthenticated() && isCustomer();
      allow update: if isAuthenticated() && 
        (resource.data.vendorId == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Vendor applications
    match /vendor_applications/{applicationId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && isCustomer();
      allow update: if isAuthenticated() && isAdmin();
      allow delete: if isAuthenticated() && isAdmin();
    }
  }
}
```

#### **storage.rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow vendors to upload product images
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/products/$(productId)) &&
        get(/databases/$(database)/documents/products/$(productId)).data.vendorId == request.auth.uid;
    }
    
    // Allow admins to upload any file
    match /admin/{allPaths=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### **3. Deploy Firebase Rules**
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy Functions (if any)
firebase deploy --only functions
```

---

## **🏗️ Build & Deploy**

### **1. Build Process**
```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod

# Or use environment-specific builds
npm run build -- --mode development
npm run build -- --mode staging
npm run build -- --mode production
```

### **2. Build Scripts (package.json)**
```json
{
  "scripts": {
    "build:dev": "env-cmd -f .env.development react-scripts build",
    "build:staging": "env-cmd -f .env.staging react-scripts build",
    "build:prod": "env-cmd -f .env.production react-scripts build",
    "build": "react-scripts build",
    "deploy:dev": "npm run build:dev && firebase deploy --project dev-project-id",
    "deploy:staging": "npm run build:staging && firebase deploy --project staging-project-id",
    "deploy:prod": "npm run build:prod && firebase deploy --project prod-project-id"
  }
}
```

### **3. Automated Deployment**
```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

---

## **🚀 Production Deployment**

### **1. Pre-deployment Checklist**
- [ ] All tests passing (`npm run test`)
- [ ] Code quality checks (`npm run lint`)
- [ ] Build successful (`npm run build:prod`)
- [ ] Environment variables configured
- [ ] Firebase rules deployed
- [ ] Database backups completed
- [ ] Monitoring alerts configured

### **2. Production Deployment Steps**
```bash
# 1. Switch to production branch
git checkout production

# 2. Pull latest changes
git pull origin production

# 3. Install dependencies
npm ci --production

# 4. Run tests
npm run test:ci

# 5. Build production version
npm run build:prod

# 6. Deploy to Firebase
firebase deploy --project prod-project-id

# 7. Verify deployment
firebase hosting:channel:list --project prod-project-id
```

### **3. Post-deployment Verification**
```bash
# Check deployment status
firebase hosting:channel:list --project prod-project-id

# Test critical functionality
npm run test:e2e:prod

# Monitor error rates
firebase functions:log --project prod-project-id

# Check performance metrics
npm run lighthouse:prod
```

---

## **🔧 Staging Deployment**

### **1. Staging Environment Setup**
```bash
# Create staging project
firebase projects:create staging-souk-elsayarat

# Set staging project
firebase use staging-souk-elsayarat

# Deploy staging configuration
firebase deploy --project staging-souk-elsayarat
```

### **2. Staging Deployment Process**
```bash
# Deploy to staging
npm run deploy:staging

# Run staging tests
npm run test:staging

# Performance testing
npm run lighthouse:staging
```

---

## **📊 Monitoring & Maintenance**

### **1. Firebase Monitoring**
```bash
# View function logs
firebase functions:log

# Monitor Firestore usage
firebase firestore:indexes

# Check storage usage
firebase storage:buckets:list
```

### **2. Performance Monitoring**
```bash
# Lighthouse performance audit
npm run lighthouse:prod

# Bundle analysis
npm run analyze

# Core Web Vitals
npm run web-vitals
```

### **3. Health Checks**
```typescript
// Implement health check endpoints
import { firebaseFunctionsService } from '@/services/firebase-functions.service';

// Check backend health
const health = await firebaseFunctionsService.healthCheck();
console.log('Backend status:', health.status);

// Monitor real-time connections
import { realtimeService } from '@/services/realtime.service';
const stats = realtimeService.getStats();
console.log('Active connections:', stats.activeConnections);
```

### **4. Automated Monitoring**
```yaml
# GitHub Actions workflow for monitoring
name: Production Monitoring
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Health Check
        run: |
          curl -f https://your-domain.com/api/health || exit 1
      
      - name: Performance Check
        run: |
          npm run lighthouse:prod
      
      - name: Alert on Failure
        if: failure()
        run: |
          # Send alert to team
          curl -X POST $SLACK_WEBHOOK -d '{"text":"Production health check failed!"}'
```

---

## **🔍 Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check environment variables
cat .env.production

# Verify Firebase configuration
firebase projects:list
```

#### **Deployment Failures**
```bash
# Check Firebase status
firebase status

# Verify project selection
firebase use

# Check deployment logs
firebase deploy --debug
```

#### **Runtime Errors**
```bash
# Check browser console
# Monitor Firebase console
# Review function logs
firebase functions:log --only your-function-name
```

### **Performance Issues**
```bash
# Analyze bundle size
npm run analyze

# Check Core Web Vitals
npm run web-vitals

# Monitor real-time connections
# Check Firebase quotas
```

---

## **🔒 Security Considerations**

### **1. Environment Variables**
- Never commit `.env` files to version control
- Use Firebase Secret Manager for sensitive data
- Rotate API keys regularly

### **2. Access Control**
- Implement proper Firestore security rules
- Use Firebase Auth with custom claims
- Regular security audits

### **3. Monitoring**
- Monitor for suspicious activity
- Implement rate limiting
- Log all administrative actions

---

## **📈 Scaling Considerations**

### **1. Firebase Limits**
- **Free Tier:** 1M reads, 100K writes/day
- **Blaze Plan:** Pay-as-you-go scaling
- **Enterprise:** Custom limits and SLAs

### **2. Performance Optimization**
- Implement data pagination
- Use Firestore offline persistence
- Optimize real-time subscriptions
- Implement proper indexing

### **3. CDN Configuration**
```bash
# Configure custom domain
firebase hosting:channel:deploy production --expires 30d

# Set up CDN caching
firebase hosting:channel:list
```

---

## **📞 Support & Resources**

### **Documentation**
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Community**
- [Firebase Community](https://firebase.google.com/community)
- [React Community](https://reactjs.org/community/support.html)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

### **Contact**
- **Technical Support:** tech-support@souk-elsayarat.com
- **Emergency:** +20 123 456 7890
- **GitHub Issues:** https://github.com/souk-elsayarat/issues

---

*Last Updated: December 2024*
*Version: 1.0.0*
