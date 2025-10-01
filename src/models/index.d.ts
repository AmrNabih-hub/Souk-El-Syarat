// import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";





export declare class User {
  readonly id: string;
  readonly email: string;
  readonly displayName?: string;
  readonly phoneNumber?: string;
  readonly photoURL?: string;
  readonly role: string;
  readonly isActive: boolean;
  readonly emailVerified: boolean;
  readonly vendorId?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly lastLoginAt?: string;
  readonly preferences?: string;
  constructor(init: ModelInit<User>);
  static copyOf(source: User, mutator: (draft: MutableModel<User>) => MutableModel<User> | void): User;
}

export declare class Vendor {
  readonly id: string;
  readonly businessName: string;
  readonly businessType: string;
  readonly description: string;
  readonly contactPerson: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly whatsappNumber?: string;
  readonly address?: string;
  readonly businessLicense?: string;
  readonly taxId?: string;
  readonly website?: string;
  readonly socialMedia?: string;
  readonly experience?: string;
  readonly specializations?: string[];
  readonly expectedMonthlyVolume?: string;
  readonly documents?: string;
  readonly status: string;
  readonly rating?: number;
  readonly totalProducts?: number;
  readonly totalSales?: number;
  readonly joinedDate?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly lastUpdated?: string;
  readonly statusChangedBy?: string;
  readonly statusChangedAt?: string;
  readonly statusChangeReason?: string;
  constructor(init: ModelInit<Vendor>);
  static copyOf(source: Vendor, mutator: (draft: MutableModel<Vendor>) => MutableModel<Vendor> | void): Vendor;
}

export declare class Product {
  readonly id: string;
  readonly vendorId: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly subcategory: string;
  readonly images?: any;
  readonly price: number;
  readonly originalPrice?: number;
  readonly currency: string;
  readonly inStock: boolean;
  readonly quantity: number;
  readonly specifications?: any;
  readonly features?: string[];
  readonly tags?: string[];
  readonly condition: string;
  readonly warranty?: string;
  readonly carDetails?: any;
  readonly status: string;
  readonly views?: number;
  readonly favorites?: number;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly publishedAt?: string;
  readonly seoData?: string;
  constructor(init: ModelInit<Product>);
  static copyOf(source: Product, mutator: (draft: MutableModel<Product>) => MutableModel<Product> | void): Product;
}

export declare class Order {
  readonly id: string;
  readonly customerId: string;
  readonly vendorId: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly paymentMethod: string;
  readonly items?: string;
  readonly subtotal: number;
  readonly tax: number;
  readonly shipping: number;
  readonly total: number;
  readonly shippingAddress?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  constructor(init: ModelInit<Order>);
  static copyOf(source: Order, mutator: (draft: MutableModel<Order>) => MutableModel<Order> | void): Order;
}

export declare class AdminStats {
  readonly id: string;
  readonly totalUsers: number;
  readonly totalVendors: number;
  readonly totalProducts: number;
  readonly totalOrders: number;
  readonly pendingApplications: number;
  readonly monthlyRevenue: number;
  readonly activeUsers: number;
  readonly newSignups: number;
  readonly platformHealth?: string;
  readonly realTimeMetrics?: string;
  constructor(init: ModelInit<AdminStats>);
  static copyOf(source: AdminStats, mutator: (draft: MutableModel<AdminStats>) => MutableModel<AdminStats> | void): AdminStats;
}

export declare class VendorApplication {
  readonly id: string;
  readonly userId: string;
  readonly businessName: string;
  readonly businessType: string;
  readonly description: string;
  readonly contactPerson: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly whatsappNumber?: string;
  readonly address?: string;
  readonly businessLicense?: string;
  readonly taxId?: string;
  readonly website?: string;
  readonly socialMedia?: string;
  readonly experience?: string;
  readonly specializations?: string[];
  readonly expectedMonthlyVolume?: string;
  readonly documents?: string;
  readonly status: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly adminNotes?: string;
  constructor(init: ModelInit<VendorApplication>);
  static copyOf(source: VendorApplication, mutator: (draft: MutableModel<VendorApplication>) => MutableModel<VendorApplication> | void): VendorApplication;
}

export declare class AdminAnalytics {
  readonly id: string;
  readonly timestamp?: string;
  constructor(init: ModelInit<AdminAnalytics>);
  static copyOf(source: AdminAnalytics, mutator: (draft: MutableModel<AdminAnalytics>) => MutableModel<AdminAnalytics> | void): AdminAnalytics;
}

