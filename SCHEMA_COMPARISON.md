# 📊 SCHEMA COMPARISON & MIGRATION GUIDE

**Current Status**: Your existing schema vs. What's needed

---

## ✅ EXISTING TABLES (Already in Supabase)

You already have these 8 tables:

1. ✅ `users` - Base user accounts
2. ✅ `profiles` - User profile information
3. ✅ `vendors` - Vendor information
4. ✅ `products` - Product catalog
5. ✅ `orders` - Order management
6. ✅ `order_items` - Order line items
7. ✅ `favorites` - User favorites
8. ✅ `notifications` - User notifications

**Status**: ✅ **NO CHANGES NEEDED** to existing tables!

---

## ❌ MISSING TABLES (Need to Add)

You're missing **3 critical tables** for the new features:

### 1. `car_listings` ❌
**Purpose**: "Sell Your Car" feature  
**Why You Need It**: 
- Customers submit their used cars for sale
- Admin reviews and approves/rejects
- After approval, converts to product

**Fields**:
- Car details (make, model, year, mileage, etc.)
- Pricing & condition
- Seller contact info
- Images & documentation
- Review status & comments

---

### 2. `vendor_applications` ❌
**Purpose**: Vendor registration flow  
**Why You Need It**:
- Users apply to become vendors
- Submit business information
- Admin reviews applications
- Auto-creates vendor account on approval

**Fields**:
- Business information
- Contact details
- Documents & licenses
- Review status
- Link to created vendor

---

### 3. `admin_logs` ❌
**Purpose**: Admin action tracking  
**Why You Need It**:
- Audit trail for all admin actions
- Security & compliance
- Track who approved/rejected what
- Investigate issues

**Fields**:
- Admin ID
- Action type
- Target (what was affected)
- Timestamp & IP
- Details (JSON)

---

## 🔧 WHAT YOU NEED TO DO

### Option 1: Run New Migration (Recommended) ✅

I've created a **minimal migration** that adds only the 3 missing tables:

```bash
# File: supabase/migrations/003_add_missing_tables_only.sql

# This migration:
✅ Adds ONLY the 3 missing tables
✅ Doesn't touch your existing tables
✅ Includes all RLS policies
✅ Includes triggers for automation
✅ Safe to run on existing database
```

**To run it**:

```bash
# Option A: Automated
npm run setup:supabase

# Option B: Manual
# 1. Go to Supabase Dashboard
# 2. Open SQL Editor
# 3. Copy contents of: supabase/migrations/003_add_missing_tables_only.sql
# 4. Paste and click "Run"
```

---

### Option 2: Use Existing Migration (Alternative)

Your original migration file `002_car_listings_and_applications.sql` has these tables, but it might try to create things you already have.

**Not recommended** because it could conflict with existing tables.

---

## 🎯 DETAILED COMPARISON

### car_listings Table

```sql
CREATE TABLE public.car_listings (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  
  -- Car Info
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  mileage integer NOT NULL,
  transmission text NOT NULL,
  
  -- Pricing
  asking_price numeric NOT NULL,
  negotiable boolean DEFAULT true,
  
  -- Status
  status text DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid REFERENCES users(id),
  review_comments text,
  
  -- Link to product after approval
  product_id uuid REFERENCES products(id),
  
  -- Timestamps
  submitted_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

**RLS Policies**:
- ✅ Users can view/edit their own listings
- ✅ Admins can view/edit all listings
- ✅ Regular users can't see others' listings

**Triggers**:
- ✅ Auto-update `updated_at` timestamp
- ✅ Can be extended to notify admin on new submission

---

### vendor_applications Table

```sql
CREATE TABLE public.vendor_applications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  
  -- Business Info
  business_name text NOT NULL,
  business_type text NOT NULL,
  description text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  
  -- Status
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id),
  review_comments text,
  
  -- Link to vendor after approval
  vendor_id uuid REFERENCES vendors(id),
  
  -- Timestamps
  submitted_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

**RLS Policies**:
- ✅ Users can view/edit their own applications
- ✅ Admins can view/edit all applications

**Triggers**:
- ✅ Auto-update `updated_at` timestamp
- ✅ **Auto-create vendor** when application approved
- ✅ **Auto-update user role** to 'vendor'

---

### admin_logs Table

```sql
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY,
  admin_id uuid REFERENCES users(id),
  
  -- Action Details
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  
  -- Context
  details jsonb,
  ip_address inet,
  user_agent text,
  
  -- Timestamp
  created_at timestamp with time zone
);
```

**RLS Policies**:
- ✅ Only admins can view logs
- ✅ Only admins can create logs

**No Triggers**: Simple audit log, just inserts

---

## 🚀 MIGRATION STEPS

### Step 1: Backup (Safety First!)

```sql
-- In Supabase SQL Editor, you can export:
-- Go to: Table Editor → Export as CSV (optional)
```

### Step 2: Run Migration

```bash
# Automated:
npm run setup:supabase

# Manual:
# Copy supabase/migrations/003_add_missing_tables_only.sql
# Paste in Supabase SQL Editor
# Click "Run"
```

### Step 3: Verify Tables Created

```sql
-- Check if tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('car_listings', 'vendor_applications', 'admin_logs');

-- Should return 3 rows
```

### Step 4: Verify RLS Policies

```sql
-- Check policies:
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('car_listings', 'vendor_applications', 'admin_logs');

-- Should return multiple policies
```

---

## ✅ AFTER MIGRATION

You'll have a complete schema with:

### Existing Tables (8):
- ✅ users
- ✅ profiles
- ✅ vendors
- ✅ products
- ✅ orders
- ✅ order_items
- ✅ favorites
- ✅ notifications

### New Tables (3):
- ✅ car_listings
- ✅ vendor_applications
- ✅ admin_logs

**Total**: 11 tables for a complete marketplace!

---

## 🔍 WHAT EACH FEATURE NEEDS

### "Sell Your Car" Feature:
**Tables Used**:
- `users` (existing) - User authentication
- `car_listings` (new) - Car submission & review
- `products` (existing) - After approval, create product
- `admin_logs` (new) - Track admin approval/rejection

**Flow**:
1. Customer submits car → `car_listings` (status: pending)
2. Admin reviews → Update `car_listings.status`
3. Admin approves → Create record in `products`
4. Log action → Insert in `admin_logs`

---

### Vendor Registration:
**Tables Used**:
- `users` (existing) - User authentication
- `vendor_applications` (new) - Application submission
- `vendors` (existing) - Vendor account
- `admin_logs` (new) - Track admin actions

**Flow**:
1. User applies → `vendor_applications` (status: pending)
2. Admin reviews → Update `vendor_applications.status`
3. Admin approves → Trigger auto-creates `vendors` record
4. Trigger updates → `users.role` to 'vendor'
5. Log action → Insert in `admin_logs`

---

### Admin Dashboard:
**Tables Used**:
- `car_listings` (new) - Pending car submissions
- `vendor_applications` (new) - Pending vendor applications
- `admin_logs` (new) - Audit trail
- All existing tables for management

---

## 🎯 BOTTOM LINE

**Your Schema**:
- ✅ Base tables: **Complete**
- ❌ Feature tables: **Missing 3**

**Action Required**:
1. Run migration: `003_add_missing_tables_only.sql`
2. Verify tables created
3. Test features

**Time**: 2 minutes  
**Risk**: Very low (only adds new tables)

---

**Next Step**: Run the migration now!

```bash
npm run setup:supabase
```

Or manually in Supabase SQL Editor!
