# 🔐 Admin Account Credentials

**CRITICAL - PRODUCTION ADMIN ACCOUNT**

---

## Admin Account Details

**Email**: `soukalsayarat1@gmail.com`  
**Password**: `Admin@2024!Souk`  
**Role**: `admin`  
**Status**: Active  
**Created**: October 2024

---

## Login Instructions

1. Go to: https://souk-al-sayarat.vercel.app/login
2. Enter email: `soukalsayarat1@gmail.com`
3. Enter password: `Admin@2024!Souk`
4. Click "Login"
5. Should redirect to: `/admin/dashboard`

---

## Admin Access

The admin account should have access to:
- ✅ Admin Dashboard (`/admin/dashboard`)
- ✅ All user data
- ✅ All vendor data
- ✅ Vendor application approvals
- ✅ Car listing approvals
- ✅ Platform analytics
- ✅ Admin logs

---

## Setup in Supabase

### 1. Create Admin User (if not exists):
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'soukalsayarat1@gmail.com',
  crypt('Admin@2024!Souk', gen_salt('bf')),
  NOW(),
  '{"role": "admin", "display_name": "Admin Souk"}',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
```

### 2. Create Admin Profile:
```sql
-- Get the user ID first
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'soukalsayarat1@gmail.com';

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'soukalsayarat1@gmail.com',
    'admin',
    true,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    email_verified = true;

  -- Insert into profiles
  INSERT INTO public.profiles (
    id,
    display_name,
    bio,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Admin Souk',
    'Platform Administrator',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    display_name = 'Admin Souk',
    bio = 'Platform Administrator';
END $$;
```

---

## Verification Steps

### Test Admin Login:
1. Clear browser cache
2. Go to login page
3. Enter credentials
4. Verify redirect to admin dashboard
5. Check dashboard shows real data (not placeholders)

### Check Admin Permissions:
```sql
-- Verify admin user exists
SELECT 
  u.id,
  u.email,
  u.role,
  u.is_active,
  p.display_name
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'soukalsayarat1@gmail.com';
```

---

## Security Notes

⚠️ **IMPORTANT**:
- This is a production admin account
- Keep credentials secure
- Do not share publicly
- Change password periodically
- Monitor admin logs for suspicious activity

---

## Troubleshooting

### If Login Fails:
1. Verify email is confirmed in Supabase Auth
2. Check user exists in `public.users` with role='admin'
3. Check RLS policies allow admin access
4. Check browser console for errors

### If Redirects Incorrectly:
1. Verify `user_metadata.role` is set to 'admin'
2. Check `public.users.role` is 'admin'
3. Clear session and login again

---

**Status**: ✅ READY FOR PRODUCTION USE
