# ⚡ Quick Start Guide - Souk El-Syarat

## 🎯 For Developers Who Want to Get Started NOW

### Prerequisites
- Node.js 20.x.x ([Download](https://nodejs.org/))
- npm 10.x.x (comes with Node.js)

### 3-Minute Setup

```bash
# 1. Verify versions
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# 2. Clone and enter directory
cd souk-el-syarat

# 3. Create environment file
cp .env.local.example .env

# 4. Install dependencies (takes 2-5 minutes)
npm install

# 5. Start development server
npm run dev

# 6. Open browser
# Visit: http://localhost:5000
```

### ✅ Success Indicators
- Development server starts in < 10 seconds
- Browser shows Arabic homepage with car images
- No blank white pages
- Hot reload works when you edit files

### ❌ If Something Goes Wrong

```bash
# Quick fix for 90% of issues:
rm -rf node_modules package-lock.json .vite
npm cache clean --force
npm install
npm run dev
```

### 📚 Need More Help?
- **Detailed guide**: See `LOCAL_DEVELOPMENT_GUIDE.md`
- **Environment setup**: See `.env.local.example`
- **Common issues**: Check `LOCAL_DEVELOPMENT_GUIDE.md` section 4

### 🚀 Quick Commands

```bash
# Development
npm run dev          # Start dev server (port 5000)

# Building
npm run build        # Production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check for errors
npm run lint:fix     # Auto-fix errors
npm run format       # Format code

# Testing
npm run test         # Run tests
npm run test:run     # Run tests once
```

### ⚠️ Critical Notes
1. **Always use Node.js 20.x.x** (not 18, not 21, not 22)
2. **.env file is required** (copy from .env.local.example)
3. **First install takes 2-5 minutes** (be patient)
4. **Port 5000 must be available** (kill other processes if needed)
5. **AWS warnings in console are normal** (app uses mock services locally)

### 🎨 What You'll See
- Arabic (RTL) car marketplace homepage
- Header with navigation
- Hero slider with car images
- Product categories
- Footer with links

### 🔧 Troubleshooting 1-Liners

| Problem | Solution |
|---------|----------|
| Blank page | Check .env file exists with `VITE_DEVELOPMENT_MODE=true` |
| Port in use | `lsof -ti:5000 \| xargs kill -9` (Mac/Linux) |
| npm install hangs | `npm cache clean --force` then retry |
| TypeScript errors | Wait 60 seconds after install, or restart editor |
| Build fails | `export NODE_OPTIONS="--max-old-space-size=4096"` |
| Peer warnings | Safe to ignore, or use `npm install --legacy-peer-deps` |

### 💡 Pro Tips
- Use VS Code for best experience
- Install ESLint and Prettier extensions
- Enable format on save
- Use Tailwind CSS IntelliSense extension
- Keep Node.js 20 LTS version

### 📞 Still Stuck?
Read the comprehensive guide: `LOCAL_DEVELOPMENT_GUIDE.md`

---

Made with ❤️ for Egyptian Car Marketplace
