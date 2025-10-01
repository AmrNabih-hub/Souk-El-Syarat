# AI Agent Development Guide - Souk El-Syarat Marketplace
## Professional QA Standards & Environment Configuration

> **Purpose**: This guide ensures AI agents can work with this codebase without causing environment or configuration errors, maintaining app stability across local, Replit, and production deployments.

---

## 🎯 Quick Start Checklist

### Before Making ANY Changes:
- [ ] Read `replit.md` for project overview and recent changes
- [ ] Check `src/config/environment.config.ts` for current environment setup
- [ ] Review `.env.development` for active feature flags
- [ ] Verify the app is running: `npm run dev`
- [ ] Check for LSP errors before starting work

### Critical Rules:
1. **NEVER** modify `.git` files or run destructive git commands
2. **NEVER** change core config files without understanding the full impact
3. **ALWAYS** use the existing environment configuration system
4. **ALWAYS** test changes in development before suggesting production deployment
5. **ALWAYS** maintain backward compatibility with existing features

---

## 📁 Project Structure & Architecture

### Core Directories
```
src/
├── config/               # Environment configuration (DO NOT MODIFY without review)
│   └── environment.config.ts  # Centralized env management
├── services/            # Business logic & API calls
│   ├── vendor-application.service.ts  # Vendor workflow
│   ├── car-listing.service.ts        # Car listing workflow
│   ├── auth.service.ts               # Authentication
│   └── order.service.ts              # Order management
├── stores/              # Zustand state management
├── components/          # React components
├── pages/              # Page components
└── utils/              # Helper functions
```

### Configuration Files (Handle with Care)
- `.env.development` - Development settings (**DEFAULT** for local work)
- `.env.production` - Production settings (require AWS credentials)
- `vite.config.ts` - Build configuration (already optimized)
- `tsconfig.json` - TypeScript configuration (already configured)

---

## 🔧 Environment Configuration Guide

### Current Environment System

The app uses a **three-tier environment system**:

1. **Development** (Local & Replit default)
   - Uses mock data for stability
   - No AWS dependencies required
   - Real-time features disabled by default
   - Full console logging enabled

2. **Production** (AWS Amplify)
   - Requires AWS Amplify configuration
   - Real data from GraphQL APIs
   - Real-time features available
   - Minimal console logging

3. **Test** (CI/CD)
   - Automated testing environment
   - Mock data and services
   - No external dependencies

### Environment Variables Reference

```bash
# ✅ SAFE TO MODIFY (Development)
VITE_ENABLE_REAL_TIME=false         # WebSocket real-time features
VITE_ENABLE_ANALYTICS=false         # Analytics tracking
VITE_USE_MOCK_AUTH=true            # Mock authentication
VITE_USE_MOCK_DATA=true            # Mock products/orders
VITE_LOG_LEVEL=debug               # Logging verbosity

# ⚠️ MODIFY WITH CAUTION (Features)
VITE_ENABLE_DARK_MODE=true         # Dark mode support
VITE_ENABLE_ANIMATIONS=true        # Framer Motion animations
VITE_DEFAULT_LANGUAGE=ar           # Default language (ar/en)

# 🔒 DO NOT MODIFY (Production Only)
VITE_AWS_REGION=                   # AWS region (production)
VITE_AWS_USER_POOLS_ID=            # Cognito pool (production)
VITE_AWS_APPSYNC_GRAPHQL_ENDPOINT= # AppSync endpoint (production)
```

### How to Check Current Environment

```typescript
import { envConfig } from '@/config/environment.config';

// Check environment
envConfig.isDevelopment();  // true in development
envConfig.isProduction();   // true in production
envConfig.isReplit();       // true on Replit

// Check feature flags
envConfig.isFeatureEnabled('enableRealTime');
envConfig.get('useMockAuth');

// Print configuration summary
envConfig.printSummary();
```

---

## 🚨 Common Pitfalls & How to Avoid Them

### 1. Blank Page / White Screen Errors

**Cause**: AWS Amplify configuration errors in development

**Solution**:
```bash
# Ensure these are set in .env.development
VITE_SKIP_AMPLIFY_CONFIG=true
VITE_USE_MOCK_SERVICES=true
VITE_USE_MOCK_AUTH=true
```

**Prevention**: Always check the browser console for Amplify errors

### 2. TypeScript Errors on npm install

**Cause**: Strict TypeScript checks or version mismatches

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If errors persist, check tsconfig.json
# Ensure skipLibCheck is enabled for development
```

**Prevention**: Never modify `tsconfig.json` strict settings without understanding impact

### 3. Vite Build Failures

**Cause**: Incorrect import paths or missing dependencies

**Solution**:
```bash
# Check import paths use @ alias
import { Component } from '@/components/...'  # ✅ Correct
import { Component } from '../../../components/...'  # ❌ Avoid

