# 🤖 AI Agent Local Setup Checklist

## Purpose
This checklist ensures AI assistants can help users set up this project locally without errors or confusion.

---

## 📋 Pre-Setup Validation

### Step 1: Verify User Environment
```bash
# Check Node.js version
node --version
# MUST be: v20.x.x (not 18, not 21, not 22, not 23)

# Check npm version
npm --version
# MUST be: 10.x.x or higher

# Check git
git --version
# Any recent version is OK
```

**If Node.js is wrong version:**
- Direct user to https://nodejs.org/en/download/
- Or suggest: `nvm install 20 && nvm use 20`
- Never suggest other versions

---

## 📦 Installation Process

### Step 2: Clean Environment
```bash
# Navigate to project
cd souk-el-syarat

# Clean any existing artifacts
rm -rf node_modules package-lock.json dist coverage .vite

# Verify clean state
ls -la | grep -E "node_modules|package-lock"
# Should return nothing
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.local.example .env

# Verify file exists and has correct content
cat .env | grep "VITE_DEVELOPMENT_MODE"
# MUST show: VITE_DEVELOPMENT_MODE=true
```

**Critical .env Variables:**
- `VITE_DEVELOPMENT_MODE=true` - REQUIRED
- `VITE_SKIP_AMPLIFY_CONFIG=true` - REQUIRED
- `VITE_USE_MOCK_SERVICES=true` - REQUIRED

### Step 4: Install Dependencies
```bash
# Standard installation
npm install

# Expected duration: 2-5 minutes
# Expected final message: "✅ Dependencies installed successfully"
```

**If installation fails:**
```bash
# Try clean cache
npm cache clean --force
npm install

# If still fails, try legacy peer deps
npm install --legacy-peer-deps

# If still fails, check Node.js version again
```

### Step 5: Start Development Server
```bash
npm run dev

# Expected output within 10 seconds:
# VITE v6.x.x ready in XXX ms
# ➜  Local:   http://localhost:5000/
```

**If server fails to start:**
- Check if port 5000 is in use
- Check .env file exists
- Check node_modules was installed

### Step 6: Verify in Browser
```bash
# Open browser to:
http://localhost:5000

# Expected to see:
# - Arabic text (right-to-left layout)
# - Car images in hero section
# - Navigation header
# - Styled content (NOT blank white page)
```

---

## ✅ Success Verification Checklist

Mark each item when verified:

- [ ] Node.js version is 20.x.x
- [ ] npm version is 10.x.x or higher
- [ ] .env file exists with VITE_DEVELOPMENT_MODE=true
- [ ] npm install completed without fatal errors
- [ ] node_modules directory exists and has ~1.5GB size
- [ ] npm run dev starts in < 10 seconds
- [ ] Browser shows Arabic homepage with styling
- [ ] No blank white pages
- [ ] No infinite loading spinners
- [ ] Console shows "[vite] connected" message
- [ ] Hot reload works (edit file, see changes)

---

## 🚫 Common Mistakes to Avoid

### DO NOT Suggest:
1. ❌ Using Node.js 18, 21, 22, or any version other than 20
2. ❌ Using yarn or pnpm (use npm only)
3. ❌ Modifying package.json dependency versions
4. ❌ Removing .env file or changing critical variables
5. ❌ Installing global packages unless absolutely necessary
6. ❌ Upgrading to React 19
7. ❌ Disabling skipLibCheck in tsconfig.json
8. ❌ Changing vite.config.ts port from 5000
9. ❌ Suggesting Firebase setup (not needed for local dev)
10. ❌ Removing postinstall script from package.json

### DO Suggest:
1. ✅ Using Node.js 20 LTS
2. ✅ Clearing cache if installation fails
3. ✅ Checking .env file exists
4. ✅ Using --legacy-peer-deps for peer warnings
5. ✅ Increasing Node memory for build issues
6. ✅ Killing processes on port 5000 if in use
7. ✅ Reading LOCAL_DEVELOPMENT_GUIDE.md for details
8. ✅ Waiting 60 seconds after install for TypeScript
9. ✅ Restarting editor if TypeScript shows errors
10. ✅ Using VS Code with recommended extensions

---

## 🔍 Troubleshooting Decision Tree

