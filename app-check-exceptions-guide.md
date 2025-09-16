# 🔧 How to Add Domain to Firebase App Check Exceptions

## Step-by-Step Guide to Fix Authentication Issues

### Step 1: Go to Firebase Console
1. Open your browser and go to: **https://console.firebase.google.com/project/souk-el-syarat**
2. Make sure you're logged in with the correct Google account

### Step 2: Navigate to App Check
1. In the left sidebar, look for **"App Check"**
2. Click on **"App Check"** (it might be under "Security" or "Build" section)
3. If you don't see it, try looking under "Security" or "Build"

### Step 3: Find Your Web App
1. You should see a list of your apps
2. Look for your web app (it should show as "Web" type)
3. Click on the web app to configure it

### Step 4: Add Domain Exception
1. Look for **"Debug tokens"** or **"Test tokens"** section
2. Click **"Add debug token"** or **"Add test token"**
3. In the domain field, enter: **`souk-el-syarat.web.app`**
4. Click **"Save"** or **"Add"**

### Alternative Method: Disable App Check Completely
If you can't find the exceptions section:
1. Look for **"Enforcement"** or **"Protection"** settings
2. Find your web app in the list
3. Toggle **"Enforce App Check"** to **OFF**
4. Click **"Save"**

### Step 5: Verify the Fix
1. Go back to: **https://souk-el-syarat.web.app/debug-firebase-auth.html**
2. Click **"Test Sign Up"** button
3. You should see **"✅ Sign up successful!"** instead of the App Check error

## What This Does:
- **App Check** is a security feature that blocks requests from unauthorized domains
- By adding your domain to exceptions, you allow authentication to work
- This fixes the `auth/firebase-app-check-token-is-invalid` error

## If You Still Have Issues:
1. Make sure you're in the correct Firebase project
2. Check that the web app is properly registered
3. Try disabling App Check completely for testing
4. Wait a few minutes for changes to propagate

## Success Indicators:
- ✅ No more `auth/firebase-app-check-token-is-invalid` errors
- ✅ Registration and login work properly
- ✅ Debug page shows "Sign up successful!"
