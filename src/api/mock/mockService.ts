/**
 * Mock Service Layer
 * Provides mock data for all backend endpoints during development
 */

import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
  Product,
  Order,
  Cart,
  Vendor,
  DashboardStats,
  ApiResponse,
  SearchRequest,
  SearchResponse,
  Notification,
  Review,
  SupportTicket,
  Message,
  Conversation,
} from '../contracts';

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock user data
const mockUsers: Record<string, UserProfile> = {
  'customer-1': {
    id: 'customer-1',
    email: 'customer@example.com',
    firstName: 'أحمد',
    lastName: 'محمد',
    displayName: 'أحمد محمد',
    phoneNumber: '+201234567890',
    role: 'customer',
    avatar: 'https://i.pravatar.cc/150?img=1',
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    preferences: {
      language: 'ar',
      currency: 'EGP',
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
    addresses: [
      {
        id: 'addr-1',
        type: 'shipping',
        isDefault: true,
        fullName: 'أحمد محمد',
        phoneNumber: '+201234567890',
        streetAddress: '123 شارع التحرير',
        city: 'القاهرة',
        state: 'القاهرة',
        postalCode: '11511',
        country: 'مصر',
      },
    ],
    paymentMethods: [
      {
        id: 'pm-1',
        type: 'card',
        isDefault: true,
        cardNumber: '**** **** **** 1234',
        cardHolder: 'AHMED MOHAMED',
        expiryDate: '12/25',
        brand: 'Visa',
      },
    ],
    notificationSettings: {
      orderUpdates: true,
      promotions: true,
      priceAlerts: true,
      newMessages: true,
      vendorUpdates: false,
      systemAnnouncements: true,
    },
  },
  'vendor-1': {
    id: 'vendor-1',
    email: 'vendor@example.com',
    firstName: 'محمد',
    lastName: 'علي',
    displayName: 'محمد علي للسيارات',
    phoneNumber: '+201098765432',
    role: 'vendor',
    avatar: 'https://i.pravatar.cc/150?img=2',
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    preferences: {
      language: 'ar',
      currency: 'EGP',
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: true,
    },
    addresses: [],
    paymentMethods: [],
    notificationSettings: {
      orderUpdates: true,
      promotions: false,
      priceAlerts: false,
      newMessages: true,
      vendorUpdates: true,
      systemAnnouncements: true,
    },
  },
  'admin-1': {
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'System',
    lastName: 'Admin',
    displayName: 'Administrator',
    phoneNumber: '+201111111111',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=3',
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    preferences: {
      language: 'en',
      currency: 'EGP',
      theme: 'dark',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: true,
    },
    addresses: [],
    paymentMethods: [],
    notificationSettings: {
      orderUpdates: true,
      promotions: false,
      priceAlerts: false,
      newMessages: true,
      vendorUpdates: true,
      systemAnnouncements: true,
    },
  },
};

// Mock products data
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    vendorId: 'vendor-1',
    vendorName: 'محمد علي للسيارات',
    title: 'Toyota Camry 2023',
    titleAr: 'تويوتا كامري 2023',
    description: 'Brand new Toyota Camry with full options',
    descriptionAr: 'تويوتا كامري جديدة بالكامل مع جميع الكماليات',
    category: {
      id: 'cat-1',
      name: 'Cars',
      nameAr: 'سيارات',
      slug: 'cars',
      level: 1,
      path: ['cars'],
      isActive: true,
    },
    subcategory: 'Sedan',
    brand: 'Toyota',
    model: 'Camry',
    year: 2023,
    condition: 'new',
    price: 850000,
    discountedPrice: 820000,
    currency: 'EGP',
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=200',
        alt: 'Toyota Camry Front',
        isPrimary: true,
        order: 1,
      },
    ],
    specifications: {
      engine: '2.5L 4-Cylinder',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      mileage: '0 km',
      color: 'Pearl White',
    },
    features: ['Leather Seats', 'Sunroof', 'Navigation', 'Backup Camera'],
    tags: ['new', 'sedan', 'toyota', 'luxury'],
    sku: 'TOY-CAM-2023-001',
    stock: 5,
    minOrderQuantity: 1,
    maxOrderQuantity: 1,
    warranty: {
      available: true,
      duration: 3,
      unit: 'years',
      type: 'manufacturer',
      coverage: 'Comprehensive warranty covering all major components',
    },
    shipping: {
      freeShipping: true,
      shippingCost: 0,
      estimatedDays: 3,
      locations: ['Cairo', 'Alexandria', 'Giza'],
    },
    rating: 4.8,
    reviewCount: 127,
    views: 3456,
    favorites: 234,
    sold: 12,
    status: 'active',
    isPromoted: true,
    promotionEndDate: new Date('2024-02-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  // Add more mock products...
];

