# 🚀 Local Development Setup Guide

## Souk El-Syarat - Complete Local Installation Instructions

This guide ensures **100% successful local setup** with zero errors. Follow these steps exactly.

---

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 20.x (LTS) - **CRITICAL**
- **npm**: Version 10.x or higher (comes with Node 20)
- **Git**: Latest version

### Check Your Versions
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

If you don't have Node 20, download it from [nodejs.org](https://nodejs.org/) or use a version manager:

**Using nvm (Mac/Linux):**
```bash
nvm install 20
nvm use 20
```

**Using nvm-windows (Windows):**
```cmd
nvm install 20
nvm use 20
```

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd Souk-El-Syarat
```

### Step 2: Configure Environment (CRITICAL)

**For Windows (PowerShell or CMD):**
```cmd
setx PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
```
Close and reopen your terminal after running this command.

**For Mac/Linux (Terminal):**
```bash
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Add to your shell profile for persistence
echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # or source ~/.zshrc
```

**Why this matters:** Without this, Playwright will download 300-500MB of browsers, causing the "6-hour installation" problem.

### Step 3: Install Dependencies

**Clean installation (recommended):**
```bash
# Remove any existing installations
rm -rf node_modules package-lock.json   # Mac/Linux
rd /s /q node_modules & del package-lock.json  # Windows

# Install with clean cache
npm ci
```

**Or use regular install:**
```bash
npm install
```

⏱️ **Expected time:** 5-10 minutes (with Playwright skip enabled)

### Step 4: Run the Development Server
```bash
npm run dev
```

The app will open at: **http://localhost:5000**

---

## 🎯 Development Modes

### Mock Data Mode (Default - Recommended)
The app runs with **mock data** by default in development. No backend required!

- Products load from `src/data/enhanced-products.ts`
- Authentication uses localStorage simulation
- No AWS/Firebase configuration needed

### Production Mode Testing
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "npm install takes forever"
**Cause:** Playwright downloading browsers

**Solution:**
```bash
# Set the environment variable (see Step 2 above)
# Then clean reinstall
rm -rf node_modules package-lock.json
npm ci
```

### Issue 2: "Port 5000 is already in use"
**Solution:**
```bash
# Find and kill the process on port 5000
# Mac/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue 3: "Empty marketplace page"
**Cause:** Mock data not loading properly

**Solution:**
- Ensure you're using the latest code (includes fixed product.service.ts)
- Check browser console for errors (F12)
- Verify `.env.development` has `VITE_USE_MOCK_DATA=true`

### Issue 4: "Module not found" errors
**Solution:**
```bash
# Clear all caches and reinstall
rm -rf node_modules package-lock.json .vite dist
npm ci
```

### Issue 5: "TypeScript errors during build"
**Solution:**
```bash
# Type check without building
npm run type-check

# Build with type checking disabled (temporary)
npm run build:ci
```

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5000)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues automatically
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Testing
npm run test             # Run tests in watch mode
npm run test:unit        # Run unit tests once
npm run test:e2e         # Run end-to-end tests (requires browsers)
npm run test:coverage    # Generate coverage report

# Maintenance
npm run clean            # Remove build artifacts
```

---

## 🏗️ Project Structure

```
souk-el-syarat/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API and business logic
│   ├── data/           # Mock data for development
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # Zustand state stores
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
├── dist/               # Production build (generated)
└── node_modules/       # Dependencies (generated)
```

---

## 🔐 Environment Configuration

### Development (.env.development)
Already configured with mock data settings. **No changes needed** for local development.

### Production (.env.production)
Create this file when deploying:
```env
VITE_NODE_ENV=production
VITE_USE_MOCK_DATA=false
VITE_AWS_REGION=your-region
VITE_AWS_USER_POOLS_ID=your-pool-id
# ... other production settings
```

---

## 🚫 What NOT to Do

❌ **Don't run** `npm install` without setting `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`  
❌ **Don't modify** `package-lock.json` manually  
❌ **Don't commit** `node_modules/` or `dist/` folders  
❌ **Don't use** Node versions below 20 or above 21  
❌ **Don't skip** the environment variable setup  

---

## ✅ Production Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` successfully
- [ ] Test with `npm run preview`
- [ ] Configure production environment variables
- [ ] Update Firebase/AWS credentials
- [ ] Run `npm run test:coverage` (>80% coverage)
- [ ] Check bundle size: `npm run analyze`
- [ ] Verify all API endpoints work
- [ ] Test on multiple browsers

---

## 🆘 Getting Help

### For AI Agents Working on This Project

**Important Instructions:**

1. **Always check Node version first**: Must be 20.x
2. **Always set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD**: Before any npm install
3. **Mock data is enabled by default**: Don't try to configure AWS/Firebase for basic development
4. **Port 5000 is required**: Don't change it - Replit and local setup both use 5000
5. **Don't create duplicate configs**: Single `vite.config.ts` handles all modes
6. **TypeScript strict mode is disabled for builds**: Use `npm run type-check:ci` for CI/CD

### For Human Developers

1. **Check this guide first** before asking questions
2. **Look at browser console** (F12) for client-side errors
3. **Check terminal output** for build/server errors
4. **Review .env.development** if data isn't loading
5. **Clear cache and reinstall** if weird errors occur

---

## 🎓 Learning Resources

- [Vite Documentation](https://vitejs.dev/)
- [React 18 Guide](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📝 Troubleshooting Checklist

Run through this if you encounter issues:

```bash
# 1. Verify Node version
node --version  # Must be 20.x

# 2. Check environment variable
echo $PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD  # Should be 1

# 3. Clean everything
rm -rf node_modules package-lock.json .vite dist

# 4. Reinstall
npm ci

# 5. Run dev server
npm run dev

# 6. Open browser
# Navigate to http://localhost:5000
```

If all else fails, this sequence solves 99% of issues.

---

## 🌟 Success Indicators

You'll know everything is working when:

✅ Server starts in under 10 seconds  
✅ App loads at `http://localhost:5000`  
✅ Homepage shows car marketplace with hero slider  
✅ Navigation works (marketplace, vendors, etc.)  
✅ Mock products display in marketplace page  
✅ No console errors (minor warnings OK)  
✅ Build completes in under 30 seconds  

---

## 📊 Performance Benchmarks

Expected performance on a modern machine:

| Task | Expected Time |
|------|---------------|
| `npm ci` (first time) | 5-10 minutes |
| `npm ci` (with cache) | 1-3 minutes |
| `npm run dev` startup | 5-10 seconds |
| `npm run build` | 20-30 seconds |
| Page load (dev) | 1-2 seconds |
| Page load (prod) | < 1 second |

---

**Last Updated:** September 2025  
**Tested On:** Node 20.19.3, npm 10.8.2  
**Status:** ✅ Production Ready

---

For questions or issues not covered here, check the main [README.md](./README.md) or create an issue on GitHub.