# Verify all dependencies are installed
npm install
```

**Prevention**: Use path aliases consistently

### 4. Real-time Features Not Working

**Cause**: WebSocket service disabled by default

**Solution**:
```bash
# Enable in .env.development (only if needed)
VITE_ENABLE_REAL_TIME=true
```

**Prevention**: Check `VITE_ENABLE_REAL_TIME` before debugging real-time issues

### 5. Mock Data vs Real Data Confusion

**Cause**: Services switch between mock and real based on environment

**Solution**:
```typescript
// Services automatically handle this
// In development: uses mock data
// In production: uses real APIs

// To force real data in development:
VITE_USE_MOCK_DATA=false  // Set in .env.development
```

**Prevention**: Check `envConfig.get('useMockData')` to understand current mode

---

## 🔐 Security Best Practices

### Secrets Management
```bash
# ❌ NEVER hardcode secrets
const apiKey = "abc123...";  # WRONG

# ✅ Use environment variables
const apiKey = import.meta.env.VITE_API_KEY;

# ✅ For sensitive operations, use Replit integrations
# Check available integrations with search_integrations tool
```

### Authentication
```typescript
// ✅ Use centralized auth service
import { useAuthStore } from '@/stores/authStore';

const { user, signIn, signOut } = useAuthStore();

