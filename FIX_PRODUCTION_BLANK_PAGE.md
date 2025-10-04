# 🚨 FIX: Production Blank Page (Preview Works)

**Problem**: Preview deployments work, but production shows blank page  
**Root Cause**: Environment variables not set for Production environment in Vercel

---

## ✅ SOLUTION: Set Environment Variables for Production

### Go to Vercel Dashboard:

https://vercel.com/amrs-projects-fd281155/souk-al-sayarat/settings/environment-variables

---

## 🔧 CRITICAL: Check Each Variable's Environment Selection

For **EACH** variable, you need to check **which environments** it's enabled for:

### ⚠️ COMMON MISTAKE:

When you add a variable, Vercel shows checkboxes:
```
☐ Production
☐ Preview  
☐ Development
```

**If you only checked Preview/Development, Production will be BLANK!**

---

## 🎯 STEP-BY-STEP FIX

### 1. Check ALL Variables Have Production Enabled:

Go through **EACH** of these variables and **EDIT** them:

#### Required for ALL Environments (Production + Preview + Development):

1. **VITE_SUPABASE_URL**
   ```
   Value: https://zgnwfnfehdwehuycbcsz.supabase.co
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

2. **VITE_SUPABASE_ANON_KEY**
   ```
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDMxMDAsImV4cCI6MjA3NTA3OTEwMH0.4nYLZq-ZkvoidVwL6RM24xMvXDCVbYBVaYSS3mD-uc0
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

3. **VITE_ENABLE_EMAIL_VERIFICATION**
   ```
   Value: true
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

4. **VITE_ENABLE_OAUTH**
   ```
   Value: true
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

5. **VITE_ENABLE_REALTIME**
   ```
   Value: true
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

6. **VITE_APP_NAME**
   ```
   Value: Souk El-Sayarat
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

#### Production ONLY:

7. **SUPABASE_SERVICE_ROLE_KEY**
   ```
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMzEwMCwiZXhwIjoyMDc1MDc5MTAwfQ.iYtkGB_bAwm5VGcQmJWZ-abeUbm79GTLijDOcYyaKW4
   ✅ Production ONLY
   ❌ Preview (uncheck)
   ❌ Development (uncheck)
   ```

8. **VITE_APP_ENV**
   ```
   Value: production
   ✅ Production ONLY
   ```

9. **VITE_APP_URL**
   ```
   Value: https://souk-al-sayarat.vercel.app
   ✅ Production ONLY
   ```

---

## 🔍 HOW TO VERIFY EACH VARIABLE

For each variable:

1. Click on the variable row (not the delete button)
2. Look at the **"Environments"** section
3. Make sure the correct boxes are checked
4. Click **"Save"**

**Example**:
```
Variable: VITE_SUPABASE_URL
Value: https://zgnwfnfehdwehuycbcsz.supabase.co

Environments:
  ✅ Production       ← MUST BE CHECKED!
  ✅ Preview
  ✅ Development

[Cancel] [Save]
```

---

## 🚀 AFTER FIXING ALL VARIABLES

### Force Redeploy WITHOUT Cache:

1. Go to: https://vercel.com/amrs-projects-fd281155/souk-al-sayarat
2. Click **"Deployments"** tab
3. Find the **latest deployment**
4. Click **"..."** (three dots menu)
5. Click **"Redeploy"**
6. ⚠️ **UNCHECK** "Use existing Build Cache"
7. Click **"Redeploy"**

This forces Vercel to:
- Use the new environment variables
- Rebuild from scratch
- Deploy to production with correct config

---

## 🔎 ALTERNATIVE: Quick Check via CLI

If you have Vercel CLI installed:

```bash
# Install if needed
npm i -g vercel

# Login
vercel login

# Check environment variables
vercel env ls

# Should show variables for each environment
```

---

## ✅ AFTER DEPLOYMENT (2-3 min)

### Test Production URL:

Visit: https://souk-al-sayarat.vercel.app

**Open Console (F12)** and look for:

```
🔍 Environment check:
- VITE_SUPABASE_URL from env: https://zgnwfnfehdwehuycbcsz.supabase.co
- VITE_SUPABASE_ANON_KEY from env: ✅ Set
✅ Supabase client configured successfully
```

**If you still see "undefined"**, the variables aren't set for Production!

---

## 🎯 QUICK CHECKLIST

```
☐ 1. Go to Vercel environment variables settings
☐ 2. For EACH variable, click to edit
☐ 3. Verify "Production" is checked
☐ 4. Save each variable
☐ 5. Go to Deployments tab
☐ 6. Redeploy latest (uncheck cache)
☐ 7. Wait 2-3 minutes
☐ 8. Test production URL
☐ 9. Check console for debug logs
```

---

## 🚨 IF STILL BLANK AFTER THIS

Then we know the fallback credentials in the code aren't working either.

**Run this to verify the code has fallbacks**:

```bash
grep -A 2 "VITE_SUPABASE_URL ||" src/config/supabase.config.ts
```

Should show:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zgnwfnfehdwehuycbcsz.supabase.co';
```

If not, the code wasn't deployed yet. Check deployment status.

---

## 📊 EXPECTED BEHAVIOR

| Environment | URL Pattern | Status |
|------------|-------------|--------|
| Preview | `souk-al-sayarat-*.vercel.app` | ✅ Works |
| Production | `souk-al-sayarat.vercel.app` | Should work after fix |

---

**ACTION**: Check environment variable settings NOW and make sure Production is checked for all required variables!
