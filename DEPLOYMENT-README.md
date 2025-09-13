# 🚀 Souk El-Syarat - Automated Deployment Guide

Complete automated deployment pipeline for Google App Engine with continuous integration and delivery.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Scripts](#deployment-scripts)
- [Continuous Deployment](#continuous-deployment)
- [Monitoring & Management](#monitoring--management)
- [Troubleshooting](#troubleshooting)
- [Configuration](#configuration)

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 20+
- **Google Cloud SDK**: Latest version
- **Git**: Latest version

### Google Cloud Setup
1. **Create Project**:
   ```bash
   gcloud projects create souk-el-syarat
   gcloud config set project souk-el-syarat
   ```

2. **Enable Required APIs**:
   ```bash
   gcloud services enable appengine.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Create App Engine App**:
   ```bash
   gcloud app create --region=us-central1
   ```

4. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### Environment Variables
Set these environment variables for your deployment:

```bash
export PROJECT_ID=souk-el-syarat
export REGION=us-central1
export GITHUB_USERNAME=your-github-username
```

## ⚡ Quick Start

### One-Command Full Deployment
```bash
./deploy-app-engine.sh
```

This will:
- ✅ Check all prerequisites
- ✅ Enable required APIs
- ✅ Configure App Engine
- ✅ Install dependencies
- ✅ Build application
- ✅ Deploy to production
- ✅ Setup monitoring endpoints

## 📜 Deployment Scripts

### Main Deployment Scripts

#### 1. Full Automated Deployment
```bash
./deploy-app-engine.sh
```
**Features:**
- Complete deployment pipeline
- Prerequisite checks
- Error handling and rollback
- Health checks
- Deployment summary

#### 2. Quick Development Deployment
```bash
./deploy-quick.sh
```
**Features:**
- Fast iteration deployment
- Non-promoted version (safe for testing)
- Automatic version naming
- Minimal output

#### 3. Emergency Rollback
```bash
./rollback.sh
```
**Features:**
- Instant rollback to previous version
- Traffic migration
- Version management
- Safety confirmations

### Utility Scripts

#### 4. Cloud Build Setup
```bash
./setup-cloud-build.sh
```
**Features:**
- Automated trigger creation
- Service account setup
- Permission configuration
- Build bucket creation

#### 5. App Hosting Deployment (Alternative)
```bash
./deploy-apphosting.sh
```
**Features:**
- Firebase App Hosting deployment
- Alternative to App Engine
- Firebase-specific optimizations

## 🔄 Continuous Deployment

### Automated Pipeline Setup

1. **Setup Cloud Build Triggers**:
   ```bash
   export GITHUB_USERNAME=your-github-username
   ./setup-cloud-build.sh
   ```

2. **Connect GitHub Repository**:
   - Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
   - Click "Connect Repository"
   - Select your GitHub repository
   - Authorize Google Cloud Build

3. **Automatic Triggers Created**:
   - **Main Branch**: Production deployment
   - **Develop Branch**: Staging deployment
   - **Pull Requests**: Build validation

### Pipeline Flow

```
GitHub Push → Cloud Build → Tests → Build → Deploy → Health Check
     ↓           ↓         ↓       ↓       ↓         ↓
  Trigger    cloudbuild.yaml  npm test  Vite     App Engine  /health
```

## 📊 Monitoring & Management

### Application URLs
- **Production**: `https://souk-el-syarat.appspot.com`
- **Staging**: `https://staging-dot-souk-el-syarat.appspot.com`
- **Version-specific**: `https://[version]-dot-souk-el-syarat.appspot.com`

### Health Monitoring
```bash
# Check application health
curl https://souk-el-syarat.appspot.com/health

# View application logs
gcloud app logs tail

# Monitor performance
gcloud app versions describe [version]
```

### Version Management
```bash
# List all versions
gcloud app versions list

# Promote version to production
gcloud app versions migrate [version]

# Delete old version
gcloud app versions delete [version]

# Split traffic between versions
gcloud app versions start [version] --split-health-allocations [version]=0.5
```

## 🔧 Configuration Files

### app.yaml - App Engine Configuration
```yaml
runtime: nodejs20
env: standard
instance_class: F1

handlers:
  - url: /assets
    static_dir: dist/assets
  - url: /.*
    static_files: dist/index.html
    upload: dist/index.html

env_variables:
  NODE_ENV: "production"
  CI: "true"
```

### cloudbuild.yaml - Build Pipeline
```yaml
steps:
  - name: 'node:18'
    args: ['ci']
  - name: 'node:18'
    args: ['run', 'build']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['app', 'deploy']
```

### package.json - Build Scripts
```json
{
  "scripts": {
    "build": "vite build",
    "build:apphosting": "vite build --mode production",
    "start:prod": "node server.js"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
gcloud builds list
gcloud builds log [build-id]

# Debug locally
npm run build:apphosting
```

#### Deployment Failures
```bash
# Check deployment status
gcloud app versions list
gcloud app versions describe [version]

# View deployment logs
gcloud app logs read
```

#### Permission Issues
```bash
# Check service account permissions
gcloud iam service-accounts get-iam-policy souk-el-syarat-deployer@souk-el-syarat.iam.gserviceaccount.com

# Grant missing permissions
gcloud projects add-iam-policy-binding souk-el-syarat \
  --member="serviceAccount:souk-el-syarat-deployer@souk-el-syarat.iam.gserviceaccount.com" \
  --role="roles/appengine.deployer"
```

#### Version Conflicts
```bash
# Stop conflicting version
gcloud app versions stop [version]

# Force deploy new version
gcloud app deploy --version=[new-version] --promote
```

### Emergency Procedures

#### Immediate Rollback
```bash
./rollback.sh
```

#### Complete Redeploy
```bash
gcloud app versions delete [problematic-version]
./deploy-app-engine.sh
```

#### Service Recovery
```bash
# Restart App Engine service
gcloud app versions start [version]
gcloud app versions migrate [version]
```

## 📈 Performance Optimization

### App Engine Configuration
- **Instance Class**: F1-F4 based on traffic
- **Scaling**: Automatic scaling with min/max instances
- **Memory**: 256MB - 2GB based on application needs

### Build Optimization
- **Caching**: Dependencies cached in Cloud Build
- **Parallel Builds**: Multiple build steps in parallel
- **Artifact Storage**: Build artifacts stored in GCS

### Monitoring Setup
```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# Create uptime checks
# Go to: https://console.cloud.google.com/monitoring/uptime
```

## 🔒 Security Best Practices

### Service Accounts
- Use dedicated service accounts
- Principle of least privilege
- Rotate keys regularly

### Environment Variables
- Store secrets in Secret Manager
- Never commit sensitive data
- Use encrypted environment variables

### Access Control
```bash
# Setup IAM roles
gcloud projects add-iam-policy-binding souk-el-syarat \
  --member="user:your-email@example.com" \
  --role="roles/appengine.appAdmin"
```

## 📞 Support

### Getting Help
1. Check this documentation
2. Review Cloud Build logs
3. Check App Engine logs
4. Contact development team

### Useful Links
- [App Engine Console](https://console.cloud.google.com/appengine)
- [Cloud Build Console](https://console.cloud.google.com/cloud-build)
- [App Engine Documentation](https://cloud.google.com/appengine/docs)
- [Cloud Build Documentation](https://cloud.google.com/cloud-build/docs)

---

**🎉 Happy Deploying with Souk El-Syarat!**

*This deployment system ensures reliable, automated, and scalable delivery of your automotive marketplace application.*
