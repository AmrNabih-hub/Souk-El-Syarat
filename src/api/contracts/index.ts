/**
 * Backend API Contracts
 * Complete type definitions for all backend services
 */

// ============================================
// USER & AUTHENTICATION CONTRACTS
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: UserProfile;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  acceptTerms: boolean;
  role: 'customer' | 'vendor';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
  emailVerificationRequired: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phoneNumber: string;
  role: 'customer' | 'vendor' | 'admin';
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  notificationSettings: NotificationSettings;
}

export interface UserPreferences {
  language: 'en' | 'ar';
  currency: 'EGP' | 'USD' | 'EUR';
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping';
  isDefault: boolean;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank' | 'cash';
  isDefault: boolean;
  cardNumber?: string; // Masked
  cardHolder?: string;
  expiryDate?: string;
  brand?: string;
  walletProvider?: string;
  bankName?: string;
}

export interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  priceAlerts: boolean;
  newMessages: boolean;
  vendorUpdates: boolean;
  systemAnnouncements: boolean;
}

// ============================================
// PRODUCT CONTRACTS
// ============================================

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  model: string;
  year?: number;
  condition: 'new' | 'used' | 'refurbished';
  price: number;
  discountedPrice?: number;
  currency: string;
  images: ProductImage[];
  videos?: string[];
  specifications: Record<string, any>;
  features: string[];
  tags: string[];
  sku: string;
  barcode?: string;
  stock: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  weight?: number;
  dimensions?: ProductDimensions;
  warranty?: WarrantyInfo;
  shipping: ShippingInfo;
  rating: number;
  reviewCount: number;
  views: number;
  favorites: number;
  sold: number;
  status: 'active' | 'inactive' | 'draft' | 'pending' | 'rejected';
  rejectionReason?: string;
  isPromoted: boolean;
  promotionEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'inch';
}

export interface WarrantyInfo {
  available: boolean;
  duration: number;
  unit: 'days' | 'months' | 'years';
  type: 'manufacturer' | 'seller' | 'extended';
  coverage: string;
}

export interface ShippingInfo {
  freeShipping: boolean;
  shippingCost: number;
  estimatedDays: number;
  locations: string[];
  restrictions?: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
  parentId?: string;
  level: number;
  path: string[];
  isActive: boolean;
}

// ============================================
// ORDER CONTRACTS
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentId?: string;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  customerNotes?: string;
  vendorNotes?: string;
  adminNotes?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  status: OrderItemStatus;
  fulfillmentStatus: FulfillmentStatus;
  returnStatus?: ReturnStatus;
  returnReason?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderItemStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type FulfillmentStatus = 
  | 'unfulfilled'
  | 'partially_fulfilled'
  | 'fulfilled';

export type ReturnStatus = 
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'received'
  | 'refunded';

// ============================================
// VENDOR CONTRACTS
// ============================================

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessNameAr?: string;
  businessType: 'individual' | 'company' | 'dealer';
  description: string;
  descriptionAr?: string;
  logo?: string;
  banner?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  socialMedia: SocialMediaLinks;
  address: VendorAddress;
  businessDocuments: BusinessDocument[];
  bankDetails: BankDetails;
  taxInfo: TaxInfo;
  categories: string[];
  brands: string[];
  rating: number;
  reviewCount: number;
  productCount: number;
  orderCount: number;
  totalSales: number;
  commission: number;
  balance: number;
  status: VendorStatus;
  verificationStatus: VerificationStatus;
  verificationDate?: Date;
  rejectionReason?: string;
  subscription: VendorSubscription;
  settings: VendorSettings;
  analytics: VendorAnalytics;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface VendorAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

export interface BusinessDocument {
  id: string;
  type: 'license' | 'registration' | 'tax' | 'identity' | 'other';
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  verifiedAt?: Date;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
}

export interface TaxInfo {
  taxNumber: string;
  vatNumber?: string;
  taxExempt: boolean;
  taxRate: number;
}

export type VendorStatus = 
  | 'pending'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'banned';

export type VerificationStatus = 
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface VendorSubscription {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxProducts: number;
  maxImages: number;
  maxOrders: number;
  transactionFee: number;
  prioritySupport: boolean;
  analytics: boolean;
  promotions: boolean;
}

