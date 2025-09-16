# 🔥 FIREBASE DOMAIN CONFIGURATION - EMERGENCY FIX

## **CRITICAL: Add Development Domain to Firebase Console**

### **Step 1: Access Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `souk-el-syarat`
3. Go to Project Settings (gear icon)

### **Step 2: Add Authorized Domains**
In the "Authorized domains" section, add these domains:
- `localhost`
- `127.0.0.1`
- `172.24.160.1` (your development server IP)
- `172.24.160.1:4173` (your development server with port)
- `souk-el-syarat.firebaseapp.com`
- `souk-el-syarat.web.app`

### **Step 3: Update Firebase Hosting (if using)**
If using Firebase Hosting, also add:
- `souk-el-syarat.web.app`
- `souk-el-syarat.firebaseapp.com`

### **Step 4: Update Firestore Rules (if needed)**
Make sure Firestore rules allow your development domain:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Step 5: Update Storage Rules (if needed)**
Make sure Storage rules allow your development domain:
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

## **IMMEDIATE ACTION REQUIRED**
This configuration will resolve the `403 PERMISSION_DENIED` errors.