// ❌ Don't implement custom auth logic
// The app has a complete auth system
```

---

## 🏗️ Adding New Features

### Step-by-Step Process

1. **Understand Existing Architecture**
   ```bash
   # Read relevant service files
   src/services/*

   # Check existing components
   src/components/*
   ```

2. **Follow Existing Patterns**
   - Use Zustand for state management
   - Services handle business logic
   - Components are presentational
   - Real-time via WebSocket service

3. **Add Environment Configuration (if needed)**
   ```typescript
   // In environment.config.ts
   myNewFeature: this.parseBoolean(env.VITE_MY_FEATURE, false),
   ```

4. **Test in Development First**
   ```bash
   npm run dev
   # Verify no console errors
   # Test feature functionality
   ```

5. **Update Documentation**
   - Add to `replit.md` under "Recent Changes"
   - Document any new environment variables

### Example: Adding a New Service

```typescript
// src/services/my-new.service.ts
import { realTimeService } from './realtime-websocket.service';
import { REALTIME_EVENTS } from '@/constants/realtime-events';
import { sendEmail } from '@/utils/replitmail';

class MyNewService {
  async performAction(data: any): Promise<string> {
    // 1. Perform business logic
    const result = await this.process(data);
    
    // 2. Emit real-time event (if needed)
    try {
      realTimeService.sendMessage(REALTIME_EVENTS.MY_EVENT, {
        ...result
      });
    } catch (error) {
      console.warn('Real-time notification failed:', error);
    }
    
    // 3. Send email notification (if needed)
    try {
      await sendEmail({
        to: 'admin@soukel-syarat.com',
        subject: 'New Action',
        html: '<p>Action completed</p>',
        text: 'Action completed'
      });
    } catch (error) {
      console.warn('Email notification failed:', error);
    }
    
    return result.id;
  }
}

export const myNewService = new MyNewService();
```

---

## 🧪 Testing Guidelines

### Pre-Deployment Checks
```bash
# 1. TypeScript type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Build test
npm run build

# 4. Check bundle size
npm run analyze
```

### Browser Testing
- Test in Chrome (primary)
- Test in Firefox
- Test in Safari (if available)
- Test mobile responsiveness

### Error Monitoring
```typescript
// Check browser console for:
- Red errors (must fix)
- Yellow warnings (review)
- Amplify warnings (expected in dev)
```

---

## 📊 Performance Best Practices

### Code Splitting
```typescript
// ✅ Lazy load pages
const MyPage = lazy(() => import('@/pages/MyPage'));

// ❌ Don't lazy load critical components
// (Navbar, Layout, etc.)
```

### State Management
```typescript
// ✅ Use Zustand stores
import { useAppStore } from '@/stores/appStore';

// ❌ Avoid prop drilling
// ❌ Avoid excessive useState in components
```

### API Calls
```typescript
// ✅ Use existing services
import { ProductService } from '@/services/product.service';

// ✅ Services handle caching and error handling
const products = await ProductService.getProducts();

// ❌ Don't make direct API calls from components
```

---

## 🚀 Deployment Configuration

### Replit Deployment (Autoscale)

**Already Configured** - No changes needed:
```bash
# Build command
npm run build:production

# Run command  
npx vite preview --host 0.0.0.0 --port 5000

# Port: 5000 (required for Replit)
```

### AWS Amplify Deployment

**Requires Configuration**:
1. Set production environment variables in `.env.production`
2. Configure AWS Amplify (region, pools, endpoints)
3. Run: `npm run build:production`
4. Deploy via Amplify console

### Vercel/Netlify Deployment

**Build Settings**:
```bash
Build Command: npm run build:production
Output Directory: dist
Install Command: npm install
```

---

## 🐛 Debugging Workflow

### When Something Breaks:

1. **Check Browser Console**
   ```
   F12 → Console tab
   Look for red errors
   Note the file and line number
   ```

2. **Check Environment Config**
   ```typescript
   import { envConfig } from '@/config/environment.config';
   envConfig.printSummary();  // In browser console
   ```

3. **Check LSP Diagnostics**
   ```bash
   # VS Code: Check "Problems" panel
   # Errors show file, line, and description
   ```

4. **Check Workflow Logs**
   ```bash
   # In Replit: Check workflow console
   # Look for startup errors
   # Check port binding (must be 5000)
   ```

5. **Verify Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

---

## 📝 Workflow Patterns

### Vendor Application Workflow
```
1. User submits application → vendorApplicationService.submitApplication()
2. Service emits real-time event → REALTIME_EVENTS.VENDOR_APPLICATION
3. Service sends email to admin
4. Admin reviews in dashboard
5. Admin approves/rejects → vendorApplicationService.approveApplication() / rejectApplication()
6. Service emits event → REALTIME_EVENTS.VENDOR_APPROVED / VENDOR_REJECTED
7. Service sends email to vendor
```

### Car Listing Workflow
```
1. Customer submits listing → carListingService.submitListing()
2. Service emits real-time event → REALTIME_EVENTS.CAR_LISTING_CREATED
3. Service sends email to admin
4. Admin reviews (UI pending implementation)
5. Admin approves/rejects → carListingService.approveListing() / rejectListing()
6. Service emits event → REALTIME_EVENTS.CAR_LISTING_APPROVED / REJECTED
7. Service sends email to customer
```

---

## ⚙️ Critical Files - Do Not Modify

### Never Touch These Without Expert Review:
- `.git/*` - Git repository files
- `package-lock.json` - Dependency lock (regenerate via npm install)
- `node_modules/*` - Dependencies (regenerate via npm install)

### Modify With Extreme Caution:
- `vite.config.ts` - Already optimized for Replit
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependency management
- `tailwind.config.js` - Theme configuration

### Safe to Modify:
- `src/*` - Application code (follow patterns)
- `.env.development` - Development settings
- `replit.md` - Project documentation

---

## 🎓 Learning Resources

### Understanding the Codebase
1. Start with `replit.md` - Project overview
2. Read `src/config/environment.config.ts` - Environment setup
3. Explore `src/services/*` - Business logic
4. Study `src/stores/*` - State management
5. Review `src/components/*` - UI components

### Key Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **AWS Amplify** - Backend (production)

---

## ✅ Pre-Deployment Checklist

Before completing any task:

- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] App builds successfully (`npm run build`)
- [ ] App runs without console errors (`npm run dev`)
- [ ] Changes documented in `replit.md`
- [ ] Environment variables documented (if added)
- [ ] Real-time events added to constants (if applicable)
- [ ] Services follow existing patterns
- [ ] Components are responsive
- [ ] Dark mode works (if UI changes)
- [ ] Arabic RTL layout works (if UI changes)

---

## 🆘 Emergency Recovery

### If You Break Something:

1. **Revert Changes**
   ```bash
   # User can use Replit's rollback feature
   # Or restore from last checkpoint
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Reset Environment**
   ```bash
   # Copy from example
   cp .env.development.example .env.development
   ```

4. **Restart Workflow**
   ```bash
   # Replit: Stop and restart workflow
   # Or: npm run dev
   ```

---

## 📞 Getting Help

### Before Asking for Help:
1. Check this guide
2. Read error messages carefully
3. Check browser console
4. Review `replit.md` for recent changes
5. Verify environment configuration

### When Reporting Issues:
- Share exact error message
- Share browser console output
- Share relevant code snippet
- Share environment settings (`envConfig.printSummary()`)

---

## 🎯 Success Criteria

**You're ready to work on this codebase if you can**:
- [ ] Start the app without errors
- [ ] Understand the environment system
- [ ] Follow existing code patterns
- [ ] Add features without breaking existing ones
- [ ] Write code that works in all environments
- [ ] Debug issues using proper tools
- [ ] Document changes appropriately

---

*Last Updated: October 2025*
*Maintained by: Souk El-Syarat Development Team*
