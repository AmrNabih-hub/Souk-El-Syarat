# 🚀 **GITHUB ACTIONS SETUP GUIDE**
# Professional CI/CD Configuration for Souk El-Sayarat

## 📋 **OVERVIEW**

This guide provides comprehensive setup instructions for GitHub Actions workflows, including required secrets, environment variables, and best practices for resolving context validation warnings.

## 🔐 **REQUIRED SECRETS**

### **Firebase Configuration**
```bash
# Required for deployment and monitoring
FIREBASE_PROJECT_ID          # Your Firebase project ID (e.g., souk-el-sayarat)
FIREBASE_SERVICE_ACCOUNT_KEY # Base64 encoded Firebase service account JSON
FIREBASE_TOKEN              # Firebase CLI token for authentication
```

### **Slack Integration**
```bash
# Required for notifications and alerts
SLACK_WEBHOOK               # Slack webhook URL for channel notifications
SLACK_BOT_TOKEN            # Slack bot token for advanced integrations
```

### **Monitoring & Analytics**
```bash
# Optional but recommended for production
MONITORING_WEBHOOK         # Webhook for external monitoring services
ANALYTICS_API_KEY          # Analytics service API key
PERFORMANCE_API_KEY        # Performance monitoring API key
```

## 🛠️ **SECRETS SETUP INSTRUCTIONS**

### **Step 1: Access GitHub Repository Settings**
1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**

### **Step 2: Add Firebase Secrets**

#### **FIREBASE_PROJECT_ID**
```bash
# Value: Your Firebase project ID
# Example: souk-el-sayarat-12345
```

#### **FIREBASE_SERVICE_ACCOUNT_KEY**
```bash
# 1. Go to Firebase Console → Project Settings → Service Accounts
# 2. Click "Generate new private key"
# 3. Download the JSON file
# 4. Encode to base64:
cat firebase-service-account.json | base64 -w 0

# 5. Copy the base64 string and paste as secret value
```

#### **FIREBASE_TOKEN**
```bash
# 1. Install Firebase CLI: npm install -g firebase-tools
# 2. Login: firebase login
# 3. Generate token: firebase login:ci
# 4. Copy the token and paste as secret value
```

### **Step 3: Add Slack Secrets**

#### **SLACK_WEBHOOK**
```bash
# 1. Go to Slack → Apps → Incoming Webhooks
# 2. Create new webhook for your channel
# 3. Copy the webhook URL and paste as secret value
# Example: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## 🔧 **ENVIRONMENT SETUP**

### **Firebase Project Configuration**
```bash
# 1. Initialize Firebase in your project
firebase init

# 2. Select your project
# 3. Configure hosting
# 4. Update firebase.json with proper configuration
```

### **Firebase Configuration File (firebase.json)**
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

## 🚨 **RESOLVING CONTEXT VALIDATION WARNINGS**

### **Understanding the Warnings**
The warnings you see about "Context access might be invalid" are **normal and expected** in GitHub Actions. They occur because:

1. **Design-time validation**: GitHub Actions validates workflows before secrets are available
2. **Security**: Secrets are only available during workflow execution
3. **Best practice**: These warnings help identify potential issues

### **Warnings are NOT Errors**
```yaml
# These warnings are expected and safe to ignore:
# - "Context access might be invalid: FIREBASE_PROJECT_ID"
# - "Context access might be invalid: SLACK_WEBHOOK"
```

### **Best Practices for Context Usage**
```yaml
# ✅ Good: Use secrets with proper validation
if: ${{ secrets.FIREBASE_PROJECT_ID != '' }}

# ✅ Good: Provide fallback values
${{ secrets.FIREBASE_PROJECT_ID || 'demo-project' }}

# ✅ Good: Validate secrets in runtime
if [ -z "${{ secrets.FIREBASE_PROJECT_ID }}" ]; then
  echo "❌ Error: FIREBASE_PROJECT_ID secret is not set"
  exit 1
fi
```

## 📊 **WORKFLOW VALIDATION**

### **Pre-commit Validation**
```bash
# Install actionlint for workflow validation
npm install -g actionlint

