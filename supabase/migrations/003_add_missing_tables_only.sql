/**
 * 🔧 Add Missing Tables for New Features
 * Only adds tables that don't exist in current schema
 * 
 * Missing Tables:
 * 1. car_listings - For "Sell Your Car" feature
 * 2. vendor_applications - For vendor registration flow
 * 3. admin_logs - For admin action tracking
 */

-- ============================================================
-- 1. CAR LISTINGS TABLE (For "Sell Your Car" Feature)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.car_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Car Information
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  mileage integer NOT NULL CHECK (mileage >= 0),
  transmission text NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type text NOT NULL,
  color text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('excellent', 'very_good', 'good', 'fair', 'needs_work')),
  
  -- Pricing
  asking_price numeric NOT NULL CHECK (asking_price > 0),
  negotiable boolean DEFAULT true,
  urgent_sale boolean DEFAULT false,
  
  -- Details
  description text NOT NULL,
  features text[] DEFAULT '{}',
  
  -- Seller Information
  seller_name text NOT NULL,
  phone_number text NOT NULL,
  whatsapp_number text,
  location jsonb NOT NULL, -- {governorate, city, area}
  
  -- Documentation
  has_ownership_papers boolean DEFAULT false,
  has_service_history boolean DEFAULT false,
  has_insurance boolean DEFAULT false,
  
  -- Media
  images text[] DEFAULT '{}',
  
  -- Availability
  available_for_inspection boolean DEFAULT true,
  
  -- Status & Review
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id),
  review_comments text,
  
  -- Product Link (after approval)
  product_id uuid REFERENCES public.products(id),
  
  -- Legal
  agreed_to_terms boolean NOT NULL DEFAULT false,
  
  -- Timestamps
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_car_listings_user_id ON public.car_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON public.car_listings(status);
CREATE INDEX IF NOT EXISTS idx_car_listings_submitted_at ON public.car_listings(submitted_at DESC);

-- RLS Policies
ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own listings
CREATE POLICY "Users can view own car listings"
  ON public.car_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own listings
CREATE POLICY "Users can create car listings"
  ON public.car_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending listings
CREATE POLICY "Users can update own pending listings"
  ON public.car_listings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all listings
CREATE POLICY "Admins can view all car listings"
  ON public.car_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all listings
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
  
  -- Business Information
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('dealership', 'parts_supplier', 'service_center', 'individual_seller', 'other')),
  description text NOT NULL,
  
  -- Contact Information
  contact_person text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  whatsapp_number text,
  address jsonb NOT NULL, -- {street, city, governorate, country}
  
  -- Business Details
  business_license text,
  tax_id text,
  website text,
  social_media jsonb, -- {facebook, instagram, twitter, linkedin}
  
  -- Experience & Specialization
  experience text,
  specializations text[] DEFAULT '{}',
  expected_monthly_volume text,
  
  -- Documents
  documents text[] DEFAULT '{}', -- URLs to uploaded documents
  
  -- Application Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id),
  review_comments text,
  
  -- Vendor Link (after approval)
  vendor_id uuid REFERENCES public.vendors(id),
  
  -- Timestamps
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_submitted_at ON public.vendor_applications(submitted_at DESC);

-- RLS Policies
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.vendor_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create applications
CREATE POLICY "Users can create applications"
  ON public.vendor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications"
  ON public.vendor_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.vendor_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON public.vendor_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 3. ADMIN LOGS TABLE (For Audit Trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Action Details
  action text NOT NULL, -- e.g., 'approve_car_listing', 'reject_vendor_application'
  target_type text NOT NULL, -- e.g., 'car_listing', 'vendor_application', 'user'
  target_id uuid NOT NULL,
  
  -- Additional Information
  details jsonb, -- Any additional context
  ip_address inet,
  user_agent text,
  
  -- Timestamp
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Only admins can view admin logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert logs
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

-- Update updated_at timestamp for car_listings
CREATE OR REPLACE FUNCTION update_car_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_car_listings_timestamp
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_car_listings_updated_at();

-- Update updated_at timestamp for vendor_applications
CREATE OR REPLACE FUNCTION update_vendor_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_applications_timestamp
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_applications_updated_at();

-- Auto-create vendor when application is approved
CREATE OR REPLACE FUNCTION create_vendor_from_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Create vendor record
    INSERT INTO public.vendors (
      user_id,
      business_name,
      business_type,
      description,
      contact_person,
      email,
      phone_number,
      whatsapp_number,
      address,
      business_license,
      tax_id,
      website,
      social_media,
      experience,
      specializations,
      expected_monthly_volume,
      status,
      approved_by,
      approved_at
    ) VALUES (
      NEW.user_id,
      NEW.business_name,
      NEW.business_type::vendor_business_type,
      NEW.description,
      NEW.contact_person,
      NEW.email,
      NEW.phone_number,
      NEW.whatsapp_number,
      NEW.address,
      NEW.business_license,
      NEW.tax_id,
      NEW.website,
      NEW.social_media,
      NEW.experience,
      NEW.specializations,
      NEW.expected_monthly_volume,
      'active',
      NEW.reviewed_by,
      NEW.reviewed_at
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO NEW.vendor_id;

    -- Update user role to vendor
    UPDATE public.users
    SET role = 'vendor'
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_vendor_on_approval
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_vendor_from_application();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.car_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vendor_applications TO authenticated;
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;

-- Grant access to service role (for admin operations)
GRANT ALL ON public.car_listings TO service_role;
GRANT ALL ON public.vendor_applications TO service_role;
GRANT ALL ON public.admin_logs TO service_role;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added 3 missing tables:';
  RAISE NOTICE '   1. car_listings - For "Sell Your Car" feature';
  RAISE NOTICE '   2. vendor_applications - For vendor registration';
  RAISE NOTICE '   3. admin_logs - For admin action tracking';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Added RLS policies for security';
  RAISE NOTICE '✅ Added triggers for automation';
  RAISE NOTICE '✅ Added indexes for performance';
END $$;
