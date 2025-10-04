/**
 * 🚀 QUICK MIGRATION - Copy & Paste into Supabase SQL Editor
 * 
 * This adds the 3 missing tables needed for new features:
 * 1. car_listings
 * 2. vendor_applications  
 * 3. admin_logs
 * 
 * SAFE TO RUN: Uses CREATE TABLE IF NOT EXISTS
 * Can be run multiple times without errors
 * 
 * HOW TO USE:
 * 1. Go to: https://zgnwfnfehdwehuycbcsz.supabase.co/project/zgnwfnfehdwehuycbcsz/editor
 * 2. Click "SQL Editor"
 * 3. Copy ALL of this file
 * 4. Paste in SQL Editor
 * 5. Click "Run"
 * 6. Done!
 */

-- ============================================================
-- 1. CAR LISTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.car_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  mileage integer NOT NULL CHECK (mileage >= 0),
  transmission text NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type text NOT NULL,
  color text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('excellent', 'very_good', 'good', 'fair', 'needs_work')),
  asking_price numeric NOT NULL CHECK (asking_price > 0),
  negotiable boolean DEFAULT true,
  urgent_sale boolean DEFAULT false,
  description text NOT NULL,
  features text[] DEFAULT '{}',
  seller_name text NOT NULL,
  phone_number text NOT NULL,
  whatsapp_number text,
  location jsonb NOT NULL,
  has_ownership_papers boolean DEFAULT false,
  has_service_history boolean DEFAULT false,
  has_insurance boolean DEFAULT false,
  images text[] DEFAULT '{}',
  available_for_inspection boolean DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id),
  review_comments text,
  product_id uuid REFERENCES public.products(id),
  agreed_to_terms boolean NOT NULL DEFAULT false,
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_listings_user_id ON public.car_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON public.car_listings(status);
CREATE INDEX IF NOT EXISTS idx_car_listings_submitted_at ON public.car_listings(submitted_at DESC);

ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own car listings" ON public.car_listings;
CREATE POLICY "Users can view own car listings"
  ON public.car_listings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create car listings" ON public.car_listings;
CREATE POLICY "Users can create car listings"
  ON public.car_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending listings" ON public.car_listings;
CREATE POLICY "Users can update own pending listings"
  ON public.car_listings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can view all car listings" ON public.car_listings;
CREATE POLICY "Admins can view all car listings"
  ON public.car_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all car listings" ON public.car_listings;
CREATE POLICY "Admins can update all car listings"
  ON public.car_listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 2. VENDOR APPLICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('dealership', 'parts_supplier', 'service_center', 'individual_seller', 'other')),
  description text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  whatsapp_number text,
  address jsonb NOT NULL,
  business_license text,
  tax_id text,
  website text,
  social_media jsonb,
  experience text,
  specializations text[] DEFAULT '{}',
  expected_monthly_volume text,
  documents text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id),
  review_comments text,
  vendor_id uuid REFERENCES public.vendors(id),
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_submitted_at ON public.vendor_applications(submitted_at DESC);

ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.vendor_applications;
CREATE POLICY "Users can view own applications"
  ON public.vendor_applications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create applications" ON public.vendor_applications;
CREATE POLICY "Users can create applications"
  ON public.vendor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending applications" ON public.vendor_applications;
CREATE POLICY "Users can update own pending applications"
  ON public.vendor_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can view all applications" ON public.vendor_applications;
CREATE POLICY "Admins can view all applications"
  ON public.vendor_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all applications" ON public.vendor_applications;
CREATE POLICY "Admins can update all applications"
  ON public.vendor_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 3. ADMIN LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view admin logs" ON public.admin_logs;
CREATE POLICY "Only admins can view admin logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only admins can create admin logs" ON public.admin_logs;
CREATE POLICY "Only admins can create admin logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_car_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_car_listings_timestamp ON public.car_listings;
CREATE TRIGGER update_car_listings_timestamp
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_car_listings_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendor_applications_timestamp ON public.vendor_applications;
CREATE TRIGGER update_vendor_applications_timestamp
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_applications_updated_at();

CREATE OR REPLACE FUNCTION create_vendor_from_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.vendors (
      user_id, business_name, business_type, description,
      contact_person, email, phone_number, whatsapp_number,
      address, business_license, tax_id, website, social_media,
      experience, specializations, expected_monthly_volume,
      status, approved_by, approved_at
    ) VALUES (
      NEW.user_id, NEW.business_name, NEW.business_type::vendor_business_type, NEW.description,
      NEW.contact_person, NEW.email, NEW.phone_number, NEW.whatsapp_number,
      NEW.address, NEW.business_license, NEW.tax_id, NEW.website, NEW.social_media,
      NEW.experience, NEW.specializations, NEW.expected_monthly_volume,
      'active', NEW.reviewed_by, NEW.reviewed_at
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO NEW.vendor_id;

    UPDATE public.users SET role = 'vendor' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_vendor_on_approval ON public.vendor_applications;
CREATE TRIGGER create_vendor_on_approval
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_vendor_from_application();

-- ============================================================
-- DONE!
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added tables:';
  RAISE NOTICE '  1. car_listings (with RLS policies)';
  RAISE NOTICE '  2. vendor_applications (with RLS policies)';
  RAISE NOTICE '  3. admin_logs (with RLS policies)';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables use CREATE TABLE IF NOT EXISTS';
  RAISE NOTICE 'Safe to run multiple times';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database is ready!';
END $$;
