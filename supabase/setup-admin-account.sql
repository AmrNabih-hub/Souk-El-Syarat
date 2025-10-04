-- ==========================================
-- SETUP ADMIN ACCOUNT FOR PRODUCTION
-- Email: soukalsayarat1@gmail.com
-- Password: Admin@2024!Souk
-- ==========================================

-- Step 1: Create admin user in auth.users (if not exists)
DO $$
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'soukalsayarat1@gmail.com'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
      'authenticated',
      'authenticated',
      'soukalsayarat1@gmail.com',
      crypt('Admin@2024!Souk', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin","display_name":"Admin Souk","full_name":"Admin Souk"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Admin user created successfully';
  ELSE
    -- Update existing user to ensure correct password and metadata
    UPDATE auth.users
    SET
      encrypted_password = crypt('Admin@2024!Souk', gen_salt('bf')),
      email_confirmed_at = NOW(),
      raw_user_meta_data = '{"role":"admin","display_name":"Admin Souk","full_name":"Admin Souk"}',
      updated_at = NOW()
    WHERE email = 'soukalsayarat1@gmail.com';
    
    RAISE NOTICE 'Admin user updated successfully';
  END IF;
END $$;

-- Step 2: Create/Update admin in public.users
INSERT INTO public.users (
  id,
  email,
  role,
  is_active,
  email_verified,
  phone_verified,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'soukalsayarat1@gmail.com',
  'admin',
  true,
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_active = true,
  email_verified = true,
  updated_at = NOW();

-- Step 3: Create/Update admin profile
INSERT INTO public.profiles (
  id,
  display_name,
  first_name,
  last_name,
  bio,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Admin Souk',
  'Admin',
  'Souk',
  'Platform Administrator - Full Access',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = 'Admin Souk',
  first_name = 'Admin',
  last_name = 'Souk',
  bio = 'Platform Administrator - Full Access',
  updated_at = NOW();

-- Step 4: Verify admin account
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT 
    u.id,
    u.email,
    u.role,
    u.is_active,
    u.email_verified,
    p.display_name,
    au.email_confirmed_at
  INTO admin_record
  FROM public.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE u.email = 'soukalsayarat1@gmail.com';

  IF admin_record IS NOT NULL THEN
    RAISE NOTICE '✅ Admin account verified:';
    RAISE NOTICE '   Email: %', admin_record.email;
    RAISE NOTICE '   Role: %', admin_record.role;
    RAISE NOTICE '   Active: %', admin_record.is_active;
    RAISE NOTICE '   Email Confirmed: %', admin_record.email_confirmed_at IS NOT NULL;
    RAISE NOTICE '   Display Name: %', admin_record.display_name;
  ELSE
    RAISE EXCEPTION 'Admin account verification failed!';
  END IF;
END $$;

-- ==========================================
-- ADMIN ACCOUNT READY FOR PRODUCTION USE
-- Login at: https://souk-al-sayarat.vercel.app/login
-- Email: soukalsayarat1@gmail.com
-- Password: Admin@2024!Souk
-- ==========================================
