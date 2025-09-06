# 🔥 Firebase & Google Cloud Setup Guide

## **📋 COMPREHENSIVE CONFIGURATION REQUIREMENTS**

This document outlines all the manual configurations and setup steps required for Firebase and Google Cloud services that cannot be automated.

---

## **🔥 FIREBASE CONFIGURATION**

### **1. Firebase Project Setup**

#### **Manual Steps Required:**
1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Project name: `souk-el-syarat`
   - Enable Google Analytics: ✅ Yes
   - Analytics account: Create new account

2. **Configure Project Settings**
   - Go to Project Settings (gear icon)
   - Add project to Firebase Hosting
   - Enable App Check for security

#### **Configuration Values Needed:**
```javascript
// Firebase Configuration Object
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "souk-el-syarat.firebaseapp.com",
  projectId: "souk-el-syarat",
  storageBucket: "souk-el-syarat.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### **2. Firebase Authentication Setup**

#### **Manual Steps Required:**
1. **Enable Authentication Providers**
   - Go to Authentication > Sign-in method
   - Enable Email/Password: ✅
   - Enable Google: ✅
   - Enable Phone: ✅ (Optional)
   - Enable Facebook: ✅ (Optional)

2. **Configure Google OAuth**
   - Go to Google Cloud Console
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized domains:
     - `localhost` (for development)
     - `your-domain.com` (for production)

3. **Configure Authorized Domains**
   - Add your production domain
   - Add localhost for development
   - Add any staging domains

#### **Required Environment Variables:**
```bash
# Firebase Auth
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=souk-el-syarat.firebaseapp.com
FIREBASE_PROJECT_ID=souk-el-syarat
FIREBASE_STORAGE_BUCKET=souk-el-syarat.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **3. Firestore Database Setup**

