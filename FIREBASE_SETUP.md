# 🔥 Firebase CI/CD Authentication Setup Guide

## Overview
This guide will help you configure Firebase authentication for your GitHub Actions CI/CD pipeline to enable automatic deployment to Firebase Hosting.

## 🚨 Current Issue
Your deployment is failing with: `❌ No Firebase authentication method available!`

This happens because GitHub Actions needs authentication credentials to deploy to Firebase on your behalf.

## 🔧 Quick Fix - Choose One Method

### Method 1: Firebase Token (Recommended for Personal Projects)

**Step 1: Install Firebase CLI**
```bash
npm install -g firebase-tools
```

**Step 2: Login to Firebase**
```bash
firebase login
```
This will open your browser to authenticate with your Google account.

**Step 3: Generate CI Token**
```bash
firebase login:ci
```
Copy the token that appears (it looks like: `1//0GH...`)

**Step 4: Add GitHub Repository Secrets**
1. Go to your GitHub repository
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Add these secrets:

| Secret Name | Value | Required |
|------------|--------|----------|
| `FIREBASE_TOKEN` | Your token from step 3 | ✅ Yes |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | ✅ Yes |

**Step 5: Find Your Firebase Project ID**
```bash
firebase projects:list
```
Or check your Firebase console URL: `https://console.firebase.google.com/project/YOUR-PROJECT-ID`

---

### Method 2: Service Account (Recommended for Production)

**Step 1: Create Service Account**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to `Project Settings` → `Service Accounts`
4. Click `Generate new private key`
5. Download the JSON file

**Step 2: Add GitHub Repository Secrets**
1. Go to your GitHub repository
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Add these secrets:

| Secret Name | Value | Required |
|------------|--------|----------|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Entire content of the JSON file | ✅ Yes |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | ✅ Yes |

---

## 🎯 Required GitHub Secrets Summary

You need **ONE** of these authentication methods:

**Option A: Firebase Token**
- `FIREBASE_TOKEN` - Your Firebase CI token
- `FIREBASE_PROJECT_ID` - Your Firebase project ID

**Option B: Service Account**
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Service account JSON content
- `FIREBASE_PROJECT_ID` - Your Firebase project ID

## 🔍 How to Add GitHub Secrets

1. **Navigate to your repository on GitHub**
2. **Click on `Settings` tab**
3. **In the left sidebar, click `Secrets and variables` → `Actions`**
4. **Click `New repository secret`**
5. **Enter the secret name and value**
6. **Click `Add secret`**

## 🚀 Test Your Setup

After adding the secrets, push any change to your `main` branch to trigger the CI/CD pipeline:

```bash
git add -A
git commit -m "test: trigger CI/CD with Firebase auth"
git push origin main
```

## 🔧 Troubleshooting

### Error: "Invalid project ID"
- Double-check your `FIREBASE_PROJECT_ID` matches exactly with your Firebase project
- Project ID is different from project name (use the ID, not the display name)

### Error: "Invalid token"
- Your Firebase token might have expired, generate a new one with `firebase login:ci`
- Make sure you copied the entire token without extra spaces

### Error: "Permission denied"
- Ensure your Google account has owner/editor permissions on the Firebase project
- For service accounts, verify the account has necessary roles

### Error: "Project not found"
- Verify the project exists and is active in Firebase Console
- Check if the project ID is typed correctly (case-sensitive)

## 📚 Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Hosting CI/CD](https://firebase.google.com/docs/hosting/github-integration)

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the GitHub Actions logs** for detailed error messages
2. **Verify all secret names** match exactly (case-sensitive)
3. **Ensure your Firebase project is active** and not suspended
4. **Try regenerating your Firebase token** if using Method 1

---

**Once you've completed the setup above, your CI/CD pipeline should deploy successfully! 🎉**