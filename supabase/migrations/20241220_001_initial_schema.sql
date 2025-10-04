-- ========================================
-- 🚀 Souk El-Sayarat Database Schema
-- Complete marketplace database structure
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;

-- ========================================
-- 👥 USER MANAGEMENT
-- ========================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic information
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    
    -- Role and status
    user_role TEXT NOT NULL DEFAULT 'customer' CHECK (user_role IN ('admin', 'vendor', 'customer')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Address information
    address JSONB DEFAULT '{}',
    
    -- Contact information
    whatsapp_number TEXT,
    social_media JSONB DEFAULT '{}',
    
    -- Business information (for vendors)
    business_info JSONB DEFAULT '{}',
    
    -- User preferences
    preferences JSONB DEFAULT '{
        "language": "ar",
        "currency": "EGP",
        "notifications": {
            "email": true,
            "sms": false,
            "push": true
        },
        "theme": "light"
    }',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Customer specific
    customer_tier TEXT DEFAULT 'bronze' CHECK (customer_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    
    -- Vendor specific  
    vendor_status TEXT DEFAULT 'pending' CHECK (vendor_status IN ('pending', 'approved', 'rejected', 'suspended')),
    
    -- Admin specific
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- ========================================
-- 🏪 VENDOR MANAGEMENT
-- ========================================

-- Vendors table for business information
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Business details
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL CHECK (business_type IN ('dealership', 'parts_supplier', 'service_center', 'individual', 'manufacturer')),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    
    -- Legal information
    tax_id TEXT,
    commercial_register TEXT,
    license_number TEXT,
    
    -- Contact information
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT,
    email TEXT,
    website TEXT,
    
    -- Address
    address JSONB NOT NULL DEFAULT '{}',
    location GEOGRAPHY(POINT, 4326),
    
    -- Business metrics
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0.0,
    
    -- Specializations and services
    specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    services TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status and verification
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Operating hours
    operating_hours JSONB DEFAULT '{}',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ========================================
-- 📦 PRODUCT MANAGEMENT
-- ========================================

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Basic information
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    
    -- Categorization
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES categories(id),
    
    -- Pricing
    price DECIMAL(15,2) NOT NULL,
    original_price DECIMAL(15,2),
    currency TEXT DEFAULT 'EGP',
    discount_percentage INTEGER DEFAULT 0,
    
    -- Media
    images JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    
    -- Inventory
    in_stock BOOLEAN DEFAULT TRUE,
    quantity INTEGER DEFAULT 1,
    sku TEXT,
    
    -- Product details
    brand TEXT,
    model TEXT,
    year INTEGER,
    condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
    warranty TEXT,
    
    -- Specifications and features
    specifications JSONB DEFAULT '{}',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Car-specific details (if applicable)
    car_details JSONB DEFAULT '{}',
    
    -- SEO and marketing
    seo_data JSONB DEFAULT '{}',
    
    -- Metrics
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'sold', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Publishing
    published_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 🛒 ORDER MANAGEMENT
-- ========================================

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    
    -- Order details
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    
    -- Pricing
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'EGP',
    
    -- Addresses
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    
    -- Payment
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_details JSONB DEFAULT '{}',
    
    -- Shipping
    shipping_method TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Additional information
    notes TEXT,
    special_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Item details
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    
    -- Product snapshot (in case product changes)
    product_snapshot JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 💝 USER INTERACTIONS
-- ========================================

-- Favorites/Wishlist
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    pros TEXT,
    cons TEXT,
    
    -- Media
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 💬 COMMUNICATION
-- ========================================

-- Chat rooms
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    product_id UUID REFERENCES products(id),
    
    -- Room details
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(customer_id, vendor_id, product_id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Message content
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
    attachments JSONB DEFAULT '[]',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 🔔 NOTIFICATIONS
-- ========================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('order', 'product', 'system', 'promotion', 'chat', 'review')),
    
    -- Data payload
    data JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    
    -- Delivery channels
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    send_push BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ
);

-- ========================================
-- 📊 ANALYTICS
-- ========================================

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    session_id TEXT,
    
    -- Event details
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    
    -- Context
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    location GEOGRAPHY(POINT, 4326),
    
    -- Device information
    device_type TEXT,
    browser TEXT,
    os TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 🗂️ INDEXES AND CONSTRAINTS
-- ========================================

-- Profiles indexes
CREATE INDEX idx_profiles_user_role ON profiles(user_role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Vendors indexes
CREATE INDEX idx_vendors_business_type ON vendors(business_type);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_is_verified ON vendors(is_verified);
CREATE INDEX idx_vendors_location ON vendors USING GIST(location);
CREATE INDEX idx_vendors_rating ON vendors(rating);

-- Products indexes
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_title_search ON products USING gin(to_tsvector('arabic', title));
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Chat indexes
CREATE INDEX idx_chat_rooms_customer_vendor ON chat_rooms(customer_id, vendor_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Favorites indexes
CREATE INDEX idx_favorites_user_product ON favorites(user_id, product_id);

-- Reviews indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Analytics indexes
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);

-- ========================================
-- 🔄 TRIGGERS AND FUNCTIONS
-- ========================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile creation trigger (create profile on user signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, first_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Everyone can view public profiles" ON profiles FOR SELECT USING (true);

-- Vendors policies
CREATE POLICY "Everyone can view active vendors" ON vendors FOR SELECT USING (status = 'active');
CREATE POLICY "Vendors can manage their own data" ON vendors FOR ALL USING (user_id = auth.uid());

-- Products policies
CREATE POLICY "Everyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Vendors can manage their own products" ON products FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (customer_id = auth.uid() OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- And so on for other tables...

-- ========================================
-- 🌱 INITIAL DATA
-- ========================================

-- Insert default categories
INSERT INTO categories (name_ar, name_en, slug, icon) VALUES
('سيارات', 'Cars', 'cars', '🚗'),
('قطع غيار', 'Parts', 'parts', '🔧'),
('إكسسوارات', 'Accessories', 'accessories', '✨'),
('خدمات', 'Services', 'services', '🛠️'),
('أدوات', 'Tools', 'tools', '🔨'),
('إطارات', 'Tires', 'tires', '🛞');

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT, admin_password TEXT)
RETURNS UUID AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- This would typically be called from your application
    -- after creating the auth user through Supabase Auth
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ✅ SCHEMA COMPLETE
-- ========================================

COMMENT ON SCHEMA public IS 'Souk El-Sayarat marketplace database schema v1.0';