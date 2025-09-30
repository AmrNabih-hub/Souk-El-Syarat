# 🚀 Local Development Guide - Souk El-Syarat Marketplace

## 📋 Table of Contents
1. [Root Cause Analysis](#root-cause-analysis)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Environment Configuration](#environment-configuration)
6. [Testing & Validation](#testing--validation)
7. [AI Agent Instructions](#ai-agent-instructions)

---

## 🔍 Root Cause Analysis

### Why Local Setup Takes 6+ Hours (And How We Fixed It)

#### **Primary Issues Identified:**

1. **PostCSS Version Lock (CRITICAL)**
   - **Problem**: `postcss: "8.5.6"` was hard-pinned to an outdated version
   - **Impact**: Causes peer dependency conflicts with Tailwind CSS 3.4+ and autoprefixer
   - **Solution**: Updated to `postcss: "^8.4.47"` for flexibility

2. **Vitest Version Mismatch**
   - **Problem**: `vitest@3.2.4` doesn't match `@vitest/ui@2.1.8` and `@vitest/coverage-v8@2.1.8`
   - **Impact**: Installation failures and version conflicts
   - **Solution**: Synchronized to `vitest: "^2.1.8"`

3. **AWS Amplify Configuration Errors**
   - **Problem**: App tries to initialize AWS Amplify without proper configuration
   - **Impact**: Blank white page, infinite loading, runtime errors
   - **Solution**: Development mode skips Amplify, uses localStorage auth

4. **Missing Package Manager Specification**
   - **Problem**: No clear npm version requirement enforcement
   - **Impact**: Inconsistent installations across machines
   - **Solution**: Specified `"packageManager": "npm@10.8.2"` and engines

5. **Deprecated ESLint Version**
   - **Problem**: Using ESLint 8.x which is no longer supported
   - **Impact**: Security warnings and compatibility issues
   - **Solution**: Currently stable, but should upgrade to ESLint 9 in future

6. **Peer Dependency Warnings**
   - **Problem**: Multiple packages had unmet peer dependencies
   - **Impact**: Installation warnings, potential runtime issues
   - **Solution**: Fixed version ranges to ensure compatibility

---

## ✅ Prerequisites

### Required Software

| Software | Required Version | Check Command |
|----------|-----------------|---------------|
| **Node.js** | 20.0.0 - 20.x | `node --version` |
| **npm** | 10.0.0+ | `npm --version` |
| **Git** | Any recent version | `git --version` |

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 2GB free space for dependencies

### Optional (But Recommended)
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

---

## 📦 Step-by-Step Setup

### Phase 1: Clean Environment Preparation

```bash
# 1. Verify Node.js version (CRITICAL)
node --version
# Expected: v20.x.x

# 2. Verify npm version
npm --version
# Expected: 10.x.x

# 3. If wrong version, install Node.js 20 LTS
# Visit: https://nodejs.org/ or use nvm:
nvm install 20
nvm use 20
```

### Phase 2: Project Download & Setup

```bash
# 1. Clone or download the repository
git clone <your-repo-url>
cd souk-el-syarat

# 2. CRITICAL: Clean any existing artifacts
rm -rf node_modules package-lock.json dist coverage .vite

# 3. Verify package.json is properly formatted
cat package.json | head -20
```

### Phase 3: Environment Configuration

```bash
# 1. Copy environment template
cp .env.development .env

# 2. Verify environment file
cat .env
# Should contain VITE_DEVELOPMENT_MODE=true
```

### Phase 4: Dependency Installation

```bash
# Method 1: Standard Installation (Recommended)
npm install

# Method 2: If you encounter errors, use clean install
npm ci

# Method 3: If still failing, force reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Expected output: "✅ Dependencies installed successfully"
# Time: 2-5 minutes (depending on internet speed)
```

### Phase 5: Verification & Launch

```bash
# 1. Start development server
npm run dev

# Expected output:
# VITE v6.x.x ready in XXX ms
# ➜  Local:   http://localhost:5000/
# ➜  Network: http://XXX.XXX.XXX.XXX:5000/

# 2. Open browser and navigate to:
http://localhost:5000

# You should see the Arabic car marketplace homepage
```

### Phase 6: Build Verification

```bash
# 1. Test production build
npm run build

# Expected output:
# ✓ 1785 modules transformed.
# ✓ built in ~25-30s

# 2. Preview production build
npm run preview

# 3. Open browser:
http://localhost:5000
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "npm install" Hangs or Takes Forever

**Symptoms:**
- Installation stuck at "idealTree" or "reify"
- Takes 30+ minutes with no progress
- High CPU/memory usage

**Solutions:**

```bash
# Solution 1: Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2: Use legacy peer deps
npm install --legacy-peer-deps

# Solution 3: Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm install

# Solution 4: Use npm ci (clean install)
npm ci

# Solution 5: Check for corrupted npm
npm doctor
```

### Issue 2: Peer Dependency Warnings

**Symptoms:**
```
npm WARN ERESOLVE overriding peer dependency
npm WARN peer dep missing
```

**Solution:**
```bash
# These warnings are SAFE to ignore in this project
# The app has been tested and works correctly
# If you want to suppress them:
npm install --legacy-peer-deps
```

### Issue 3: Blank White Page / App Won't Load

**Symptoms:**
- Browser shows blank white page
- No errors in console
- Infinite loading spinner

**Root Causes & Solutions:**

```bash
# Cause 1: Missing environment variables
# Solution: Ensure .env file exists
cp .env.development .env
cat .env | grep "VITE_DEVELOPMENT_MODE"
# Should show: VITE_DEVELOPMENT_MODE=true

# Cause 2: Port already in use
# Solution: Kill process on port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Cause 3: Build cache corruption
# Solution: Clear Vite cache
rm -rf .vite dist node_modules/.vite
npm run dev
```

### Issue 4: TypeScript Errors on First Load

**Symptoms:**
```
Cannot find module 'react'
Property 'VITE_AWS_REGION' does not exist
```

**Solution:**
```bash
# These are expected during first install
# TypeScript needs time to index dependencies
# Wait 30-60 seconds after npm install completes

# If persists, restart TypeScript server:
# In VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Or manually verify:
npx tsc --noEmit --skipLibCheck
```

### Issue 5: Build Fails with Memory Error

**Symptoms:**
```
FATAL ERROR: Reached heap limit
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or add to package.json scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
```

### Issue 6: PostCSS/Tailwind Errors

**Symptoms:**
```
Error: PostCSS plugin tailwindcss requires PostCSS 8
```

**Solution:**
```bash
# Verify postcss version
npm list postcss
# Should show: postcss@8.4.47

# If wrong version:
npm uninstall postcss
npm install postcss@^8.4.47
```

### Issue 7: AWS Amplify Errors in Console

**Symptoms:**
```
Amplify has not been configured
aws-amplify error
```

**Solution:**
```bash
# These are EXPECTED in development mode
# The app is designed to work without AWS in development
# Check .env file:
cat .env | grep "VITE_SKIP_AMPLIFY_CONFIG"
# Should show: VITE_SKIP_AMPLIFY_CONFIG=true

# App uses localStorage for auth simulation
# No action needed - this is intentional!
```

---

## ⚙️ Environment Configuration

### Development Environment (.env)

```bash
# Core Development Settings
NODE_ENV=development
VITE_NODE_ENV=development
VITE_APP_MODE=development

# Stability Settings (CRITICAL - DO NOT CHANGE)
VITE_DEVELOPMENT_MODE=true
VITE_SKIP_AMPLIFY_CONFIG=true
VITE_BYPASS_AUTH_VALIDATION=true
VITE_USE_MOCK_SERVICES=true

# Application Settings
VITE_APP_NAME="Souk El-Syarat Marketplace"
VITE_APP_VERSION="1.0.0-dev"
VITE_API_BASE_URL="http://localhost:3001/api"

# UI Settings
VITE_DEFAULT_THEME=light
VITE_DEFAULT_LANGUAGE=ar
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANIMATIONS=true

# Feature Flags (disabled for stability)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PUSH_NOTIFICATIONS=false
VITE_ENABLE_REAL_TIME=false

# Mock Services (CRITICAL for local development)
VITE_USE_MOCK_DATA=true
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_PAYMENTS=true

# Performance
VITE_CACHE_TTL=300000
VITE_IMAGE_OPTIMIZATION=true

# Logging
VITE_LOG_LEVEL=debug
VITE_ENABLE_CONSOLE_LOGS=true
```

### Production Environment (.env.production)

```bash
# Only configure for production deployment
NODE_ENV=production
VITE_NODE_ENV=production

# AWS Configuration (required for production)
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOLS_ID=your-user-pool-id
VITE_AWS_USER_POOLS_WEB_CLIENT_ID=your-client-id
VITE_AWS_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id

# Production settings
VITE_ENABLE_ANALYTICS=true
VITE_USE_MOCK_SERVICES=false
VITE_LOG_LEVEL=error
```

---

## ✅ Testing & Validation

### Validation Checklist

Run these commands to verify everything works:

```bash
# 1. Dependency Check
npm list --depth=0
# Should show all packages without errors

# 2. Type Check
npm run type-check
# Should complete without errors (warnings are OK)

# 3. Lint Check
npm run lint
# Should show < 50 warnings

# 4. Build Check
npm run build
# Should complete in 25-35 seconds

# 5. Preview Check
npm run preview
# Should start server on port 5000

# 6. Unit Tests
npm run test:run
# Tests should pass (some may be skipped)
```

### Expected Behavior

**Development Server (`npm run dev`):**
- ✅ Starts in 2-5 seconds
- ✅ Opens on `http://localhost:5000`
- ✅ Shows Arabic homepage with car images
- ✅ Hot Module Replacement (HMR) works
- ✅ No critical errors in console

**Production Build (`npm run build`):**
- ✅ Completes in 25-35 seconds
- ✅ Creates `dist/` directory
- ✅ Generates ~40-50 chunk files
- ✅ Main bundle < 320KB gzipped
- ✅ No build errors

**Browser:**
- ✅ Homepage loads immediately (< 2 seconds)
- ✅ Arabic RTL layout renders correctly
- ✅ Navigation works
- ✅ Images and styles load
- ✅ Can click "تسجيل" (Register) button
- ✅ No blank white pages

---

## 🤖 AI Agent Instructions

### For AI Assistants Working With This Project

#### Critical Context:
This is a React 18 + Vite + TypeScript application designed for Egyptian car marketplace. It uses AWS Amplify for production but **must work without AWS in development**.

#### Mandatory Rules:

1. **DO NOT modify these files without explicit permission:**
   - `package.json` (dependency versions)
   - `.env.development` (development configuration)
   - `vite.config.ts` (critical build settings)
   - `tsconfig.json` (TypeScript configuration)

2. **ALWAYS use these Node.js/npm versions:**
   - Node.js: 20.x.x
   - npm: 10.x.x
   - Never suggest other versions

3. **NEVER suggest these actions:**
   - Upgrading to React 19 (not stable yet)
   - Downgrading to React 17
   - Removing `skipLibCheck` from tsconfig
   - Changing PostCSS version
   - Installing global packages

4. **When helping with dependency issues:**
   ```bash
   # First try:
   npm install
   
   # If fails, try:
   npm cache clean --force
   npm install --legacy-peer-deps
   
   # Last resort:
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Common user questions and correct answers:**

   **Q: "npm install is taking forever"**
   A: This is normal for first install. Takes 2-5 minutes. If > 10 minutes, use `npm cache clean --force` then retry.

   **Q: "I see peer dependency warnings"**
   A: These are safe to ignore. Use `npm install --legacy-peer-deps` if they bother you.

   **Q: "Blank white page after install"**
   A: Verify `.env` file exists with `VITE_DEVELOPMENT_MODE=true`. Clear browser cache. Restart dev server.

   **Q: "AWS Amplify errors in console"**
   A: Expected in development. App uses localStorage auth. No action needed.

   **Q: "How do I set up Firebase/Firestore?"**
   A: Not needed for local development. App has mock services. Production uses AWS Amplify, not Firebase.

6. **File modification patterns:**
   - Always read file before editing
   - Never delete entire sections
   - Preserve comments
   - Test after changes

7. **When suggesting npm scripts:**
   - Use only scripts in package.json
   - Don't invent new scripts
   - Explain what each script does

8. **Troubleshooting order:**
   1. Check Node.js version (`node --version`)
   2. Check .env file exists
   3. Clear caches (`npm cache clean --force`)
   4. Reinstall dependencies
   5. Check port 5000 availability
   6. Verify browser cache cleared

---

## 📊 Performance Benchmarks

### Expected Timings (M1 Mac / Ryzen 7):

| Operation | Expected Time | Acceptable Range |
|-----------|---------------|------------------|
| `npm install` (first time) | 3-4 minutes | 2-8 minutes |
| `npm install` (cached) | 30-45 seconds | 20-90 seconds |
| `npm run dev` (cold start) | 3-5 seconds | 2-10 seconds |
| `npm run dev` (HMR update) | 100-300ms | 50ms-1s |
| `npm run build` | 25-30 seconds | 20-45 seconds |
| `npm run preview` | 1-2 seconds | 1-5 seconds |
| Homepage load (dev) | 1-2 seconds | 0.5-3 seconds |
| Homepage load (production) | 0.5-1 second | 0.3-2 seconds |

### If your timings are significantly worse:
1. Check disk I/O speed (use SSD not HDD)
2. Check antivirus software (whitelist node_modules)
3. Check available RAM (close other apps)
4. Check internet speed (slow downloads)

---

## 🛡️ Prevention Strategies

### Before Starting Development:

1. **System Check:**
   ```bash
   node --version    # Must be v20.x.x
   npm --version     # Must be 10.x.x
   git --version     # Any recent version
   ```

2. **Clean Workspace:**
   ```bash
   rm -rf node_modules package-lock.json .vite dist coverage
   ```

3. **Environment Setup:**
   ```bash
   cp .env.development .env
   cat .env | grep "VITE_DEVELOPMENT_MODE=true"
   ```

4. **Fresh Install:**
   ```bash
   npm cache clean --force
   npm install
   ```

5. **Verification:**
   ```bash
   npm run dev
   # Open http://localhost:5000
   # Verify homepage loads
   ```

### During Development:

1. **Never manually edit:**
   - `package-lock.json`
   - `node_modules/`
   - `.vite/` cache

2. **Always commit:**
   - `package.json`
   - `.env.development.example`
   - All source files

3. **Never commit:**
   - `node_modules/`
   - `.env` (actual secrets)
   - `dist/`
   - `coverage/`

4. **Before pushing changes:**
   ```bash
   npm run lint:fix
   npm run format
   npm run type-check
   npm run build
   ```

### Dependency Management:

1. **Adding new packages:**
   ```bash
   # Production dependency:
   npm install <package> --save
   
   # Development dependency:
   npm install <package> --save-dev
   
   # Always test after:
   npm run dev
   npm run build
   ```

2. **Updating packages:**
   ```bash
   # Check outdated:
   npm outdated
   
   # Update specific package:
   npm update <package>
   
   # NEVER update all at once:
   # npm update  # DON'T DO THIS
   ```

3. **Removing packages:**
   ```bash
   npm uninstall <package>
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 🎯 Success Criteria

Your local setup is **100% correct** if:

- ✅ `npm install` completes in < 8 minutes
- ✅ No red ERROR messages (warnings are OK)
- ✅ `npm run dev` starts in < 10 seconds
- ✅ `http://localhost:5000` shows Arabic homepage
- ✅ Homepage has car images and styled correctly
- ✅ Can navigate between pages
- ✅ `npm run build` succeeds in < 45 seconds
- ✅ `npm run preview` shows working site
- ✅ No blank white pages
- ✅ Browser console has no critical errors
- ✅ TypeScript shows no red errors in VS Code

---

## 📞 Support

If you still encounter issues after following this guide:

1. **Verify all prerequisites** are met
2. **Follow the exact steps** in order
3. **Check Node.js version** is 20.x.x
4. **Clear all caches** and reinstall
5. **Check antivirus/firewall** settings
6. **Try on a different network** (corporate firewalls can block npm)

### Last Resort Debug Checklist:

```bash
# System info
node --version
npm --version
git --version
echo $SHELL

# Project state
pwd
ls -la | grep -E "node_modules|package|.env"

# Clean slate
rm -rf node_modules package-lock.json .vite dist coverage
npm cache clean --force

# Fresh install with verbose output
npm install --verbose 2>&1 | tee install.log

# Check for errors
cat install.log | grep -i error
```

---

## 📝 Summary

This guide eliminates the 6-hour setup nightmare by:
1. ✅ Fixing PostCSS version conflicts
2. ✅ Aligning Vitest versions
3. ✅ Configuring proper development environment
4. ✅ Skipping AWS Amplify in development
5. ✅ Providing clear step-by-step instructions
6. ✅ Documenting all common issues and solutions
7. ✅ Setting correct expectations for timing
8. ✅ Providing AI agent guidelines

**Result:** Download → Install → Run in < 10 minutes with zero errors! 🎉
