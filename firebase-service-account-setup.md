# 🔐 Firebase Service Account Setup Guide
## Automated Deployment Configuration

This guide will help you set up a Firebase service account for automated deployments via GitHub Actions.

---

## 📋 Prerequisites

- Firebase project created (souk-el-syarat)
- Admin access to the Firebase project
- GitHub repository with admin access

---

## 🔧 Step 1: Create Service Account

### Option A: Using Firebase Console (Recommended)

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Select your Firebase project**
   - Project ID: `souk-el-syarat`

3. **Navigate to IAM & Admin → Service Accounts**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts
   ```

4. **Create Service Account**
   - Click "CREATE SERVICE ACCOUNT"
   - Service account name: `github-actions-deploy`
   - Service account ID: `github-actions-deploy`
   - Description: `Service account for GitHub Actions automated deployment`
   - Click "CREATE AND CONTINUE"

5. **Grant Roles**
   Add the following roles:
   - `Firebase Hosting Admin`
   - `Firebase Rules Admin` (if deploying rules)
   - `Cloud Build Service Account`
   - `Service Account User`
   - Click "CONTINUE"

6. **Create Key**
   - Click "DONE"
   - Find your service account in the list
   - Click on the service account email
   - Go to "KEYS" tab
   - Click "ADD KEY" → "Create new key"
   - Choose "JSON"
   - Click "CREATE"
   - **SAVE THE DOWNLOADED JSON FILE SECURELY**

### Option B: Using Firebase CLI

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# List projects to confirm
firebase projects:list

# Use your project
firebase use souk-el-syarat

# Create service account key
firebase init hosting:github
```

---

## 🔒 Step 2: Add Service Account to GitHub Secrets

1. **Open the downloaded JSON file**
   - This contains your service account credentials
   - **NEVER commit this file to your repository**

2. **Go to your GitHub repository**
   ```
   https://github.com/AmrNabih-hub/Souk-El-Syarat
   ```

3. **Navigate to Settings → Secrets and variables → Actions**

4. **Add New Repository Secret**
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: **Paste the ENTIRE contents of the JSON file**
   - Click "Add secret"

5. **Add Additional Secrets (Optional)**
   
   | Secret Name | Value | Description |
   |------------|--------|------------|
   | `FIREBASE_PROJECT_ID` | `souk-el-syarat` | Your Firebase project ID |
   | `DISCORD_WEBHOOK` | Your webhook URL | For deployment notifications |
   | `SLACK_WEBHOOK` | Your webhook URL | For Slack notifications |

---

## 🚀 Step 3: Configure Firebase Project

### Enable Required APIs

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **Enable the following APIs:**
   - Firebase Hosting API
   - Cloud Build API
   - Cloud Resource Manager API
   - Firebase Management API

### Configure Firebase Hosting

1. **Update firebase.json**
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

2. **Update .firebaserc**
   ```json
   {
     "projects": {
       "default": "souk-el-syarat",
       "staging": "souk-el-syarat-staging",
       "production": "souk-el-syarat"
     }
   }
   ```

---

## ✅ Step 4: Test Automated Deployment

### Local Test

```bash
# Make the deployment script executable
chmod +x deploy-automated.sh

# Test deployment locally
./deploy-automated.sh staging
```

### GitHub Actions Test

1. **Create a test branch**
   ```bash
   git checkout -b test-deployment
   ```

2. **Make a small change**
   ```bash
   echo "# Test deployment" >> README.md
   git add .
   git commit -m "Test automated deployment"
   git push origin test-deployment
   ```

3. **Create Pull Request**
   - Go to GitHub
   - Create PR to main branch
   - Watch Actions tab for deployment

4. **Monitor Deployment**
   - Check Actions tab: https://github.com/AmrNabih-hub/Souk-El-Syarat/actions
   - View deployment status
   - Check logs for any issues

---

## 🔍 Step 5: Verify Deployment

### Check Deployment Status

```bash
# Check Firebase hosting releases
firebase hosting:releases:list --project souk-el-syarat

# View latest deployment
firebase hosting:channel:list --project souk-el-syarat
```

### Monitor in Firebase Console

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com/project/souk-el-syarat/hosting
   ```

2. **Check Release History**
   - View all deployments
   - Check deployment status
   - Monitor traffic

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. Permission Denied Error
```
Error: Missing permissions for Firebase Hosting
```
**Solution:** Add `Firebase Hosting Admin` role to service account

#### 2. Build Artifacts Not Found
```
Error: dist directory not found
```
**Solution:** Ensure build step completes before deployment

#### 3. Authentication Failed
```
Error: Failed to authenticate service account
```
**Solution:** Verify FIREBASE_SERVICE_ACCOUNT secret is correctly set

#### 4. API Not Enabled
```
Error: Firebase Hosting API has not been enabled
```
**Solution:** Enable required APIs in Google Cloud Console

---

## 📊 Monitoring Deployments

### GitHub Actions Dashboard
- View all workflow runs
- Check deployment status
- Download artifacts
- View logs

### Firebase Console
- Monitor hosting performance
- View deployment history
- Check error rates
- Analyze traffic

### Custom Notifications
Configure webhooks for:
- Discord notifications
- Slack alerts
- Email notifications
- Custom integrations

---

## 🔄 Rollback Procedure

If deployment fails or causes issues:

### Automatic Rollback
The workflow includes automatic rollback for production failures.

### Manual Rollback
```bash
# List all releases
firebase hosting:releases:list --project souk-el-syarat

# Rollback to specific version
firebase hosting:rollback --project souk-el-syarat

# Or rollback to previous version
firebase hosting:rollback --project souk-el-syarat
```

---

## 📝 Best Practices

1. **Security**
   - Never commit service account keys
   - Rotate keys regularly
   - Use least privilege principle
   - Enable audit logging

2. **Deployment Strategy**
   - Deploy to staging first
   - Run tests before production
   - Use feature flags
   - Monitor after deployment

3. **Backup Strategy**
   - Keep deployment artifacts
   - Version your deployments
   - Document rollback procedures
   - Test disaster recovery

---

## 🎯 Quick Commands

```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main

# Manual deployment via GitHub
# Go to Actions → Auto-Deploy → Run workflow

# Check deployment status
firebase hosting:releases:list

# View deployment URL
echo "https://souk-el-syarat.firebaseapp.com"
```

---

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review Firebase Console errors
3. Verify service account permissions
4. Check API enablement status
5. Review this documentation

---

**Your automated deployment system is now configured and ready to use!** 🚀