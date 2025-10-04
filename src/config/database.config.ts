/**
 * 🏗️ Enterprise Database Configuration
 * Complete schema and table definitions for Souk El-Sayarat
 */

export const DATABASE_SCHEMA = {
  // Authentication & Users
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
      is_active BOOLEAN DEFAULT TRUE,
      email_verified BOOLEAN DEFAULT FALSE,
      phone_verified BOOLEAN DEFAULT FALSE,
      kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
      preferences JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Vendor Management
  vendors: `
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      business_license TEXT,
      tax_number TEXT,
      business_type TEXT CHECK (business_type IN ('dealership', 'parts_shop', 'service_center', 'individual')),
      description TEXT,
      address JSONB,
      contact_info JSONB,
      verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
      verification_documents TEXT[],
      rating DECIMAL(3,2) DEFAULT 0.00,
      total_reviews INTEGER DEFAULT 0,
      total_sales INTEGER DEFAULT 0,
      commission_rate DECIMAL(5,4) DEFAULT 0.05,
      is_featured BOOLEAN DEFAULT FALSE,
      subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
      subscription_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Product Categories
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      parent_id UUID REFERENCES categories(id),
      icon TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Car Listings & Products
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id),
      name TEXT NOT NULL,
      name_ar TEXT,
      description TEXT,
      description_ar TEXT,
      price DECIMAL(12,2) NOT NULL,
      original_price DECIMAL(12,2),
      currency TEXT DEFAULT 'EGP',
      sku TEXT UNIQUE,
      barcode TEXT,
      brand TEXT,
      model TEXT,
      year INTEGER,
      condition TEXT CHECK (condition IN ('new', 'used', 'refurbished')),
      availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'sold', 'reserved', 'discontinued')),
      stock_quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5,
      weight_kg DECIMAL(8,2),
      dimensions JSONB,
      specifications JSONB DEFAULT '{}',
      features TEXT[],
      images TEXT[],
      videos TEXT[],
      documents TEXT[],
      tags TEXT[],
      seo_title TEXT,
      seo_description TEXT,
      meta_keywords TEXT[],
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 0.00,
      review_count INTEGER DEFAULT 0,
      is_featured BOOLEAN DEFAULT FALSE,
      is_promoted BOOLEAN DEFAULT FALSE,
      promotion_expires_at TIMESTAMPTZ,
      location JSONB,
      shipping_info JSONB DEFAULT '{}',
      return_policy TEXT,
      warranty_info JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      published_at TIMESTAMPTZ
    );
  `,

  // Car-Specific Information
  car_listings: `
    CREATE TABLE IF NOT EXISTS car_listings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      mileage INTEGER,
      fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'diesel', 'hybrid', 'electric', 'lpg', 'cng')),
      transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt', 'semi_automatic')),
      engine_size DECIMAL(4,2),
      engine_power_hp INTEGER,
      drivetrain TEXT CHECK (drivetrain IN ('fwd', 'rwd', 'awd', '4wd')),
      body_type TEXT CHECK (body_type IN ('sedan', 'hatchback', 'suv', 'coupe', 'convertible', 'wagon', 'pickup', 'van')),
      exterior_color TEXT,
      interior_color TEXT,
      number_of_doors INTEGER,
      seating_capacity INTEGER,
      vin TEXT UNIQUE,
      license_plate TEXT,
      registration_status TEXT,
      insurance_status TEXT,
      inspection_expires_at DATE,
      accident_history JSONB DEFAULT '[]',
      service_history JSONB DEFAULT '[]',
      modifications TEXT[],
      included_accessories TEXT[],
      financing_available BOOLEAN DEFAULT FALSE,
      financing_options JSONB DEFAULT '{}',
      trade_in_accepted BOOLEAN DEFAULT FALSE,
      negotiable BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Orders & Transactions
  orders: `
    CREATE TABLE IF NOT EXISTS orders (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_id UUID REFERENCES profiles(id),
      vendor_id UUID REFERENCES vendors(id),
      order_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
      payment_method TEXT,
      payment_transaction_id TEXT,
      subtotal DECIMAL(12,2) NOT NULL,
      tax_amount DECIMAL(12,2) DEFAULT 0.00,
      shipping_amount DECIMAL(12,2) DEFAULT 0.00,
      discount_amount DECIMAL(12,2) DEFAULT 0.00,
      total_amount DECIMAL(12,2) NOT NULL,
      currency TEXT DEFAULT 'EGP',
      shipping_address JSONB,
      billing_address JSONB,
      delivery_method TEXT,
      tracking_number TEXT,
      estimated_delivery DATE,
      delivered_at TIMESTAMPTZ,
      notes TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Order Items
  order_items: `
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(12,2) NOT NULL,
      total_price DECIMAL(12,2) NOT NULL,
      product_snapshot JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Reviews & Ratings
  reviews: `
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      reviewer_id UUID REFERENCES profiles(id),
      product_id UUID REFERENCES products(id),
      vendor_id UUID REFERENCES vendors(id),
      order_id UUID REFERENCES orders(id),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT,
      pros TEXT[],
      cons TEXT[],
      images TEXT[],
      verified_purchase BOOLEAN DEFAULT FALSE,
      helpful_count INTEGER DEFAULT 0,
      report_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Real-time Chat
  chat_rooms: `
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'support')),
      name TEXT,
      description TEXT,
      participants UUID[],
      metadata JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  chat_messages: `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES profiles(id),
      message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'product', 'system')),
      content TEXT,
      attachments TEXT[],
      metadata JSONB DEFAULT '{}',
      is_edited BOOLEAN DEFAULT FALSE,
      is_deleted BOOLEAN DEFAULT FALSE,
      reply_to UUID REFERENCES chat_messages(id),
      read_by JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Notifications
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_url TEXT,
      metadata JSONB DEFAULT '{}',
      is_read BOOLEAN DEFAULT FALSE,
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Analytics Events
  analytics_events: `
    CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id),
      session_id TEXT,
      event_type TEXT NOT NULL,
      event_name TEXT NOT NULL,
      properties JSONB DEFAULT '{}',
      page_url TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_address INET,
      country TEXT,
      city TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,

  // Favorites/Wishlist
  favorites: `
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
  `,

  // Search & Filters
  saved_searches: `
    CREATE TABLE IF NOT EXISTS saved_searches (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      search_query TEXT,
      filters JSONB DEFAULT '{}',
      alert_enabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
};

// Indexes for performance optimization
export const DATABASE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);',
  'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);',
  'CREATE INDEX IF NOT EXISTS idx_products_status ON products(availability_status);',
  'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);',
  'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;',
  'CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector(\'english\', name || \' \' || description));',
  'CREATE INDEX IF NOT EXISTS idx_car_listings_make_model ON car_listings(make, model);',
  'CREATE INDEX IF NOT EXISTS idx_car_listings_year ON car_listings(year);',
  'CREATE INDEX IF NOT EXISTS idx_car_listings_price_range ON car_listings(product_id) INCLUDE (id);',
  'CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);',
  'CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);',
  'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);',
  'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);',
  'CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);',
  'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at);'
];

// Row Level Security Policies
export const RLS_POLICIES = {
  profiles: [
    'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);',
    'CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);'
  ],
  products: [
    'ALTER TABLE products ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Anyone can view published products" ON products FOR SELECT USING (published_at IS NOT NULL);',
    'CREATE POLICY "Vendors can manage their products" ON products FOR ALL USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));'
  ],
  orders: [
    'ALTER TABLE orders ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));',
    'CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);'
  ]
};

export default {
  DATABASE_SCHEMA,
  DATABASE_INDEXES,
  RLS_POLICIES
};