// Mock service class
export class MockApiService {
  private static instance: MockApiService;

  static getInstance(): MockApiService {
    if (!MockApiService.instance) {
      MockApiService.instance = new MockApiService();
    }
    return MockApiService.instance;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    await delay(1000);

    // Simulate login logic
    const user = Object.values(mockUsers).find(u => u.email === request.email);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: [{ code: 'AUTH001', message: 'Invalid credentials' }],
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: {
        success: true,
        token: 'mock-jwt-token-' + generateId(),
        refreshToken: 'mock-refresh-token-' + generateId(),
        user,
        expiresIn: 3600,
      },
      timestamp: new Date(),
    };
  }

  async register(request: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    await delay(1500);

    // Check if email exists
    const exists = Object.values(mockUsers).some(u => u.email === request.email);
    
    if (exists) {
      return {
        success: false,
        message: 'Email already registered',
        errors: [{ code: 'AUTH002', message: 'Email already exists' }],
        timestamp: new Date(),
      };
    }

    const userId = 'user-' + generateId();
    
    return {
      success: true,
      data: {
        success: true,
        message: 'Registration successful. Please verify your email.',
        userId,
        emailVerificationRequired: true,
      },
      timestamp: new Date(),
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    await delay(500);
    
    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date(),
    };
  }

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    await delay(300);
    
    // Return mock current user (customer for demo)
    return {
      success: true,
      data: mockUsers['customer-1'],
      timestamp: new Date(),
    };
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    await delay(800);
    
    const user = mockUsers['customer-1'];
    const updated = { ...user, ...updates, updatedAt: new Date() };
    
    return {
      success: true,
      data: updated,
      message: 'Profile updated successfully',
      timestamp: new Date(),
    };
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(request?: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    await delay(600);

    // Apply filters and search
    let filtered = [...mockProducts];
    
    if (request?.query) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(request.query.toLowerCase()) ||
        p.description.toLowerCase().includes(request.query.toLowerCase())
      );
    }

    if (request?.category) {
      filtered = filtered.filter(p => p.category.slug === request.category);
    }

    if (request?.priceRange) {
      filtered = filtered.filter(p => 
        p.price >= request.priceRange![0] && p.price <= request.priceRange![1]
      );
    }

    // Pagination
    const page = request?.page || 1;
    const limit = request?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedResults = filtered.slice(start, end);

    return {
      success: true,
      data: {
        results: paginatedResults,
        total: filtered.length,
        page,
        pages: Math.ceil(filtered.length / limit),
        facets: {
          categories: [
            { value: 'cars', label: 'Cars', count: 45 },
            { value: 'parts', label: 'Parts', count: 123 },
          ],
          brands: [
            { value: 'toyota', label: 'Toyota', count: 23 },
            { value: 'mercedes', label: 'Mercedes', count: 15 },
          ],
          priceRanges: [
            { value: '0-100000', label: 'Under 100K', count: 34 },
            { value: '100000-500000', label: '100K - 500K', count: 56 },
          ],
          conditions: [
            { value: 'new', label: 'New', count: 78 },
            { value: 'used', label: 'Used', count: 145 },
          ],
          ratings: [
            { value: '4+', label: '4 Stars & Up', count: 89 },
            { value: '3+', label: '3 Stars & Up', count: 134 },
          ],
          vendors: [
            { value: 'vendor-1', label: 'محمد علي للسيارات', count: 23 },
          ],
        },
        suggestions: ['Toyota Camry', 'Honda Civic', 'Mercedes C-Class'],
        relatedSearches: ['Toyota', 'Sedan Cars', 'New Cars'],
        executionTime: 234,
      },
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
        hasNext: end < filtered.length,
        hasPrev: page > 1,
      },
      timestamp: new Date(),
    };
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    await delay(400);

    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
        errors: [{ code: 'PROD001', message: 'Product does not exist' }],
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: product,
      timestamp: new Date(),
    };
  }

  async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    await delay(1000);

    const newProduct: Product = {
      ...mockProducts[0],
      ...product,
      id: 'prod-' + generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProducts.push(newProduct);

    return {
      success: true,
      data: newProduct,
      message: 'Product created successfully',
      timestamp: new Date(),
    };
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    await delay(800);

    const index = mockProducts.findIndex(p => p.id === id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Product not found',
        errors: [{ code: 'PROD001', message: 'Product does not exist' }],
        timestamp: new Date(),
      };
    }

    mockProducts[index] = {
      ...mockProducts[index],
      ...updates,
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: mockProducts[index],
      message: 'Product updated successfully',
      timestamp: new Date(),
    };
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    await delay(600);

    const index = mockProducts.findIndex(p => p.id === id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Product not found',
        errors: [{ code: 'PROD001', message: 'Product does not exist' }],
        timestamp: new Date(),
      };
    }

    mockProducts.splice(index, 1);

    return {
      success: true,
      message: 'Product deleted successfully',
      timestamp: new Date(),
    };
  }

  // ============================================
  // CART
  // ============================================

  async getCart(): Promise<ApiResponse<Cart>> {
    await delay(300);

    const mockCart: Cart = {
      id: 'cart-1',
      userId: 'customer-1',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Toyota Camry 2023',
          productImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=200',
          vendorId: 'vendor-1',
          vendorName: 'محمد علي للسيارات',
          price: 820000,
          quantity: 1,
          total: 820000,
          selected: true,
          addedAt: new Date(),
        },
      ],
      subtotal: 820000,
      tax: 123000,
      shipping: 0,
      discount: 30000,
      total: 913000,
      currency: 'EGP',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: mockCart,
      timestamp: new Date(),
    };
  }

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<Cart>> {
    await delay(500);

    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
        errors: [{ code: 'CART001', message: 'Cannot add product to cart' }],
        timestamp: new Date(),
      };
    }

    // Return updated cart
    return this.getCart();
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<Cart>> {
    await delay(400);
    
    // Return updated cart
    return this.getCart();
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<Cart>> {
    await delay(400);
    
    // Return updated cart
    return this.getCart();
  }

  async clearCart(): Promise<ApiResponse<void>> {
    await delay(300);
    
    return {
      success: true,
      message: 'Cart cleared successfully',
      timestamp: new Date(),
    };
  }

  // ============================================
  // ORDERS
  // ============================================

  async getOrders(): Promise<ApiResponse<Order[]>> {
    await delay(500);

    const mockOrders: Order[] = [
      {
        id: 'order-1',
        orderNumber: 'ORD-2024-001',
        customerId: 'customer-1',
        customerName: 'أحمد محمد',
        customerEmail: 'customer@example.com',
        customerPhone: '+201234567890',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Toyota Camry 2023',
            productImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=200',
            vendorId: 'vendor-1',
            vendorName: 'محمد علي للسيارات',
            quantity: 1,
            price: 820000,
            discount: 30000,
            total: 790000,
            status: 'confirmed',
            fulfillmentStatus: 'unfulfilled',
          },
        ],
        subtotal: 790000,
        tax: 118500,
        shipping: 0,
        discount: 30000,
        total: 878500,
        currency: 'EGP',
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        paymentId: 'pay-123',
        shippingAddress: mockUsers['customer-1'].addresses[0],
        billingAddress: mockUsers['customer-1'].addresses[0],
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        paidAt: new Date(),
      },
    ];

    return {
      success: true,
      data: mockOrders,
      timestamp: new Date(),
    };
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    await delay(400);

    const orders = await this.getOrders();
    const order = orders.data?.find(o => o.id === id);
    
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
        errors: [{ code: 'ORD001', message: 'Order does not exist' }],
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: order,
      timestamp: new Date(),
    };
  }

  async createOrder(orderData: any): Promise<ApiResponse<Order>> {
    await delay(1500);

    const newOrder: Order = {
      id: 'order-' + generateId(),
      orderNumber: 'ORD-2024-' + Math.floor(Math.random() * 1000),
      customerId: 'customer-1',
      customerName: 'أحمد محمد',
      customerEmail: 'customer@example.com',
      customerPhone: '+201234567890',
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      currency: 'EGP',
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'Credit Card',
      shippingAddress: mockUsers['customer-1'].addresses[0],
      billingAddress: mockUsers['customer-1'].addresses[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: newOrder,
      message: 'Order created successfully',
      timestamp: new Date(),
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    await delay(600);

    const orderResponse = await this.getOrder(id);
    
    if (!orderResponse.success) {
      return orderResponse;
    }

    const order = orderResponse.data!;
    order.status = status as any;
    order.updatedAt = new Date();

    return {
      success: true,
      data: order,
      message: 'Order status updated successfully',
      timestamp: new Date(),
    };
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats(role: string): Promise<ApiResponse<DashboardStats>> {
    await delay(500);

    const stats: DashboardStats = {
      period: 'month',
      revenue: {
        total: 5432100,
        growth: 12.5,
        chart: [
          { label: 'Week 1', value: 1234000 },
          { label: 'Week 2', value: 1456000 },
          { label: 'Week 3', value: 1342000 },
          { label: 'Week 4', value: 1400100 },
        ],
        byCategory: {
          'Cars': 3500000,
          'Parts': 1432100,
          'Accessories': 500000,
        },
        byVendor: {
          'vendor-1': 2500000,
          'vendor-2': 1932100,
          'vendor-3': 1000000,
        },
        byPaymentMethod: {
          'Credit Card': 3000000,
          'Cash': 1500000,
          'Bank Transfer': 932100,
        },
      },
      orders: {
        total: 234,
        pending: 12,
        processing: 45,
        completed: 156,
        cancelled: 21,
        averageValue: 23214,
        chart: [
          { label: 'Week 1', value: 56 },
          { label: 'Week 2', value: 67 },
          { label: 'Week 3', value: 52 },
          { label: 'Week 4', value: 59 },
        ],
      },
      customers: {
        total: 1234,
        new: 234,
        returning: 1000,
        active: 567,
        churnRate: 5.2,
        lifetimeValue: 45670,
        chart: [
          { label: 'Week 1', value: 234 },
          { label: 'Week 2', value: 267 },
          { label: 'Week 3', value: 312 },
          { label: 'Week 4', value: 421 },
        ],
      },
      products: {
        total: 456,
        active: 412,
        outOfStock: 44,
        trending: mockProducts.slice(0, 5),
        bestSellers: mockProducts.slice(0, 5),
        lowStock: mockProducts.filter(p => p.stock < 5),
      },
      performance: {
        conversionRate: 3.4,
        averageSessionDuration: 234,
        bounceRate: 34.5,
        pageViews: 45678,
        uniqueVisitors: 12345,
        serverResponseTime: 234,
      },
    };

    return {
      success: true,
      data: stats,
      timestamp: new Date(),
    };
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    await delay(300);

    const notifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'customer-1',
        type: 'order_confirmed',
        title: 'Order Confirmed',
        titleAr: 'تم تأكيد الطلب',
        message: 'Your order #ORD-2024-001 has been confirmed',
        messageAr: 'تم تأكيد طلبك رقم ORD-2024-001',
        icon: '✅',
        actionUrl: '/orders/order-1',
        actionLabel: 'View Order',
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 'notif-2',
        userId: 'customer-1',
        type: 'price_drop',
        title: 'Price Drop Alert',
        titleAr: 'تنبيه انخفاض السعر',
        message: 'Toyota Camry price dropped by 5%',
        messageAr: 'انخفض سعر تويوتا كامري بنسبة 5%',
        icon: '💰',
        actionUrl: '/product/prod-1',
        actionLabel: 'View Product',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    return {
      success: true,
      data: notifications,
      timestamp: new Date(),
    };
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    await delay(200);

    return {
      success: true,
      message: 'Notification marked as read',
      timestamp: new Date(),
    };
  }

  // ============================================
  // REVIEWS
  // ============================================

  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    await delay(400);

    const reviews: Review[] = [
      {
        id: 'review-1',
        productId,
        orderId: 'order-1',
        customerId: 'customer-1',
        customerName: 'أحمد محمد',
        customerAvatar: 'https://i.pravatar.cc/150?img=1',
        rating: 5,
        title: 'Excellent car!',
        comment: 'Very satisfied with the purchase. Great service and fast delivery.',
        isVerifiedPurchase: true,
        helpfulCount: 23,
        unhelpfulCount: 2,
        status: 'approved',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'review-2',
        productId,
        orderId: 'order-2',
        customerId: 'customer-2',
        customerName: 'فاطمة أحمد',
        customerAvatar: 'https://i.pravatar.cc/150?img=4',
        rating: 4,
        title: 'Good value for money',
        comment: 'The car is great but delivery took longer than expected.',
        isVerifiedPurchase: true,
        helpfulCount: 15,
        unhelpfulCount: 1,
        vendorResponse: 'Thank you for your feedback. We apologize for the delay.',
        vendorResponseAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'approved',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    return {
      success: true,
      data: reviews,
      timestamp: new Date(),
    };
  }

  async createReview(review: Partial<Review>): Promise<ApiResponse<Review>> {
    await delay(800);

    const newReview: Review = {
      id: 'review-' + generateId(),
      productId: review.productId || 'prod-1',
      orderId: review.orderId || 'order-1',
      customerId: 'customer-1',
      customerName: 'أحمد محمد',
      customerAvatar: 'https://i.pravatar.cc/150?img=1',
      rating: review.rating || 5,
      title: review.title || '',
      comment: review.comment || '',
      isVerifiedPurchase: true,
      helpfulCount: 0,
      unhelpfulCount: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: newReview,
      message: 'Review submitted successfully. It will be visible after moderation.',
      timestamp: new Date(),
    };
  }

  // ============================================
  // MESSAGES & CHAT
  // ============================================

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    await delay(400);

    const conversations: Conversation[] = [
      {
        id: 'conv-1',
        participants: ['customer-1', 'vendor-1'],
        participantDetails: {
          'customer-1': {
            id: 'customer-1',
            name: 'أحمد محمد',
            avatar: 'https://i.pravatar.cc/150?img=1',
            role: 'customer',
            isOnline: true,
            lastSeen: new Date(),
          },
          'vendor-1': {
            id: 'vendor-1',
            name: 'محمد علي للسيارات',
            avatar: 'https://i.pravatar.cc/150?img=2',
            role: 'vendor',
            isOnline: false,
            lastSeen: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
        lastMessage: {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'vendor-1',
          senderName: 'محمد علي للسيارات',
          receiverId: 'customer-1',
          content: 'نعم، السيارة متوفرة للمعاينة',
          type: 'text',
          isRead: false,
          isDeleted: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        unreadCount: 1,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    return {
      success: true,
      data: conversations,
      timestamp: new Date(),
    };
  }

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    await delay(300);

    const messages: Message[] = [
      {
        id: 'msg-1',
        conversationId,
        senderId: 'customer-1',
        senderName: 'أحمد محمد',
        senderAvatar: 'https://i.pravatar.cc/150?img=1',
        receiverId: 'vendor-1',
        content: 'هل السيارة متوفرة للمعاينة؟',
        type: 'text',
        isRead: true,
        readAt: new Date(Date.now() - 40 * 60 * 1000),
        isDeleted: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: 'msg-2',
        conversationId,
        senderId: 'vendor-1',
        senderName: 'محمد علي للسيارات',
        senderAvatar: 'https://i.pravatar.cc/150?img=2',
        receiverId: 'customer-1',
        content: 'نعم، السيارة متوفرة للمعاينة',
        type: 'text',
        isRead: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    return {
      success: true,
      data: messages,
      timestamp: new Date(),
    };
  }

  async sendMessage(message: Partial<Message>): Promise<ApiResponse<Message>> {
    await delay(500);

    const newMessage: Message = {
      id: 'msg-' + generateId(),
      conversationId: message.conversationId || 'conv-1',
      senderId: 'customer-1',
      senderName: 'أحمد محمد',
      senderAvatar: 'https://i.pravatar.cc/150?img=1',
      receiverId: message.receiverId || 'vendor-1',
      content: message.content || '',
      type: message.type || 'text',
      isRead: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: newMessage,
      timestamp: new Date(),
    };
  }

  // ============================================
  // VENDOR OPERATIONS
  // ============================================

  async getVendorProfile(vendorId: string): Promise<ApiResponse<Vendor>> {
    await delay(400);

    const vendor: Vendor = {
      id: vendorId,
      userId: vendorId,
      businessName: 'محمد علي للسيارات',
      businessType: 'dealer',
      description: 'Leading car dealer in Cairo with 10+ years of experience',
      email: 'vendor@example.com',
      phone: '+201098765432',
      whatsapp: '+201098765432',
      website: 'https://example.com',
      socialMedia: {
        facebook: 'https://facebook.com/example',
        instagram: 'https://instagram.com/example',
      },
      address: {
        street: '123 شارع التحرير',
        city: 'القاهرة',
        state: 'القاهرة',
        postalCode: '11511',
        country: 'مصر',
      },
      businessDocuments: [],
      bankDetails: {
        accountName: 'محمد علي',
        accountNumber: '1234567890',
        bankName: 'CIB',
        currency: 'EGP',
      },
      taxInfo: {
        taxNumber: '123456789',
        taxExempt: false,
        taxRate: 14,
      },
      categories: ['cars', 'parts'],
      brands: ['Toyota', 'Honda', 'Mercedes'],
      rating: 4.7,
      reviewCount: 234,
      productCount: 45,
      orderCount: 567,
      totalSales: 12500000,
      commission: 5,
      balance: 234000,
      status: 'active',
      verificationStatus: 'verified',
      verificationDate: new Date('2023-06-15'),
      subscription: {
        plan: 'premium',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        autoRenew: true,
        features: ['Unlimited Products', 'Priority Support', 'Analytics'],
        limits: {
          maxProducts: -1,
          maxImages: 20,
          maxOrders: -1,
          transactionFee: 2.5,
          prioritySupport: true,
          analytics: true,
          promotions: true,
        },
      },
      settings: {
        autoApproveOrders: false,
        minOrderAmount: 1000,
        maxOrderAmount: 10000000,
        processingTime: 2,
        vacationMode: false,
        returnPolicy: '7 days return policy',
        shippingPolicy: 'Free shipping on orders above 50,000 EGP',
        paymentTerms: 'Payment on delivery or credit card',
      },
      analytics: {
        totalRevenue: 12500000,
        totalOrders: 567,
        totalProducts: 45,
        averageRating: 4.7,
        conversionRate: 3.4,
        returnRate: 1.2,
        responseTime: 2.3,
        fulfillmentRate: 98.5,
      },
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    return {
      success: true,
      data: vendor,
      timestamp: new Date(),
    };
  }

  async updateVendorProfile(vendorId: string, updates: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    await delay(800);

    const vendorResponse = await this.getVendorProfile(vendorId);
    
    if (!vendorResponse.success) {
      return vendorResponse;
    }

    const vendor = { ...vendorResponse.data!, ...updates, updatedAt: new Date() };

    return {
      success: true,
      data: vendor,
      message: 'Vendor profile updated successfully',
      timestamp: new Date(),
    };
  }

  async getVendorProducts(vendorId: string): Promise<ApiResponse<Product[]>> {
    await delay(400);

    const vendorProducts = mockProducts.filter(p => p.vendorId === vendorId);

    return {
      success: true,
      data: vendorProducts,
      timestamp: new Date(),
    };
  }

  async getVendorOrders(vendorId: string): Promise<ApiResponse<Order[]>> {
    await delay(500);

    const orders = await this.getOrders();
    const vendorOrders = orders.data?.filter(o => 
      o.items.some(item => item.vendorId === vendorId)
    ) || [];

    return {
      success: true,
      data: vendorOrders,
      timestamp: new Date(),
    };
  }

  async getVendorAnalytics(vendorId: string): Promise<ApiResponse<any>> {
    await delay(600);

    const analytics = {
      revenue: {
        today: 45000,
        week: 234000,
        month: 1250000,
        year: 12500000,
      },
      orders: {
        pending: 5,
        processing: 12,
        completed: 456,
        cancelled: 23,
      },
      products: {
        total: 45,
        active: 42,
        outOfStock: 3,
        views: 12345,
      },
      customers: {
        total: 234,
        new: 45,
        returning: 189,
        reviews: 127,
      },
      performance: {
        rating: 4.7,
        responseTime: '2.3 hours',
        fulfillmentRate: '98.5%',
        returnRate: '1.2%',
      },
    };

    return {
      success: true,
      data: analytics,
      timestamp: new Date(),
    };
  }

  // ============================================
  // SUPPORT TICKETS
  // ============================================

  async getSupportTickets(): Promise<ApiResponse<SupportTicket[]>> {
    await delay(400);

    const tickets: SupportTicket[] = [
      {
        id: 'ticket-1',
        ticketNumber: 'TKT-2024-001',
        userId: 'customer-1',
        userName: 'أحمد محمد',
        userEmail: 'customer@example.com',
        category: 'order',
        priority: 'medium',
        status: 'open',
        subject: 'Delayed delivery',
        description: 'My order has not been delivered yet.',
        orderId: 'order-1',
        responses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return {
      success: true,
      data: tickets,
      timestamp: new Date(),
    };
  }

  async createSupportTicket(ticket: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    await delay(800);

    const newTicket: SupportTicket = {
      id: 'ticket-' + generateId(),
      ticketNumber: 'TKT-2024-' + Math.floor(Math.random() * 1000),
      userId: 'customer-1',
      userName: 'أحمد محمد',
      userEmail: 'customer@example.com',
      category: ticket.category || 'other',
      priority: ticket.priority || 'medium',
      status: 'open',
      subject: ticket.subject || '',
      description: ticket.description || '',
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: newTicket,
      message: 'Support ticket created successfully',
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const mockApi = MockApiService.getInstance();