#### **Manual Steps Required:**
1. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (we'll secure it later)
   - Select location: `us-central1` (or your preferred region)

2. **Configure Security Rules**
   - Go to Firestore > Rules
   - Replace with the provided security rules (already in `firestore.rules`)

3. **Create Initial Collections**
   - Create the following collections:
     - `users`
     - `products`
     - `orders`
     - `vendorApplications`
     - `conversations`
     - `notifications`
     - `inventory`
     - `analytics`

#### **Required Indexes:**
```javascript
// Create these indexes in Firestore Console
// Collection: products
// Fields: category (Ascending), price (Ascending), createdAt (Descending)

// Collection: orders
// Fields: customerId (Ascending), status (Ascending), createdAt (Descending)

// Collection: vendorApplications
// Fields: status (Ascending), createdAt (Descending)

// Collection: conversations
// Fields: participants (Arrays), lastMessageAt (Descending)
```

### **4. Firebase Storage Setup**

#### **Manual Steps Required:**
1. **Enable Storage**
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
   - Select location: `us-central1`

2. **Configure Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Create Storage Folders**
   - Create the following folders:
     - `products/` - Product images
     - `users/` - User profile images
     - `documents/` - Vendor application documents
     - `temp/` - Temporary uploads

### **5. Firebase Cloud Messaging (FCM) Setup**

#### **Manual Steps Required:**
1. **Enable Cloud Messaging**
   - Go to Cloud Messaging
   - No additional setup required

2. **Generate Server Key**
   - Go to Project Settings > Cloud Messaging
   - Copy the Server Key
   - Copy the Sender ID

#### **Required Environment Variables:**
```bash
# Firebase Cloud Messaging
FCM_SERVER_KEY=your_server_key
FCM_SENDER_ID=your_sender_id
```

### **6. Firebase Hosting Setup**

#### **Manual Steps Required:**
1. **Initialize Hosting**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init hosting`
   - Select your project
   - Public directory: `dist`
   - Single-page app: Yes
   - Overwrite index.html: No

2. **Configure Hosting**
   - Update `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "dist",
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
         }
       ]
     }
   }
   ```

---

## **☁️ GOOGLE CLOUD PLATFORM SETUP**

### **1. Google Cloud Project Setup**

#### **Manual Steps Required:**
1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project: `souk-el-syarat`
   - Enable billing for the project

2. **Enable Required APIs**
   - Go to APIs & Services > Library
   - Enable the following APIs:
     - Cloud Firestore API
     - Firebase Authentication API
     - Cloud Storage API
     - Cloud Functions API
     - Cloud Run API
     - Cloud Build API
     - Container Registry API
     - Kubernetes Engine API
     - Cloud SQL API
     - Redis API
     - Cloud Monitoring API
     - Cloud Logging API
     - Cloud Trace API
     - Cloud Profiler API

### **2. Service Account Setup**

#### **Manual Steps Required:**
1. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name: `souk-el-syarat-service`
   - Description: `Service account for Souk El-Syarat application`

2. **Assign Roles**
   - Assign the following roles:
     - Firebase Admin
     - Cloud SQL Admin
     - Storage Admin
     - Cloud Functions Admin
     - Cloud Run Admin
     - Kubernetes Engine Admin
     - Monitoring Admin
     - Logging Admin

3. **Generate Key**
   - Click on the service account
   - Go to Keys tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download and save securely

#### **Required Environment Variables:**
```bash
# Google Cloud Service Account
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=souk-el-syarat
```

### **3. Cloud SQL Setup**

#### **Manual Steps Required:**
1. **Create Cloud SQL Instance**
   - Go to SQL
   - Click "Create Instance"
   - Choose PostgreSQL
   - Instance ID: `souk-el-syarat-db`
   - Password: Generate strong password
   - Region: `us-central1`
   - Machine type: `db-f1-micro` (for development)

2. **Configure Database**
   - Create database: `souk_el_syarat`
   - Create user: `souk_user`
   - Grant necessary permissions

3. **Configure Connection**
   - Enable Cloud SQL Admin API
   - Configure connection pooling
   - Set up SSL certificates

#### **Required Environment Variables:**
```bash
# Cloud SQL Configuration
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=souk_el_syarat
DB_USER=souk_user
DB_PASSWORD=your_db_password
DB_SSL=true
```

### **4. Redis Setup**

#### **Manual Steps Required:**
1. **Create Redis Instance**
   - Go to Memorystore
   - Click "Create Instance"
   - Instance ID: `souk-el-syarat-redis`
   - Region: `us-central1`
   - Capacity: `1GB` (for development)

2. **Configure Redis**
   - Enable AUTH
   - Set up VPC peering
   - Configure firewall rules

#### **Required Environment Variables:**
```bash
# Redis Configuration
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

### **5. Cloud Storage Setup**

#### **Manual Steps Required:**
1. **Create Storage Bucket**
   - Go to Cloud Storage
   - Click "Create Bucket"
   - Name: `souk-el-syarat-storage`
   - Location: `us-central1`
   - Storage class: `Standard`
   - Access control: `Uniform`