export interface VendorSettings {
  autoApproveOrders: boolean;
  minOrderAmount: number;
  maxOrderAmount: number;
  processingTime: number;
  vacationMode: boolean;
  vacationMessage?: string;
  returnPolicy: string;
  shippingPolicy: string;
  paymentTerms: string;
}

export interface VendorAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  conversionRate: number;
  returnRate: number;
  responseTime: number;
  fulfillmentRate: number;
}

// ============================================
// CART & CHECKOUT CONTRACTS
// ============================================

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  couponCode?: string;
  couponDiscount?: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  vendorId: string;
  vendorName: string;
  price: number;
  quantity: number;
  total: number;
  selected: boolean;
  addedAt: Date;
}

export interface CheckoutRequest {
  cartId: string;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethodId: string;
  couponCode?: string;
  notes?: string;
  giftMessage?: string;
  subscribeToNewsletter?: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentUrl?: string;
  message: string;
}

// ============================================
// REVIEW & RATING CONTRACTS
// ============================================

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  pros?: string[];
  cons?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  vendorResponse?: string;
  vendorResponseAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// NOTIFICATION CONTRACTS
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  icon?: string;
  image?: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'refund_processed'
  | 'review_received'
  | 'message_received'
  | 'price_drop'
  | 'back_in_stock'
  | 'promotion'
  | 'system';

// ============================================
// ANALYTICS CONTRACTS
// ============================================

export interface DashboardStats {
  period: 'today' | 'week' | 'month' | 'year' | 'all';
  revenue: RevenueStats;
  orders: OrderStats;
  customers: CustomerStats;
  products: ProductStats;
  performance: PerformanceStats;
}

export interface RevenueStats {
  total: number;
  growth: number;
  chart: ChartData[];
  byCategory: Record<string, number>;
  byVendor: Record<string, number>;
  byPaymentMethod: Record<string, number>;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  averageValue: number;
  chart: ChartData[];
}

export interface CustomerStats {
  total: number;
  new: number;
  returning: number;
  active: number;
  churnRate: number;
  lifetimeValue: number;
  chart: ChartData[];
}

export interface ProductStats {
  total: number;
  active: number;
  outOfStock: number;
  trending: Product[];
  bestSellers: Product[];
  lowStock: Product[];
}

export interface PerformanceStats {
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniqueVisitors: number;
  serverResponseTime: number;
}

export interface ChartData {
  label: string;
  value: number;
  date?: Date;
}

// ============================================
// SEARCH & FILTER CONTRACTS
// ============================================

export interface SearchRequest {
  query: string;
  category?: string;
  subcategory?: string;
  brand?: string[];
  priceRange?: [number, number];
  condition?: string[];
  rating?: number;
  vendor?: string[];
  inStock?: boolean;
  freeShipping?: boolean;
  hasDiscount?: boolean;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: Product[];
  total: number;
  page: number;
  pages: number;
  facets: SearchFacets;
  suggestions: string[];
  relatedSearches: string[];
  executionTime: number;
}

export interface SearchFacets {
  categories: FacetItem[];
  brands: FacetItem[];
  priceRanges: FacetItem[];
  conditions: FacetItem[];
  ratings: FacetItem[];
  vendors: FacetItem[];
}

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

export type SortOption = 
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'newest'
  | 'bestselling';

// ============================================
// MESSAGING CONTRACTS
// ============================================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'product' | 'order';
  attachments?: MessageAttachment[];
  productId?: string;
  orderId?: string;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Record<string, ConversationParticipant>;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
  lastSeen: Date;
}

// ============================================
// SUPPORT TICKET CONTRACTS
// ============================================

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  attachments?: string[];
  orderId?: string;
  productId?: string;
  assignedTo?: string;
  assignedToName?: string;
  responses: TicketResponse[];
  resolution?: string;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: Date;
}

export type TicketCategory = 
  | 'order'
  | 'payment'
  | 'shipping'
  | 'product'
  | 'account'
  | 'technical'
  | 'other';

export type TicketPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type TicketStatus = 
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_vendor'
  | 'resolved'
  | 'closed';

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  pagination?: PaginationInfo;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// WEBHOOK CONTRACTS
// ============================================

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: any;
  timestamp: Date;
  signature: string;
}

export type WebhookEventType = 
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'payment.completed'
  | 'payment.failed'
  | 'vendor.approved'
  | 'vendor.suspended'
  | 'product.approved'
  | 'product.rejected'
  | 'review.created';

// Export all contracts
export * from './customer';
export * from './vendor';
export * from './admin';
