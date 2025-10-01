# 🛡️ Error Prevention & Best Practices Guide
## Souk El-Sayarat - Preventing App Breakage

---

## 🎯 **Purpose**

This guide documents all lessons learned from past issues and provides actionable strategies to prevent repeated app broken states. It complements the AI_AGENT_DEVELOPMENT_GUIDE.md with specific focus on error prevention.

---

## 📋 **Table of Contents**

1. [Critical "Never Do" Rules](#critical-never-do-rules)
2. [Environment Configuration Rules](#environment-configuration-rules)
3. [TypeScript Best Practices](#typescript-best-practices)
4. [Dependency Management](#dependency-management)
5. [Build & Deploy Workflow](#build--deploy-workflow)
6. [Testing Requirements](#testing-requirements)
7. [Git Workflow](#git-workflow)
8. [Code Review Checklist](#code-review-checklist)
9. [Emergency Recovery Procedures](#emergency-recovery-procedures)
10. [Monitoring & Alerts](#monitoring--alerts)

---

## 🚫 **Critical "Never Do" Rules**

### 1. NEVER Modify These Files Without Review:

```bash
# ❌ DANGER ZONE - Requires expert review
package.json              # Dependency changes can break everything
package-lock.json        # Only regenerate via npm install
vite.config.ts          # Build configuration
tsconfig.json           # TypeScript configuration
tailwind.config.js      # Theme configuration
.gitignore              # May expose sensitive files

# ❌ NEVER TOUCH
.git/                   # Git internals
node_modules/           # Generated dependencies
```

### 2. NEVER Skip These Checks:

```bash
# ❌ NEVER commit without:
npm run type-check      # TypeScript errors
npm run lint           # Code quality issues
npm run build          # Build validation
npm run test           # Test suite

# ❌ NEVER deploy without:
# - Testing in development first
# - Verifying environment variables
# - Checking browser console for errors
# - Testing on mobile devices
```

### 3. NEVER Make These Changes:

```bash
# ❌ NEVER change React version without full testing
# ❌ NEVER change Vite version without verification
# ❌ NEVER change TypeScript version without checking all types
# ❌ NEVER change Tailwind version without testing styles
# ❌ NEVER remove error boundaries
# ❌ NEVER disable TypeScript strict mode
# ❌ NEVER commit credentials or API keys
# ❌ NEVER force push to production/main branches
```

---

## ⚙️ **Environment Configuration Rules**

### Rule 1: Always Use Environment Variables

```typescript
// ✅ CORRECT
const apiKey = import.meta.env.VITE_API_KEY;

// ❌ WRONG
const apiKey = "abc123..."; // Hardcoded!
```

### Rule 2: Validate Environment Variables

```typescript
// ✅ CORRECT - Use envConfig utility
import { envConfig } from '@/config/environment.config';

if (!envConfig.get('apiKey')) {
  throw new Error('API key not configured');
}

// ❌ WRONG - No validation
const apiKey = import.meta.env.VITE_API_KEY;
apiKey.toLowerCase(); // Might crash if undefined
```

### Rule 3: Provide Fallbacks

```typescript
// ✅ CORRECT
const enableFeature = envConfig.get('enableFeature') ?? false;

// ❌ WRONG
const enableFeature = envConfig.get('enableFeature'); // Might be undefined
```

### Rule 4: Never Mix Environments

```typescript
// ❌ WRONG - Using production config in development
if (process.env.NODE_ENV === 'development') {
  // But using VITE_AWS_PROD_ENDPOINT
}

// ✅ CORRECT - Environment-specific config
const endpoint = envConfig.isDevelopment() 
  ? envConfig.get('devEndpoint')
  : envConfig.get('prodEndpoint');
```

### Rule 5: Document All New Environment Variables

```bash
# When adding new variable:
# 1. Add to .env.development with example value
# 2. Add to .env.local.example with description
# 3. Add to environment.config.ts with validation
# 4. Document in README.md or relevant guide
```

---

## 📘 **TypeScript Best Practices**

### Rule 1: Always Define Interfaces

```typescript
// ✅ CORRECT
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): User {
  // ...
}

// ❌ WRONG
function getUserById(id: any): any {
  // Lost all type safety!
}
```

### Rule 2: Use Strict Null Checks

```typescript
// ✅ CORRECT
interface FormData {
  name: string;
  email: string;
  phone?: string; // Optional
}

// Handle optional properly
if (data.phone) {
  sendSMS(data.phone);
}

// ❌ WRONG
sendSMS(data.phone); // Might be undefined!
```

### Rule 3: Avoid `any` Type

```typescript
// ✅ CORRECT
interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ❌ WRONG
function handleResponse(response: any) {
  // Lost type information
}

// ✅ BETTER - Use unknown if type is truly unknown
function handleResponse(response: unknown) {
  if (typeof response === 'object' && response !== null) {
    // Type guard
  }
}
```

### Rule 4: Use Type Guards

```typescript
// ✅ CORRECT
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}

if (isUser(data)) {
  // Now TypeScript knows data is User
  console.log(data.name);
}
```

### Rule 5: Leverage Utility Types

```typescript
// ✅ CORRECT - Make all properties optional
type PartialUser = Partial<User>;

// ✅ CORRECT - Pick specific properties
type UserSummary = Pick<User, 'id' | 'name'>;

// ✅ CORRECT - Omit properties
type UserWithoutEmail = Omit<User, 'email'>;
```

---

## 📦 **Dependency Management**

### Rule 1: Version Pinning Strategy

```json
// ✅ CORRECT - Major version pinned, minor/patch flexible
{
  "dependencies": {
    "react": "^18.3.1",        // OK to update 18.x.x
    "vite": "^6.0.5"           // OK to update 6.x.x
  },
  "devDependencies": {
    "typescript": "^5.7.2"     // OK to update 5.x.x
  }
}

// ❌ WRONG - Too loose
{
  "dependencies": {
    "react": "*",              // Any version!
    "vite": "latest"           // Unpredictable!
  }
}

// ❌ WRONG - Too strict (unless necessary)
{
  "dependencies": {
    "react": "18.3.1",         // Can't update even for patches
    "postcss": "8.5.6"         // This caused 6-hour setup issue!
  }
}
```

### Rule 2: Update Procedure

```bash
# ✅ CORRECT - Safe update process
# 1. Check what's outdated
npm outdated

# 2. Update one dependency at a time
npm update react

# 3. Test after each update
npm run type-check
npm run build
npm run test
npm run dev  # Manual testing

# 4. Commit immediately after successful update
git add package.json package-lock.json
git commit -m "chore: update react to 18.3.2"

# ❌ WRONG - Update everything at once
npm update  # Multiple breaking changes at once!
```

### Rule 3: Peer Dependency Resolution

```json
// ✅ CORRECT - Use overrides for conflicts
{
  "overrides": {
    "postcss": "^8.4.47",    // Force all packages to use this
    "vitest": "^2.1.8"       // Sync with @vitest/* packages
  }
}
```

### Rule 4: Security Updates

```bash
# ✅ CORRECT - Regular security checks
npm audit

# Fix high/critical vulnerabilities immediately
npm audit fix

# For breaking changes, review manually
npm audit fix --force  # Only after review!
```

### Rule 5: Lock File Integrity

```bash
# ✅ CORRECT - Always commit lock file
git add package-lock.json
git commit -m "chore: update dependencies"

# ❌ WRONG - Regenerate lock file without reason
rm package-lock.json
npm install  # Creates different lock file

# ✅ CORRECT - Only regenerate if corrupted
npm ci  # Uses existing lock file
```

---

## 🏗️ **Build & Deploy Workflow**

### Pre-Deployment Checklist

```bash
# ✅ REQUIRED CHECKS (automated in CI/CD)

# 1. TypeScript compilation
npm run type-check
# ✅ Exit code: 0
# ❌ Exit code: non-zero → Fix errors!

# 2. Linting
npm run lint
# ✅ Warnings OK, no errors
# ❌ Errors → Fix immediately!

# 3. Build
npm run build
# ✅ Build successful
# ✅ Bundle size < 1MB
# ❌ Build failed → Check error logs

# 4. Tests
npm run test
# ✅ All tests pass
# ❌ Tests fail → Fix before deploying!

# 5. Manual testing
npm run preview
# ✅ App loads without errors
# ✅ Navigation works
# ✅ Forms submit correctly
# ✅ No console errors
```

### Deployment Environments

```bash
# Development (Local/Replit)
# - Uses mock services
# - Full logging enabled
# - Hot reload active
# - Port: 5000
npm run dev

# Staging (Pre-production)
# - Uses production build
# - Production-like data
# - Limited logging
# - Final testing ground
npm run build && npm run preview

# Production (AWS/Amplify)
# - Full production build
# - Real data and services
# - Minimal logging
# - Performance optimized
npm run build:production
```

### Rollback Procedure

```bash
# If deployment breaks:

# 1. Immediate rollback via git
git revert HEAD
git push origin production

# 2. Or restore to last known good commit
git reset --hard <last-good-commit>
git push --force origin production  # Use with caution!

# 3. Or use platform-specific rollback
# Replit: Use restore feature
# AWS Amplify: Redeploy previous version
# Vercel: Rollback in dashboard
```

---

## 🧪 **Testing Requirements**

### Rule 1: Test Critical Paths

```typescript
// ✅ REQUIRED TESTS

describe('Authentication', () => {
  it('should allow user to sign in', async () => {
    // Test implementation
  });

  it('should redirect to login if not authenticated', async () => {
    // Test implementation
  });

  it('should handle authentication errors', async () => {
    // Test implementation
  });
});

describe('Checkout', () => {
  it('should calculate total correctly', async () => {
    // Test implementation
  });

  it('should validate Egyptian phone numbers', async () => {
    // Test implementation
  });

  it('should prevent checkout with empty cart', async () => {
    // Test implementation
  });
});
```

### Rule 2: Test Before Commit

```bash
# ✅ CORRECT - Run tests before committing
npm run test
# All pass? ✅ OK to commit

git add .
git commit -m "feat: add new feature"

# ❌ WRONG - Commit without testing
git add .
git commit -m "feat: add new feature"
# Tests fail? ❌ Broken code in repo!
```

### Rule 3: Write Tests for Bug Fixes

```typescript
// ✅ CORRECT - Test-driven bug fix

// 1. Write test that reproduces the bug
it('should not crash when user object is null', () => {
  expect(() => renderComponent(null)).not.toThrow();
});

// 2. Fix the bug
function renderComponent(user: User | null) {
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

// 3. Test passes ✅
```

### Rule 4: Maintain Test Coverage

```bash
# ✅ CORRECT - Monitor coverage
npm run test:coverage

# Target: 80%+ coverage
# Critical paths: 100% coverage
# - Authentication
# - Checkout
# - Payment processing
# - Vendor workflows
```

---

## 🔀 **Git Workflow**

### Branch Strategy

```bash
# ✅ CORRECT - Feature branch workflow

# 1. Create feature branch from production
git checkout production
git pull origin production
git checkout -b feature/payment-gateway

# 2. Make changes and commit
git add .
git commit -m "feat: add payment gateway integration"

# 3. Push and create PR
git push origin feature/payment-gateway

# 4. After review and tests, merge to production
git checkout production
git merge feature/payment-gateway
git push origin production

# ❌ WRONG - Working directly on production
git checkout production
# Make changes
git commit -m "quick fix"  # Not reviewed!
```

### Commit Message Convention

```bash
# ✅ CORRECT - Semantic commit messages

feat: add live chat feature
fix: resolve checkout validation bug
chore: update dependencies
docs: improve setup instructions
style: format code with prettier
refactor: extract payment logic to service
test: add checkout tests
perf: optimize product search

# ❌ WRONG - Vague messages
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "changes"
```

### Rule: Never Force Push to Protected Branches

```bash
# ❌ DANGER - Never do this
git push --force origin production
git push --force origin main

# ✅ CORRECT - Use force push only on feature branches
git push --force origin feature/my-branch

# ✅ CORRECT - Revert instead of force push
git revert <commit-hash>
git push origin production
```

---

## ✅ **Code Review Checklist**

### Before Submitting PR:

```markdown
- [ ] Code compiles without TypeScript errors
- [ ] No ESLint errors (warnings OK)
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Environment variables documented
- [ ] No console.log in production code
- [ ] No commented-out code (unless intentional)
- [ ] No sensitive data (passwords, API keys)
- [ ] Mobile responsive tested
- [ ] Dark mode tested (if UI changes)
- [ ] Arabic RTL layout tested (if UI changes)
```

### Reviewer Checklist:

```markdown
- [ ] Code follows project conventions
- [ ] Type safety maintained
- [ ] Error handling appropriate
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Tests adequate and meaningful
- [ ] Documentation clear and complete
- [ ] Changes don't break existing features
```

---

## 🚨 **Emergency Recovery Procedures**

### Scenario 1: App Won't Start After Dependency Update

```bash
# Step 1: Restore package files
git checkout HEAD -- package.json package-lock.json

# Step 2: Clean install
rm -rf node_modules
npm cache clean --force
npm install

# Step 3: Verify
npm run dev

# If still broken:
# Step 4: Check environment
cat .env  # Verify all required variables

# Step 5: Check for global issues
node --version  # Should be 20.x
npm --version   # Should be 10.x
```

### Scenario 2: Build Suddenly Fails

```bash
# Step 1: Check for errors
npm run build 2>&1 | tee build-error.log

# Step 2: Common fixes
# - Clear cache
rm -rf dist
rm -rf node_modules/.vite

# - Regenerate lock file
rm package-lock.json
npm install

# - Check TypeScript
npm run type-check

# Step 3: Bisect to find breaking commit
git bisect start
git bisect bad                    # Current commit is bad
git bisect good <last-good-commit>
# Test each commit
npm run build
git bisect good|bad
# Repeat until culprit found
```

### Scenario 3: Runtime Errors After Deployment

```bash
# Step 1: Check browser console
# Look for:
# - Missing environment variables
# - Failed API calls
# - Module import errors

# Step 2: Compare environments
# Development vs Production differences?

# Step 3: Rollback immediately
git revert HEAD
git push origin production

# Step 4: Fix locally
npm run build:production
npm run preview
# Verify fix works

# Step 5: Redeploy
git add .
git commit -m "fix: resolve production error"
git push origin production
```

### Scenario 4: White Screen / Blank Page

```bash
# Most common causes:

# 1. AWS Amplify configuration error
# Check: .env has VITE_SKIP_AMPLIFY_CONFIG=true

# 2. JavaScript error preventing render
# Check: Browser console for errors

# 3. Missing environment variables
# Check: All required VITE_* variables set

# 4. Build optimization issue
# Try: npm run build -- --mode development

# 5. Service worker conflict
# Clear: Application > Storage > Clear site data
```

---

## 📊 **Monitoring & Alerts**

### Key Metrics to Monitor:

```typescript
// 1. Error Rate
// Alert if: > 1% of requests fail
// Check: Browser console, error tracking service

// 2. Build Time
// Alert if: > 3 minutes
// Check: CI/CD logs
// Current: ~90 seconds ✅

// 3. Bundle Size
// Alert if: > 1MB gzipped
// Check: npm run analyze
// Current: 314KB ✅

// 4. Page Load Time
// Alert if: > 3 seconds
// Check: Lighthouse, Core Web Vitals
// Target: < 2 seconds

// 5. Test Coverage
// Alert if: < 70%
// Check: npm run test:coverage
// Current: ~20-30% ⚠️

// 6. TypeScript Errors
// Alert if: > 0
// Check: npm run type-check
// Current: 0 ✅

// 7. ESLint Errors
// Alert if: > 10
// Check: npm run lint
// Current: 175 ⚠️
```

### Automated Checks (CI/CD):

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      # If any step fails, block merge
```

---

## 🎯 **Prevention vs Cure**

### Investment in Prevention:

```
Time spent preventing issues: 20% effort
Time saved fixing issues later: 80% effort saved

Prevention ROI: 4x

Examples:
- Writing tests upfront: 1 hour → Saves 4 hours debugging
- Type-safe interfaces: 30 minutes → Saves 2 hours runtime errors
- Environment validation: 15 minutes → Saves 3 hours debugging
- Code review: 30 minutes → Saves 5 hours rework
```

### Prevention Checklist:

```markdown
✅ TypeScript strict mode enabled
✅ ESLint configured and enforced
✅ Pre-commit hooks (future)
✅ CI/CD pipeline (future)
✅ Error boundaries in place
✅ Environment validation
✅ Comprehensive documentation
✅ Testing framework configured
✅ Code review process
✅ Version control hygiene
```

---

## 📚 **Quick Reference**

### Before Every Commit:

```bash
npm run type-check && npm run lint && npm run test
```

### Before Every PR:

```bash
npm run type-check && \
npm run lint && \
npm run test && \
npm run build
```

### Before Every Deployment:

```bash
npm run type-check && \
npm run lint:ci && \
npm run test:coverage && \
npm run build:production && \
npm run preview  # Manual testing
```

### Daily Development Workflow:

```bash
# Morning:
git pull origin production
npm install  # If package.json changed
npm run dev

# During work:
# - Save frequently
# - Check browser console
# - Test changes manually

# Before lunch/end of day:
npm run type-check
git add .
git commit -m "..."
git push origin feature/branch
```

---

## 🏆 **Success Metrics**

### Zero Incidents Goal:

```markdown
Target: < 1 production incident per month

Measures:
- ✅ Zero TypeScript errors (achieved)
- ✅ Zero build failures (achieved)
- ⏳ 80%+ test coverage (in progress)
- ⏳ < 50 ESLint errors (in progress)
- ⏳ CI/CD with automated checks (planned)
- ⏳ Error monitoring in production (planned)

Current Status: 
- Stable development environment ✅
- Production-ready codebase ✅
- Clear error prevention strategies ✅
- Comprehensive documentation ✅
```

---

## 🎓 **Learning from Past Issues**

### Issue #1: 6-Hour Local Setup (RESOLVED)
**Cause:** Hard-pinned PostCSS and Vitest version mismatches
**Solution:** Flexible version ranges + overrides
**Prevention:** Document dependency management rules
**Lesson:** Version pinning can cause more problems than it solves

### Issue #2: Blank Page on Startup (RESOLVED)
**Cause:** AWS Amplify configuration required in development
**Solution:** Environment flags + graceful degradation
**Prevention:** Feature flags for external services
**Lesson:** Always provide fallbacks for external dependencies

### Issue #3: TypeScript Errors Blocking Development (RESOLVED)
**Cause:** Type mismatches in forms and components
**Solution:** Proper type definitions and validation
**Prevention:** TypeScript strict mode + proper interfaces
**Lesson:** Invest time in proper types upfront

---

## 🚀 **Next Steps**

### Immediate (This Week):
1. Set up pre-commit hooks (Husky + lint-staged)
2. Configure CI/CD pipeline (GitHub Actions)
3. Add error monitoring (Sentry)
4. Increase test coverage to 40%+

### Short-term (This Month):
1. Resolve all ESLint errors
2. Replace `any` types with proper types
3. Add integration tests
4. Set up automated deployments

### Long-term (This Quarter):
1. Achieve 80%+ test coverage
2. Implement performance monitoring
3. Add security scanning
4. Create runbook for common issues

---

**Document Version:** 1.0  
**Last Updated:** October 1, 2025  
**Next Review:** October 8, 2025  
**Maintained By:** Development Team

---

**Remember:** An ounce of prevention is worth a pound of cure! 🛡️