```
User reports issue
    |
    ├─ "npm install hangs/slow"
    |   → npm cache clean --force
    |   → npm install --legacy-peer-deps
    |
    ├─ "Blank white page"
    |   → Check .env exists
    |   → Check VITE_DEVELOPMENT_MODE=true
    |   → Clear browser cache
    |   → Restart dev server
    |
    ├─ "TypeScript errors"
    |   → Wait 60 seconds after install
    |   → Restart TypeScript server in editor
    |   → Confirm Node.js 20.x.x
    |
    ├─ "Build fails with memory error"
    |   → export NODE_OPTIONS="--max-old-space-size=4096"
    |   → npm run build
    |
    ├─ "Port 5000 in use"
    |   → lsof -ti:5000 | xargs kill -9 (Mac/Linux)
    |   → netstat -ano | findstr :5000 (Windows)
    |
    ├─ "AWS Amplify errors"
    |   → EXPECTED in development
    |   → Check .env has VITE_SKIP_AMPLIFY_CONFIG=true
    |   → No action needed
    |
    └─ "Other issue"
        → Read LOCAL_DEVELOPMENT_GUIDE.md section 4
        → Check Node.js version is exactly 20.x.x
        → Verify all steps followed in order
```

---

## 📝 Response Templates

### When Installation Succeeds:
```
Great! Your setup is complete. You should now see:
- Development server running on http://localhost:5000
- Arabic car marketplace homepage with images and styling
- Hot reload working when you edit files

Next steps:
- Start editing files in src/
- Changes will appear automatically in browser
- Check LOCAL_DEVELOPMENT_GUIDE.md for more details
```

### When Installation Fails:
```
Let's fix this. Please run these commands in order:

1. Verify Node.js version:
   node --version
   (Must be v20.x.x)

2. Clean and retry:
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install --legacy-peer-deps

3. If still failing, share the error message you see.
```

### When Blank Page Appears:
```
The blank page issue is usually caused by missing .env file. Let's fix it:

1. Verify .env file exists:
   cat .env | head -5

2. If file doesn't exist, create it:
   cp .env.local.example .env

3. Verify critical variable:
   cat .env | grep "VITE_DEVELOPMENT_MODE"
   (Should show: VITE_DEVELOPMENT_MODE=true)

4. Restart server:
   npm run dev

5. Clear browser cache and refresh.
```

---

## 🎯 Expected Timings

### For AI to Set Expectations:

| Operation | Normal | Maximum | Action if Exceeded |
|-----------|--------|---------|-------------------|
| npm install (first) | 3 min | 8 min | Clear cache, retry |
| npm install (cached) | 45 sec | 2 min | Check network |
| npm run dev (start) | 5 sec | 15 sec | Check port, restart |
| npm run build | 28 sec | 45 sec | Increase Node memory |
| Homepage load | 1 sec | 3 sec | Check browser cache |

---

## 🔐 Security Notes for AI

### Never Suggest:
- Disabling security features
- Committing .env file to git
- Using production credentials in development
- Exposing sensitive data in environment variables
- Running npm as root/admin

### Always Recommend:
- Using .env.local.example as template
- Keeping secrets out of version control
- Using mock services for local development
- Validating user input
- Following principle of least privilege

---

## 📚 Documentation Hierarchy

When user asks for help, direct them to appropriate docs:

1. **Quick answer needed**: Use QUICK_START.md
2. **Setup problems**: Use LOCAL_DEVELOPMENT_GUIDE.md section 4
3. **Environment config**: Show .env.local.example
4. **General overview**: Use README.md
5. **Architecture details**: Use replit.md

---

## 🎓 Learning Points for AI

### This Project Teaches:
1. PostCSS version pinning causes Tailwind conflicts
2. Vitest version must match @vitest/* packages
3. AWS Amplify can be optional in development
4. Peer dependency warnings are often harmless
5. Node.js version matters significantly
6. Environment configuration is critical
7. Documentation prevents support burden

### Apply These Lessons to Other Projects:
- Always check for version locks in dependencies
- Verify test framework versions align
- Make external services optional in dev
- Document known warnings
- Specify exact Node.js versions
- Create comprehensive .env templates
- Write troubleshooting guides proactively

---

## ✅ Final Validation

Before marking user's setup as complete:

```bash
# Run full validation
npm run dev &
sleep 5
curl -s http://localhost:5000 | grep -q "سوق السيارات" && echo "✅ SUCCESS" || echo "❌ FAILED"
kill %1

# Run build test
npm run build && echo "✅ BUILD SUCCESS" || echo "❌ BUILD FAILED"
```

**Only confirm success if:**
- Dev server starts without errors
- Homepage contains Arabic text
- Build completes successfully
- No critical errors in console

---

## 🚀 Quick Reference Commands

```bash
# Clean install
rm -rf node_modules package-lock.json .vite && npm cache clean --force && npm install

# Verify versions
node --version && npm --version

# Check environment
cat .env | grep "VITE_DEVELOPMENT_MODE"

# Start fresh
npm run dev

# Check port
lsof -ti:5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Build test
npm run build

# Full validation
npm run lint && npm run type-check && npm run build
```

---

**Remember**: Your goal is to get the user from download to working app in < 10 minutes with zero frustration.
