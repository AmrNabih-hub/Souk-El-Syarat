-- 🗄️ Supabase Storage Buckets Configuration
-- Creates storage buckets for images and files

-- Car Listings Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'car-listings',
    'car-listings',
    true,  -- Public access
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Products Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    true,  -- Public access
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Vendor Documents Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vendor-documents',
    'vendor-documents',
    false,  -- Private access (admin only)
    10485760,  -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- User Avatars Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,  -- Public access
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- STORAGE POLICIES
-- ========================================

-- Car Listings Images Policies
CREATE POLICY "Anyone can view car listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-listings');

CREATE POLICY "Authenticated users can upload car listing images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'car-listings' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own car listing images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'car-listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own car listing images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'car-listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Products Images Policies
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Vendors can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'products' AND
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'vendor'
    )
);

CREATE POLICY "Vendors can update own product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'products' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'vendor'
    )
);

CREATE POLICY "Vendors can delete own product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'products' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'vendor'
    )
);

-- Vendor Documents Policies (Admin Only)
CREATE POLICY "Only admins can view vendor documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'vendor-documents' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Authenticated users can upload vendor documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'vendor-documents' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own vendor documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'vendor-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- User Avatars Policies
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Comments for documentation
COMMENT ON STORAGE.BUCKETS IS 'car-listings: Public bucket for customer car listing images';
COMMENT ON STORAGE.BUCKETS IS 'products: Public bucket for vendor product images';
COMMENT ON STORAGE.BUCKETS IS 'vendor-documents: Private bucket for vendor application documents';
COMMENT ON STORAGE.BUCKETS IS 'avatars: Public bucket for user profile avatars';