export declare class SystemLog {
  readonly id: string;
  readonly timestamp?: string;
  readonly action: string;
  readonly adminId: string;
  readonly targetId: string;
  readonly details?: string;
  constructor(init: ModelInit<SystemLog>);
  static copyOf(source: SystemLog, mutator: (draft: MutableModel<SystemLog>) => MutableModel<SystemLog> | void): SystemLog;
}

export declare class PlatformMetrics {
  readonly id: string;
  readonly lastAction?: string;
  readonly lastActionData?: string;
  readonly totalActions?: number;
  readonly uptime?: number;
  readonly responseTime?: number;
  readonly errorRate?: number;
  readonly activeConnections?: number;
  readonly totalRequests?: number;
  readonly updatedAt?: string;
  constructor(init: ModelInit<PlatformMetrics>);
  static copyOf(source: PlatformMetrics, mutator: (draft: MutableModel<PlatformMetrics>) => MutableModel<PlatformMetrics> | void): PlatformMetrics;
}

export declare class Message {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly senderRole: string;
  readonly type: string;
  readonly content: string;
  readonly metadata?: any;
  readonly attachments?: string;
  readonly readBy?: string;
  readonly replyTo?: string;
  readonly edited: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  constructor(init: ModelInit<Message>);
  static copyOf(source: Message, mutator: (draft: MutableModel<Message>) => MutableModel<Message> | void): Message;
}

export declare class Conversation {
  readonly id: string;
  readonly type: string;
  readonly title?: string;
  readonly participants: string;
  readonly status: string;
  readonly lastMessage?: string;
  readonly unreadCount: string;
  readonly metadata?: string;
  readonly orderId?: string;
  readonly productId?: string;
  readonly vendorId?: string;
  readonly priority: string;
  readonly tags?: string[];
  readonly assignedTo?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly closedAt?: string;
  constructor(init: ModelInit<Conversation>);
  static copyOf(source: Conversation, mutator: (draft: MutableModel<Conversation>) => MutableModel<Conversation> | void): Conversation;
}

export declare class AnalyticsEvent {
  readonly id: string;
  readonly type: string;
  readonly userId?: string;
  readonly sessionId: string;
  readonly productId?: string;
  readonly vendorId?: string;
  readonly orderId?: string;
  readonly category?: string;
  readonly action: string;
  readonly label?: string;
  readonly value?: number;
  readonly metadata?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly location?: string;
  readonly timestamp: string;
  constructor(init: ModelInit<AnalyticsEvent>);
  static copyOf(source: AnalyticsEvent, mutator: (draft: MutableModel<AnalyticsEvent>) => MutableModel<AnalyticsEvent> | void): AnalyticsEvent;
}

export declare class SystemMetrics {
  readonly id: string;
  readonly type: string;
  readonly metric: string;
  readonly value: number;
  readonly unit: string;
  readonly tags?: string;
  readonly timestamp: string;
  constructor(init: ModelInit<SystemMetrics>);
  static copyOf(source: SystemMetrics, mutator: (draft: MutableModel<SystemMetrics>) => MutableModel<SystemMetrics> | void): SystemMetrics;
}

export declare class BusinessMetrics {
  readonly id: string;
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly totalVendors: number;
  readonly activeVendors: number;
  readonly totalProducts: number;
  readonly activeProducts: number;
  readonly totalOrders: number;
  readonly completedOrders: number;
  readonly totalRevenue: number;
  readonly averageOrderValue: number;
  readonly conversionRate: number;
  readonly topCategories?: any;
  readonly topVendors?: any;
  readonly topProducts?: any;
  readonly revenueByPeriod?: any;
  readonly userGrowth?: any;
  readonly lastUpdated?: string;
  constructor(init: ModelInit<BusinessMetrics>);
  static copyOf(source: BusinessMetrics, mutator: (draft: MutableModel<BusinessMetrics>) => MutableModel<BusinessMetrics> | void): BusinessMetrics;
}

export declare class RealTimeStats {
  readonly id: string;
  readonly onlineUsers: number;
  readonly activeVendors: number;
  readonly pendingOrders: number;
  readonly processingOrders: number;
  readonly recentOrders?: string;
  readonly recentSignups?: string;
  readonly systemHealth?: string;
  readonly lastUpdated?: string;
  constructor(init: ModelInit<RealTimeStats>);
  static copyOf(source: RealTimeStats, mutator: (draft: MutableModel<RealTimeStats>) => MutableModel<RealTimeStats> | void): RealTimeStats;
}