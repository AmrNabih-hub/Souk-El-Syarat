// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  address?: Address;
  preferences?: UserPreferences;
}

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface Address {
  street: string;
  city: string;
  governorate: string;
  postalCode?: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UserPreferences {
  language: 'ar' | 'en';
  currency: 'EGP' | 'USD';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Vendor Types
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  logo?: string;
  coverImage?: string;
  contactInfo: {
    email: string;
    phone: string;
    whatsapp?: string;
    website?: string;
  };
  address: Address;
  businessLicense: string;
  taxNumber?: string;
  status: VendorStatus;
  rating: number;
  totalSales: number;
  joinedDate: Date;
  verifiedAt?: Date;
  documents: VendorDocument[];
  socialLinks?: SocialLinks;
}

export type BusinessType = 
  | 'car_dealer' 
  | 'parts_supplier' 
  | 'service_center' 
  | 'individual_seller'
  | 'manufacturer'
  | 'distributor';

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';

export interface VendorDocument {
  id: string;
  type: DocumentType;
  url: string;
  name: string;
  uploadedAt: Date;
  verified: boolean;
}

export type DocumentType = 
  | 'business_license' 
  | 'tax_certificate' 
  | 'insurance_certificate'
  | 'identity_card'
  | 'commercial_register';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

// Product Types
export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  images: ProductImage[];
  price: number;
  originalPrice?: number;
  currency: 'EGP' | 'USD';
  inStock: boolean;
  quantity: number;
  specifications: ProductSpecification[];
  features: string[];
  tags: string[];
  condition: ProductCondition;
  warranty?: Warranty;
  status: ProductStatus;
  views: number;
  favorites: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  seoData?: SEOData;
}

export type ProductCategory = 
  | 'cars' 
  | 'motorcycles' 
  | 'parts' 
  | 'accessories' 
  | 'services' 
  | 'tools'
  | 'tires'
  | 'electronics';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
  category: string;
}

export type ProductCondition = 'new' | 'used' | 'refurbished';

export interface Warranty {
  type: 'manufacturer' | 'seller' | 'extended';
  duration: number; // in months
  coverage: string;
}

export type ProductStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug: string;
}

// Car-specific Types
export interface CarProduct extends Product {
  carDetails: CarDetails;
}

export interface CarDetails {
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  bodyType: BodyType;
  color: string;
  engineSize: number;
  doors: number;
  seats: number;
  drivetrain: DrivetrainType;
  vin?: string;
  plateNumber?: string;
  inspectionDate?: Date;
  accidentHistory: boolean;
  modifications?: string[];
}

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'cng' | 'lpg';
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'semi_automatic';
export type BodyType = 'sedan' | 'hatchback' | 'suv' | 'coupe' | 'convertible' | 'wagon' | 'pickup' | 'van';
export type DrivetrainType = 'fwd' | 'rwd' | 'awd' | '4wd';

// Order Types
export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  productSnapshot: Partial<Product>; // Store product data at time of purchase
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export type PaymentMethod = 
  | 'cash_on_delivery' 
  | 'credit_card' 
  | 'paypal' 
  | 'bank_transfer' 
  | 'mobile_wallet';

// Review Types
export interface Review {
  id: string;
  userId: string;
  productId?: string;
  vendorId?: string;
  orderId?: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  response?: VendorResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorResponse {
  message: string;
  createdAt: Date;
}

// Application State Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  currency: 'EGP' | 'USD';
  cartItems: CartItem[];
  favorites: string[];
  recentlyViewed: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationData;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: ProductCategory;
  subcategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  condition?: ProductCondition;
  location?: string;
  vendor?: string;
  inStock?: boolean;
  features?: string[];
  // Car-specific filters
  make?: string;
  model?: string;
  yearRange?: {
    min: number;
    max: number;
  };
  mileageRange?: {
    min: number;
    max: number;
  };
  fuelType?: FuelType[];
  transmission?: TransmissionType[];
  bodyType?: BodyType[];
}

export interface SearchResult {
  products: Product[];
  total: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  categories: FacetCount[];
  conditions: FacetCount[];
  priceRanges: FacetCount[];
  locations: FacetCount[];
  makes: FacetCount[];
  models: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// Dashboard Analytics Types
export interface VendorAnalytics {
  totalSales: number;
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  completedOrders: number;
  averageRating: number;
  totalViews: number;
  conversionRate: number;
  salesGrowth: number;
  revenueData: RevenueData[];
  topProducts: TopProduct[];
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  sales: number;
  revenue: number;
  views: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVendorApplications: number;
  platformGrowth: PlatformGrowth;
  topCategories: CategoryStats[];
  userActivity: UserActivityData[];
}

export interface PlatformGrowth {
  usersGrowth: number;
  vendorsGrowth: number;
  ordersGrowth: number;
  revenueGrowth: number;
}

export interface CategoryStats {
  category: string;
  productCount: number;
  orderCount: number;
  revenue: number;
}

export interface UserActivityData {
  date: string;
  activeUsers: number;
  newSignups: number;
  orders: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'order_update' 
  | 'vendor_application' 
  | 'product_approved' 
  | 'product_rejected'
  | 'new_review'
  | 'payment_received'
  | 'system_announcement';

// Form Types
export interface VendorApplicationForm {
  businessName: string;
  businessType: BusinessType;
  description: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address: Address;
  businessLicense: File;
  taxCertificate?: File;
  identityCard: File;
  commercialRegister?: File;
  agreedToTerms: boolean;
}

export interface ProductForm {
  title: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  condition: ProductCondition;
  specifications: ProductSpecification[];
  features: string[];
  tags: string[];
  images: File[];
  warranty?: Warranty;
  // Car-specific fields
  carDetails?: Partial<CarDetails>;
}