2. **Configure CORS**
   ```json
   [
     {
       "origin": ["https://your-domain.com", "http://localhost:3000"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "responseHeader": ["Content-Type", "Authorization"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

3. **Set Up Lifecycle Rules**
   - Delete temporary files after 30 days
   - Archive old files after 1 year

### **6. Kubernetes Cluster Setup**

#### **Manual Steps Required:**
1. **Create GKE Cluster**
   - Go to Kubernetes Engine
   - Click "Create Cluster"
   - Name: `souk-el-syarat-cluster`
   - Location: `us-central1`
   - Node count: `3`
   - Machine type: `e2-medium`

2. **Configure Node Pools**
   - Create separate node pools for different workloads
   - Configure auto-scaling
   - Set up preemptible nodes for cost optimization

3. **Install Required Tools**
   - Install kubectl
   - Install Helm
   - Configure cluster access

### **7. Cloud Functions Setup**

#### **Manual Steps Required:**
1. **Enable Cloud Functions**
   - Go to Cloud Functions
   - Enable the API
   - Set up billing

2. **Configure Functions**
   - Set up environment variables
   - Configure memory and timeout
   - Set up triggers

#### **Required Environment Variables:**
```bash
# Cloud Functions
FUNCTIONS_REGION=us-central1
FUNCTIONS_MEMORY=256MB
FUNCTIONS_TIMEOUT=60s
```

---

## **🔧 MANUAL CONSOLE ACTIONS REQUIRED**

### **1. Firebase Console Actions**

#### **Authentication Setup:**
1. Go to Authentication > Users
2. Create test users for different roles
3. Configure user attributes
4. Set up custom claims for roles

#### **Firestore Setup:**
1. Go to Firestore > Data
2. Create initial documents for testing
3. Set up data validation rules
4. Configure indexes for complex queries

#### **Storage Setup:**
1. Go to Storage > Files
2. Upload sample images
3. Test file upload/download
4. Configure CORS settings

#### **Hosting Setup:**
1. Go to Hosting
2. Deploy initial version
3. Configure custom domain
4. Set up SSL certificates

### **2. Google Cloud Console Actions**

#### **IAM Setup:**
1. Go to IAM & Admin > IAM
2. Add team members with appropriate roles
3. Configure organization policies
4. Set up audit logs

#### **Monitoring Setup:**
1. Go to Monitoring
2. Create custom dashboards
3. Set up alerting policies
4. Configure uptime checks

#### **Logging Setup:**
1. Go to Logging
2. Create log sinks
3. Set up log-based metrics
4. Configure log retention

#### **Security Setup:**
1. Go to Security Command Center
2. Enable security scanning
3. Set up vulnerability scanning
4. Configure security policies

---

## **📋 ENVIRONMENT VARIABLES CHECKLIST**

### **Firebase Configuration:**
- [ ] `FIREBASE_API_KEY`
- [ ] `FIREBASE_AUTH_DOMAIN`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_STORAGE_BUCKET`
- [ ] `FIREBASE_MESSAGING_SENDER_ID`
- [ ] `FIREBASE_APP_ID`
- [ ] `FIREBASE_MEASUREMENT_ID`

### **Google Cloud Configuration:**
- [ ] `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] `GOOGLE_CLOUD_PROJECT_ID`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### **Database Configuration:**
- [ ] `DB_HOST`
- [ ] `DB_PORT`
- [ ] `DB_NAME`
- [ ] `DB_USER`
- [ ] `DB_PASSWORD`
- [ ] `DB_SSL`

### **Redis Configuration:**
- [ ] `REDIS_HOST`
- [ ] `REDIS_PORT`
- [ ] `REDIS_PASSWORD`
- [ ] `REDIS_DB`

### **Cloud Functions Configuration:**
- [ ] `FUNCTIONS_REGION`
- [ ] `FUNCTIONS_MEMORY`
- [ ] `FUNCTIONS_TIMEOUT`

### **FCM Configuration:**
- [ ] `FCM_SERVER_KEY`
- [ ] `FCM_SENDER_ID`

---

## **🚀 DEPLOYMENT CHECKLIST**

### **Pre-deployment:**
- [ ] All environment variables configured
- [ ] Service accounts created and configured
- [ ] Database instances created and accessible
- [ ] Storage buckets created and configured
- [ ] Security rules deployed
- [ ] APIs enabled
- [ ] Billing configured

### **Post-deployment:**
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Test file uploads
- [ ] Test real-time features
- [ ] Monitor logs and metrics
- [ ] Set up alerting
- [ ] Configure backup strategies

---

## **📞 SUPPORT CONTACTS**

### **Firebase Support:**
- Documentation: https://firebase.google.com/docs
- Community: https://firebase.google.com/community
- Support: https://firebase.google.com/support

### **Google Cloud Support:**
- Documentation: https://cloud.google.com/docs
- Community: https://cloud.google.com/community
- Support: https://cloud.google.com/support

---

**⚠️ IMPORTANT NOTES:**
1. Keep all credentials secure and never commit them to version control
2. Use different projects for development, staging, and production
3. Regularly rotate service account keys
4. Monitor usage and costs
5. Set up proper backup and disaster recovery procedures
6. Keep documentation updated as configurations change