# Validate workflows
actionlint .github/workflows/*.yml
```

### **Local Testing with Act**
```bash
# Install act for local workflow testing
# Note: Limited secret support in local testing
npm install -g @nektos/act

# Test specific workflow
act -W .github/workflows/ci-cd-pipeline.yml
```

## 🔍 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Issue 1: Secrets Not Available**
```bash
# Problem: Secrets not accessible during workflow execution
# Solution: Ensure secrets are properly configured in repository settings
# Check: Settings → Secrets and variables → Actions
```

#### **Issue 2: Firebase Authentication Failed**
```bash
# Problem: Firebase deployment fails due to authentication
# Solution: Verify FIREBASE_SERVICE_ACCOUNT_KEY is properly encoded
# Command: cat service-account.json | base64 -w 0
```

#### **Issue 3: Slack Notifications Not Working**
```bash
# Problem: Slack webhook not delivering messages
# Solution: Verify webhook URL and channel permissions
# Test: Use curl to test webhook manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_WEBHOOK_URL
```

### **Debug Commands**
```bash
# Check workflow execution
gh run list --workflow="CI/CD Pipeline"

# View workflow logs
gh run view RUN_ID --log

# Check repository secrets (requires admin access)
gh secret list
```

## 🚀 **PRODUCTION DEPLOYMENT CHECKLIST**

### **Pre-deployment Verification**
- [ ] All secrets are configured
- [ ] Firebase project is properly set up
- [ ] Slack channels are configured
- [ ] Monitoring endpoints are accessible
- [ ] Test workflows pass locally

### **Deployment Steps**
1. **Manual Trigger**: Use workflow_dispatch with production environment
2. **Quality Gates**: Ensure quality score ≥ 80
3. **Test Results**: All tests must pass
4. **Build Success**: Production build must complete
5. **Post-deployment**: Verify deployment health

### **Post-deployment Verification**
- [ ] Application is accessible
- [ ] Health checks pass
- [ ] Monitoring is active
- [ ] Alerts are configured
- [ ] Performance metrics are collected

## 📈 **MONITORING & ALERTS**

### **Slack Channel Setup**
```bash
# Required channels for notifications:
#alerts          # Critical system alerts
#deployments     # Deployment notifications
#ci-cd          # CI/CD workflow summaries
#monitoring     # Daily monitoring reports
#security       # Security alerts
#analytics      # Analytics reports
#backups        # Backup status reports
```

### **Alert Thresholds**
```yaml
# Performance thresholds
ALERT_THRESHOLD_RESPONSE_TIME: 2000ms
ALERT_THRESHOLD_ERROR_RATE: 5%
ALERT_THRESHOLD_UPTIME: 99%

# Quality thresholds
MIN_QUALITY_SCORE: 80
MIN_TEST_COVERAGE: 70
MAX_LINT_ISSUES: 50
```

## 🔒 **SECURITY BEST PRACTICES**

### **Secret Management**
- [ ] Never commit secrets to repository
- [ ] Use environment-specific secrets
- [ ] Rotate secrets regularly
- [ ] Limit secret access to necessary workflows
- [ ] Audit secret usage regularly

### **Workflow Security**
- [ ] Use `pull_request` triggers for code review
- [ ] Implement quality gates before deployment
- [ ] Require approval for production deployments
- [ ] Use least privilege principle for permissions

## 📚 **ADDITIONAL RESOURCES**

### **Documentation**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Slack API Documentation](https://api.slack.com/)

### **Tools**
- [Actionlint](https://github.com/rhysd/actionlint) - Workflow validation
- [Act](https://github.com/nektos/act) - Local workflow testing
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) - Local development

### **Community**
- [GitHub Actions Community](https://github.com/actions/community)
- [Firebase Community](https://firebase.google.com/community)
- [Slack Developer Community](https://slack.dev/)

## ✅ **VERIFICATION CHECKLIST**

### **Setup Complete When:**
- [ ] All required secrets are configured
- [ ] Workflows validate without critical errors
- [ ] Test workflows execute successfully
- [ ] Firebase deployment works
- [ ] Slack notifications are delivered
- [ ] Monitoring is active
- [ ] Quality gates are enforced

### **Next Steps After Setup:**
1. **Test Workflows**: Trigger manual workflow execution
2. **Verify Notifications**: Check Slack channel messages
3. **Monitor Performance**: Review workflow execution times
4. **Optimize**: Adjust thresholds and configurations
5. **Scale**: Add more environments and workflows

---

**Note**: The context validation warnings are expected and indicate that GitHub Actions is properly validating your workflows. These warnings do not affect workflow execution and can be safely ignored in production.
