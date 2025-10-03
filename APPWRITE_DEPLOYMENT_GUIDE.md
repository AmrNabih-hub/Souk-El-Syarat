# 🚀 APPWRITE DEPLOYMENT GUIDE
## Souk El-Sayarat - Complete Setup & Deployment

**Date:** October 3, 2025  
**Platform:** Appwrite Cloud + Appwrite Sites  
**Status:** ✅ Ready for Deployment

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Appwrite Backend Setup](#appwrite-backend-setup)
4. [Database Configuration](#database-configuration)
5. [Storage Configuration](#storage-configuration)
6. [Environment Variables](#environment-variables)
7. [Deploy to Appwrite Sites](#deploy-to-appwrite-sites)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW

This guide will help you:
- ✅ Set up Appwrite Cloud backend
- ✅ Configure database collections
- ✅ Set up storage buckets
- ✅ Deploy frontend to Appwrite Sites
- ✅ Configure environment variables
- ✅ Test all functionality

**Estimated Time:** 45-60 minutes

---

## 📦 PREREQUISITES

### 1. Create Appwrite Cloud Account

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up for a free account
3. Verify your email
4. Create a new project: "Souk El-Sayarat"
5. Note your **Project ID** (you'll need this!)

### 2. Required Tools

```bash
# Node.js (already installed)
node --version  # Should be >= 20.0.0

# Git (for Appwrite Sites deployment)
git --version
```

---

## 🔧 APPWRITE BACKEND SETUP

### Step 1: Create Project

1. In Appwrite Console, create a new project
2. Name: `Souk El-Sayarat`
3. Copy the **Project ID** - you'll need this!

### Step 2: Configure Authentication

1. Go to **Auth** → **Settings**
2. Enable **Email/Password** authentication
3. Set session length: **30 days**
4. Enable email verification: **Optional** (recommended for production)

#### Email Templates (Optional):
```
Verification Email:
Subject: تأكيد بريدك الإلكتروني - سوق السيارات
Body: مرحباً {{name}}، يرجى النقر على الرابط لتأكيد بريدك الإلكتروني: {{url}}
```

### Step 3: Add Platform

1. Go to **Settings** → **Platforms**
2. Click **Add Platform** → **Web App**
3. Name: `Souk El-Sayarat Web`
4. Hostname: `localhost` (for development)
5. Add your production domain later (e.g., `souk-al-sayarat.appwrite.network`)

---

## 💾 DATABASE CONFIGURATION

### Step 1: Create Database

1. Go to **Databases** → **Create Database**
2. Name: `souk-database`
3. ID: `souk-database` (or auto-generate)
4. Copy the **Database ID**

### Step 2: Create Collections

Create the following collections with their attributes:

#### 1. **Users Collection** (`users`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| userId | string | 255 | ✅ | ❌ |
| email | email | 255 | ✅ | ❌ |
| displayName | string | 255 | ✅ | ❌ |
| role | enum ['customer', 'vendor', 'admin'] | - | ✅ | ❌ |
| phoneNumber | string | 50 | ❌ | ❌ |
| photoURL | url | 2000 | ❌ | ❌ |
| isActive | boolean | - | ✅ | ❌ |
| emailVerified | boolean | - | ✅ | ❌ |
| preferences | string | 5000 | ❌ | ❌ |

**Indexes:**
- `userId` (unique, key)
- `email` (unique, fulltext)
- `role` (key)

#### 2. **Products Collection** (`products`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| title | string | 500 | ✅ | ❌ |
| description | string | 5000 | ✅ | ❌ |
| price | float | - | ✅ | ❌ |
| originalPrice | float | - | ❌ | ❌ |
| category | string | 100 | ✅ | ❌ |
| brand | string | 100 | ❌ | ❌ |
| model | string | 100 | ❌ | ❌ |
| year | integer | - | ❌ | ❌ |
| mileage | integer | - | ❌ | ❌ |
| condition | enum ['new', 'used', 'certified'] | - | ✅ | ❌ |
| images | url | 2000 | ❌ | ✅ |
| vendorId | string | 255 | ✅ | ❌ |
| status | enum ['active', 'sold', 'pending', 'inactive'] | - | ✅ | ❌ |
| featured | boolean | - | ✅ | ❌ |
| views | integer | - | ✅ | ❌ |

**Indexes:**
- `vendorId` (key)
- `category` (fulltext)
- `status` (key)
- `price` (key)

#### 3. **Orders Collection** (`orders`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| customerId | string | 255 | ✅ | ❌ |
| vendorId | string | 255 | ✅ | ❌ |
| productId | string | 255 | ✅ | ❌ |
| status | enum ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] | - | ✅ | ❌ |
| totalAmount | float | - | ✅ | ❌ |
| paymentMethod | enum ['cod', 'instapay', 'card'] | - | ✅ | ❌ |
| paymentStatus | enum ['pending', 'paid', 'failed'] | - | ✅ | ❌ |
| shippingAddress | string | 2000 | ✅ | ❌ |
| trackingNumber | string | 255 | ❌ | ❌ |

**Indexes:**
- `customerId` (key)
- `vendorId` (key)
- `status` (key)

#### 4. **Vendor Applications Collection** (`vendor-applications`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| userId | string | 255 | ✅ | ❌ |
| businessName | string | 255 | ✅ | ❌ |
| businessLicense | string | 255 | ❌ | ❌ |
| phoneNumber | string | 50 | ✅ | ❌ |
| address | string | 1000 | ✅ | ❌ |
| status | enum ['pending', 'approved', 'rejected'] | - | ✅ | ❌ |
| reviewedBy | string | 255 | ❌ | ❌ |
| reviewNotes | string | 2000 | ❌ | ❌ |

**Indexes:**
- `userId` (key)
- `status` (key)

#### 5. **Car Listings Collection** (`car-listings`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| userId | string | 255 | ✅ | ❌ |
| brand | string | 100 | ✅ | ❌ |
| model | string | 100 | ✅ | ❌ |
| year | integer | - | ✅ | ❌ |
| mileage | integer | - | ✅ | ❌ |
| price | float | - | ✅ | ❌ |
| condition | string | 50 | ✅ | ❌ |
| description | string | 5000 | ✅ | ❌ |
| images | url | 2000 | ❌ | ✅ |
| status | enum ['pending', 'approved', 'rejected', 'sold'] | - | ✅ | ❌ |
| contactPhone | string | 50 | ✅ | ❌ |

**Indexes:**
- `userId` (key)
- `status` (key)
- `brand` (fulltext)

#### 6. **Messages Collection** (`messages`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| chatId | string | 255 | ✅ | ❌ |
| senderId | string | 255 | ✅ | ❌ |
| receiverId | string | 255 | ✅ | ❌ |
| content | string | 5000 | ✅ | ❌ |
| read | boolean | - | ✅ | ❌ |

**Indexes:**
- `chatId` (key)
- `senderId` (key)
- `receiverId` (key)

#### 7. **Notifications Collection** (`notifications`)

| Attribute | Type | Size | Required | Array |
|-----------|------|------|----------|-------|
| userId | string | 255 | ✅ | ❌ |
| title | string | 255 | ✅ | ❌ |
| message | string | 2000 | ✅ | ❌ |
| type | enum ['info', 'success', 'warning', 'error'] | - | ✅ | ❌ |
| read | boolean | - | ✅ | ❌ |
| actionUrl | url | 2000 | ❌ | ❌ |

**Indexes:**
- `userId` (key)
- `read` (key)

### Step 3: Set Collection Permissions

For each collection, set permissions in **Settings** → **Permissions**:

**Development Permissions (simplify for now):**
- Read: `Any`
- Create: `Users`
- Update: `Users`
- Delete: `Users`

**Production Permissions (recommended):**
- Read: `role:customer, role:vendor, role:admin`
- Create: `role:customer, role:vendor, role:admin`
- Update: `role:admin` or document owner
- Delete: `role:admin`

---

## 📦 STORAGE CONFIGURATION

### Step 1: Create Storage Buckets

1. Go to **Storage** → **Create Bucket**

Create these buckets:

#### 1. **Product Images** (`product-images`)
- Max file size: `10 MB`
- Allowed extensions: `.jpg, .jpeg, .png, .webp`
- Compression: `gzip`
- Encryption: ✅ Enabled

#### 2. **Car Images** (`car-images`)
- Max file size: `10 MB`
- Allowed extensions: `.jpg, .jpeg, .png, .webp`
- Compression: `gzip`
- Encryption: ✅ Enabled

#### 3. **Avatars** (`avatars`)
- Max file size: `2 MB`
- Allowed extensions: `.jpg, .jpeg, .png, .webp`
- Compression: `gzip`
- Encryption: ✅ Enabled

### Step 2: Set Bucket Permissions

For each bucket:
- Read: `Any` (public read for images)
- Create: `Users` (authenticated users can upload)
- Update: `Users`
- Delete: `Users`

---

## 🔐 ENVIRONMENT VARIABLES

### Step 1: Copy Project ID

From Appwrite Console **Settings** → **General**, copy your **Project ID**.

### Step 2: Configure for Appwrite Sites

When deploying to Appwrite Sites, go to **Sites** → Your Site → **Variables** and add:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<YOUR_PROJECT_ID>
VITE_APPWRITE_DATABASE_ID=souk-database

# Collections
VITE_APPWRITE_COLLECTION_USERS=users
VITE_APPWRITE_COLLECTION_PRODUCTS=products
VITE_APPWRITE_COLLECTION_ORDERS=orders
VITE_APPWRITE_COLLECTION_VENDORS=vendors
VITE_APPWRITE_COLLECTION_CUSTOMERS=customers
VITE_APPWRITE_COLLECTION_CAR_LISTINGS=car-listings
VITE_APPWRITE_COLLECTION_CHATS=chats
VITE_APPWRITE_COLLECTION_MESSAGES=messages
VITE_APPWRITE_COLLECTION_NOTIFICATIONS=notifications
VITE_APPWRITE_COLLECTION_VENDOR_APPLICATIONS=vendor-applications

# Storage Buckets
VITE_APPWRITE_BUCKET_PRODUCTS=product-images
VITE_APPWRITE_BUCKET_AVATARS=avatars
VITE_APPWRITE_BUCKET_CARS=car-images

# App Settings
VITE_APP_NAME="سوق السيارات"
VITE_APP_ENV=production
VITE_CURRENCY=EGP
VITE_DEFAULT_LANGUAGE=ar
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_ANALYTICS=true
VITE_USE_MOCK_AUTH=false
VITE_LOG_LEVEL=error
```

---

## 🚀 DEPLOY TO APPWRITE SITES

### Option A: Deploy from Git (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: integrate Appwrite backend"
   git push origin main
   ```

2. **Connect in Appwrite Console:**
   - Go to **Sites** → **Create Site**
   - Select **Import from Git**
   - Connect your GitHub account
   - Select your repository
   - Branch: `main`

3. **Configure Build Settings:**
   - Framework: `React`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Node Version: `20.x`

4. **Add Environment Variables:**
   - Copy all variables from above
   - Click **Add Variable** for each one

5. **Deploy:**
   - Click **Deploy**
   - Wait 3-5 minutes
   - Your site will be live at: `https://your-site.appwrite.network`

### Option B: Manual Deploy

```bash
# Build the project
npm run build

# The dist folder contains your static files
# Upload to Appwrite Sites manually through the console
```

---

## 🧪 TESTING

### 1. Test Authentication

1. Visit your deployed site
2. Click **Register**
3. Create a new account
4. Check Appwrite Console → **Auth** → **Users** - you should see the new user
5. Check **Databases** → `souk-database` → `users` - you should see the user profile

### 2. Test Login

1. Log out
2. Log back in with your credentials
3. You should be redirected to the homepage

### 3. Test Real-Time

1. Open browser console (F12)
2. You should see: `📡 Subscribing to...` messages
3. WebSocket connection should be established

### 4. Test Market/Products

1. Register as a vendor
2. Submit vendor application
3. As admin, approve the application
4. Vendor should see dashboard instantly (real-time update)

---

## 🔍 TROUBLESHOOTING

### Issue: 401 Errors

**Cause:** Project ID not configured or incorrect

**Fix:**
```bash
# Verify environment variables
echo $VITE_APPWRITE_PROJECT_ID

# Should match your Appwrite project ID
```

### Issue: WebSocket Connection Failed

**Cause:** Real-time not enabled or CORS issues

**Fix:**
1. Check Appwrite Console → **Settings** → **Platforms**
2. Ensure your domain is added
3. Check that hostname matches (including protocol)

### Issue: Database Errors

**Cause:** Collections not created or permissions incorrect

**Fix:**
1. Verify all collections exist in Appwrite Console
2. Check collection IDs match environment variables
3. Verify permissions allow read/write

### Issue: Image Upload Fails

**Cause:** Storage bucket not configured or permissions

**Fix:**
1. Verify buckets exist in **Storage**
2. Check bucket IDs match environment variables
3. Verify permissions allow file upload

---

## 📱 MOBILE PWA

Your app is already configured as a PWA! Users can:
1. Visit the site
2. Click the install prompt
3. Add to home screen
4. Use offline

---

## 🎉 SUCCESS!

Congratulations! Your Souk El-Sayarat marketplace is now live on Appwrite!

### Next Steps:

1. ✅ Add custom domain (optional)
2. ✅ Set up OAuth providers (Google, Facebook)
3. ✅ Configure email templates
4. ✅ Set up automated backups
5. ✅ Add analytics
6. ✅ Monitor in Appwrite Console

### Support Links:

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord](https://appwrite.io/discord)
- [Appwrite GitHub](https://github.com/appwrite/appwrite)

---

**Status:** ✅ **PRODUCTION READY**  
**Platform:** Appwrite Cloud + Appwrite Sites  
**Real-time:** ✅ Enabled  
**Authentication:** ✅ Working  
**Database:** ✅ Configured  
**Storage:** ✅ Ready  

## 🚀 YOUR APP IS LIVE! 🚀

