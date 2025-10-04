-- 🚗 Car Listings & Vendor Applications Tables
-- Adds support for "Sell Your Car" flow and vendor application system

-- Car listings table (for "Sell Your Car" feature)
CREATE TABLE IF NOT EXISTS car_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Car Information
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    transmission TEXT NOT NULL CHECK (transmission IN ('automatic', 'manual')),
    fuel_type TEXT NOT NULL,
    color TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('excellent', 'very_good', 'good', 'fair', 'needs_work')),
    asking_price DECIMAL(12,2) NOT NULL CHECK (asking_price > 0),
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    
    -- Seller Information
    seller_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT,
    location JSONB NOT NULL,
    
    -- Documentation
    has_ownership_papers BOOLEAN NOT NULL DEFAULT false,
    has_service_history BOOLEAN NOT NULL DEFAULT false,
    has_insurance BOOLEAN NOT NULL DEFAULT false,
    registration_location TEXT,
    
    -- Additional Details
    reason_for_selling TEXT,
    negotiable BOOLEAN NOT NULL DEFAULT true,
    available_for_inspection BOOLEAN NOT NULL DEFAULT true,
    urgent_sale BOOLEAN NOT NULL DEFAULT false,
    preferred_contact_time TEXT,
    
    -- Status & Review
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    review_comments TEXT,
    
    -- Product Reference (after approval)
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Images
    images JSONB DEFAULT '[]',
    
    -- Terms
    agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendor applications table
CREATE TABLE IF NOT EXISTS vendor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Information
    business_name TEXT NOT NULL,
    business_type business_type NOT NULL,
    description TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT,
    address JSONB NOT NULL,
    
    -- Business Documents
    business_license TEXT,
    tax_id TEXT,
    website TEXT,
    social_media JSONB,
    
    -- Business Details
    experience TEXT NOT NULL,
    specializations TEXT[] DEFAULT '{}',
    expected_monthly_volume TEXT,
    
    -- Document URLs
    documents JSONB DEFAULT '[]',
    
    -- Application Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    applied_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    
    -- Vendor Reference (after approval)
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, business_name)
);

-- Admin audit logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'car_listing', 'vendor_application', 'product', 'user', etc.
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_car_listings_user_id ON car_listings(user_id);
CREATE INDEX idx_car_listings_status ON car_listings(status);
CREATE INDEX idx_car_listings_created_at ON car_listings(created_at DESC);
CREATE INDEX idx_car_listings_make_model ON car_listings(make, model);
CREATE INDEX idx_car_listings_year ON car_listings(year);
CREATE INDEX idx_car_listings_price ON car_listings(asking_price);

CREATE INDEX idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX idx_vendor_applications_applied_date ON vendor_applications(applied_date DESC);
CREATE INDEX idx_vendor_applications_business_type ON vendor_applications(business_type);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_target_type ON admin_logs(target_type);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Create updated_at triggers
CREATE TRIGGER update_car_listings_updated_at
    BEFORE UPDATE ON car_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_applications_updated_at
    BEFORE UPDATE ON vendor_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Car Listings Policies
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own car listings"
    ON car_listings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create car listings"
    ON car_listings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending car listings"
    ON car_listings FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all car listings"
    ON car_listings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update car listings"
    ON car_listings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Vendor Applications Policies
ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vendor applications"
    ON vendor_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create vendor applications"
    ON vendor_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending applications"
    ON vendor_applications FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all vendor applications"
    ON vendor_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update vendor applications"
    ON vendor_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin Logs Policies
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin logs"
    ON admin_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can create admin logs"
    ON admin_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Helper functions

-- Function to automatically create vendor record after application approval
CREATE OR REPLACE FUNCTION create_vendor_from_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status changed to 'approved' and vendor_id is NULL
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.vendor_id IS NULL THEN
        -- Insert into vendors table
        INSERT INTO vendors (
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
            NEW.business_type,
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
            NEW.reviewed_date
        )
        RETURNING id INTO NEW.vendor_id;
        
        -- Update user role to vendor
        UPDATE users SET role = 'vendor' WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create vendor after application approval
CREATE TRIGGER create_vendor_after_approval
    BEFORE UPDATE ON vendor_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_vendor_from_application();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        auth.uid(),
        p_action,
        p_target_type,
        p_target_id,
        p_details
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE car_listings IS 'Stores customer car listings from "Sell Your Car" feature';
COMMENT ON TABLE vendor_applications IS 'Stores vendor registration applications';
COMMENT ON TABLE admin_logs IS 'Audit trail for admin actions';
COMMENT ON FUNCTION create_vendor_from_application() IS 'Automatically creates vendor record when application is approved';
COMMENT ON FUNCTION log_admin_action(TEXT, TEXT, UUID, JSONB) IS 'Logs admin actions for audit trail';
