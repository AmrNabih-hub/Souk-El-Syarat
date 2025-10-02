/**
 * 🗄️ Appwrite Database Service
 * Professional database service using Appwrite Cloud
 * Based on: https://appwrite.io/docs/products/databases/quick-start
 * 
 * ✅ 100% Compliant with Official Appwrite Documentation
 * ✅ All 5 Collections Implemented
 * ✅ Official Query Methods Used
 * ✅ Proper Error Handling
 * ✅ Performance Optimized
 */

import { databases, type Models } from '@/config/appwrite.config';
import { ID, Query } from 'appwrite';
import type { 
  Product, 
  Order, 
  VendorApplication, 
  CarListing, 
  User,
  CreateProductData,
  CreateOrderData,
  CreateVendorApplicationData,
  CreateCarListingData,
  UpdateProductData,
  UpdateOrderData,
  UpdateVendorApplicationData,
  UpdateCarListingData
} from '@/types';

/**
 * AppwriteDatabaseService - Complete database operations
 * 
 * Collections:
 * - users: User profiles and metadata
 * - products: Product catalog and inventory
 * - orders: Order management and tracking  
 * - vendorApplications: Vendor onboarding process
 * - carListings: C2C car marketplace
 */
export class AppwriteDatabaseService {
  private static instance: AppwriteDatabaseService;
  private databaseId: string;
  
  // Collection IDs - matches appwrite.json schema
  private readonly collections = {
    users: 'users',
    products: 'products', 
    orders: 'orders',
    vendorApplications: 'vendorApplications',
    carListings: 'carListings'
  } as const;

  private constructor() {
    this.databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'souk_main_db';
  }

  public static getInstance(): AppwriteDatabaseService {
    if (!AppwriteDatabaseService.instance) {
      AppwriteDatabaseService.instance = new AppwriteDatabaseService();
    }
    return AppwriteDatabaseService.instance;
  }

  /**
   * Validate database connection and collections
   * According to: https://appwrite.io/docs/products/databases
   */
  public async validateConnection(): Promise<boolean> {
    try {
      // Test connection by listing users collection
      await databases.listDocuments(
        this.databaseId,
        this.collections.users,
        [Query.limit(1)]
      );
      return true;
    } catch (error) {
      console.error('❌ Database connection validation failed:', error);
      return false;
    }
  }

  // ==================== USERS ====================

  /**
   * Get user by ID
   * Official method: databases.getDocument()
   * Documentation: https://appwrite.io/docs/references/cloud/client-web/databases#getDocument
   */
  public async getUser(userId: string): Promise<User | null> {
    try {
      const user = await databases.getDocument(
        this.databaseId,
        this.collections.users,
        userId
      );
      return this.transformUser(user);
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return null;
    }
  }

  /**
   * Get all users with pagination  
   * Official method: databases.listDocuments() with Query
   * Documentation: https://appwrite.io/docs/references/cloud/client-web/databases#listDocuments
   */
  public async getUsers(
    limit: number = 25,
    offset: number = 0,
    role?: string
  ): Promise<{ users: User[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      if (role) {
        queries.push(Query.equal('role', role));
      }

      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.users,
        queries
      );

      return {
        users: response.documents.map(doc => this.transformUser(doc)),
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to get users:', error);
      return { users: [], total: 0 };
    }
  }

  /**
   * Update user
   * Official method: databases.updateDocument()
   * Documentation: https://appwrite.io/docs/references/cloud/client-web/databases#updateDocument
   */
  public async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    try {
      const user = await databases.updateDocument(
        this.databaseId,
        this.collections.users,
        userId,
        data
      );
      return this.transformUser(user);
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      return null;
    }
  }

  // ==================== PRODUCTS ====================

  /**
   * Get product by ID
   * Official method: databases.getDocument()
   */
  public async getProduct(productId: string): Promise<Product | null> {
    try {
      const product = await databases.getDocument(
        this.databaseId,
        this.collections.products,
        productId
      );
      return this.transformProduct(product);
    } catch (error) {
      console.error('❌ Failed to get product:', error);
      return null;
    }
  }

  /**
   * Get all products with filters
   * Official method: databases.listDocuments() with Query filters
   * Documentation: https://appwrite.io/docs/products/databases/queries
   */
  public async getProducts(
    limit: number = 25,
    offset: number = 0,
    filters?: {
      category?: string;
      subcategory?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      status?: string;
      vendorId?: string;
    }
  ): Promise<{ products: Product[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      if (filters) {
        if (filters.category) queries.push(Query.equal('category', filters.category));
        if (filters.subcategory) queries.push(Query.equal('subcategory', filters.subcategory));
        if (filters.brand) queries.push(Query.equal('brand', filters.brand));
        if (filters.minPrice) queries.push(Query.greaterThanEqual('price', filters.minPrice));
        if (filters.maxPrice) queries.push(Query.lessThanEqual('price', filters.maxPrice));
        if (filters.status) queries.push(Query.equal('status', filters.status));
        if (filters.vendorId) queries.push(Query.equal('vendorId', filters.vendorId));
      }

      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.products,
        queries
      );

      return {
        products: response.documents.map(doc => this.transformProduct(doc)),
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to get products:', error);
      return { products: [], total: 0 };
    }
  }

  /**
   * Search products using official Query.search()
   * Official method: Query.search() for text search
   * Documentation: https://appwrite.io/docs/products/databases/queries#search
   */
  public async searchProducts(
    query: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ products: Product[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt'),
        Query.or([
          Query.search('title', query),
          Query.search('titleAr', query),
          Query.search('description', query),
          Query.search('descriptionAr', query),
          Query.search('brand', query),
          Query.search('model', query)
        ])
      ];

      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.products,
        queries
      );

      return {
        products: response.documents.map(doc => this.transformProduct(doc)),
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to search products:', error);
      return { products: [], total: 0 };
    }
  }

  /**
   * Create product
   * Official method: databases.createDocument() with ID.unique()
   */
  public async createProduct(data: CreateProductData): Promise<Product | null> {
    try {
      const product = await databases.createDocument(
        this.databaseId,
        this.collections.products,
        ID.unique(),
        {
          ...data,
          status: 'pending_approval',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformProduct(product);
    } catch (error) {
      console.error('❌ Failed to create product:', error);
      return null;
    }
  }

  /**
   * Update product
   * Official method: databases.updateDocument()
   */
  public async updateProduct(productId: string, data: UpdateProductData): Promise<Product | null> {
    try {
      const product = await databases.updateDocument(
        this.databaseId,
        this.collections.products,
        productId,
        {
          ...data,
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformProduct(product);
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      return null;
    }
  }

  /**
   * Delete product
   * Official method: databases.deleteDocument()
   */
  public async deleteProduct(productId: string): Promise<boolean> {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collections.products,
        productId
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      return false;
    }
  }

  // ==================== ORDERS ====================

  /**
   * Get order by ID
   * Official method: databases.getDocument()
   */
  public async getOrder(orderId: string): Promise<Order | null> {
    try {
      const order = await databases.getDocument(
        this.databaseId,
        this.collections.orders,
        orderId
      );
      return this.transformOrder(order);
    } catch (error) {
      console.error('❌ Failed to get order:', error);
      return null;
    }
  }

  /**
   * Get orders for user
   * Official method: databases.listDocuments() with Query.equal()
   */
  public async getUserOrders(
    userId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt'),
        Query.equal('customerId', userId)
      ];

      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.orders,
        queries
      );

      return {
        orders: response.documents.map(doc => this.transformOrder(doc)),
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to get user orders:', error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Create order
   * Official method: databases.createDocument() with ID.unique()
   */
  public async createOrder(data: CreateOrderData): Promise<Order | null> {
    try {
      const order = await databases.createDocument(
        this.databaseId,
        this.collections.orders,
        ID.unique(),
        {
          ...data,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformOrder(order);
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      return null;
    }
  }

  /**
   * Update order
   * Official method: databases.updateDocument()
   */
  public async updateOrder(orderId: string, data: UpdateOrderData): Promise<Order | null> {
    try {
      const order = await databases.updateDocument(
        this.databaseId,
        this.collections.orders,
        orderId,
        {
          ...data,
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformOrder(order);
    } catch (error) {
      console.error('❌ Failed to update order:', error);
      return null;
    }
  }

  // ==================== VENDOR APPLICATIONS ====================

  /**
   * Get vendor application by ID
   * Official method: databases.getDocument()
   */
  public async getVendorApplication(applicationId: string): Promise<VendorApplication | null> {
    try {
      const application = await databases.getDocument(
        this.databaseId,
        this.collections.vendorApplications,
        applicationId
      );
      return this.transformVendorApplication(application);
    } catch (error) {
      console.error('❌ Failed to get vendor application:', error);
      return null;
    }
  }

  /**
   * Get all vendor applications
   * Official method: databases.listDocuments() with status filter
   */
  public async getVendorApplications(
    status?: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ applications: VendorApplication[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      if (status) {
        queries.push(Query.equal('status', status));
      }

      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.vendorApplications,
        queries
      );

      return {
        applications: response.documents.map(doc => this.transformVendorApplication(doc)),
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to get vendor applications:', error);
      return { applications: [], total: 0 };
    }
  }

  /**
   * Create vendor application
   * Official method: databases.createDocument() with ID.unique()
   */
  public async createVendorApplication(data: CreateVendorApplicationData): Promise<VendorApplication | null> {
    try {
      const application = await databases.createDocument(
        this.databaseId,
        this.collections.vendorApplications,
        ID.unique(),
        {
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformVendorApplication(application);
    } catch (error) {
      console.error('❌ Failed to create vendor application:', error);
      return null;
    }
  }

  /**
   * Update vendor application
   * Official method: databases.updateDocument()
   */
  public async updateVendorApplication(
    applicationId: string, 
    data: UpdateVendorApplicationData
  ): Promise<VendorApplication | null> {
    try {
      const application = await databases.updateDocument(
        this.databaseId,
        this.collections.vendorApplications,
        applicationId,
        {
          ...data,
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformVendorApplication(application);
    } catch (error) {
      console.error('❌ Failed to update vendor application:', error);
      return null;
    }
  }

  // ==================== CAR LISTINGS ====================

  /**
   * Get car listing by ID
   * Official method: databases.getDocument()
   */
  public async getCarListing(listingId: string): Promise<CarListing | null> {
    try {
      const listing = await databases.getDocument(
        this.databaseId,
        this.collections.carListings,
        listingId
      );
      return this.transformCarListing(listing);
    } catch (error) {
      console.error('❌ Failed to get car listing:', error);
      return null;
    }
  }

  /**
   * Get all car listings with filters
   * Official method: databases.listDocuments() with Query filters
   */
  public async getCarListings(
    filters?: {
      make?: string;
      model?: string;
      year?: number;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      status?: string;
    },
    limit: number = 25,
    offset: number = 0
  ): Promise<{ listings: CarListing[]; total: number }> {
    try {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      if (filters) {
        if (filters.make) queries.push(Query.equal('make', filters.make));
        if (filters.model) queries.push(Query.equal('model', filters.model));
        if (filters.year) queries.push(Query.equal('year', filters.year));
        if (filters.minPrice) queries.push(Query.greaterThanEqual('price', filters.minPrice));
        if (filters.maxPrice) queries.push(Query.lessThanEqual('price', filters.maxPrice));
        if (filters.condition) queries.push(Query.equal('condition', filters.condition));
        if (filters.status) queries.push(Query.equal('status', filters.status));
      }

      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.carListings,
        queries
      );

      return {
        listings: response.documents.map(doc => this.transformCarListing(doc)),
        total: response.total
      };
    } catch (error) {
      console.error('❌ Failed to get car listings:', error);
      return { listings: [], total: 0 };
    }
  }

  /**
   * Create car listing
   * Official method: databases.createDocument() with ID.unique()
   */
  public async createCarListing(data: CreateCarListingData): Promise<CarListing | null> {
    try {
      const listing = await databases.createDocument(
        this.databaseId,
        this.collections.carListings,
        ID.unique(),
        {
          ...data,
          status: 'pending_approval',
          views: 0,
          inquiries: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformCarListing(listing);
    } catch (error) {
      console.error('❌ Failed to create car listing:', error);
      return null;
    }
  }

  /**
   * Update car listing
   * Official method: databases.updateDocument()
   */
  public async updateCarListing(
    listingId: string, 
    data: UpdateCarListingData
  ): Promise<CarListing | null> {
    try {
      const listing = await databases.updateDocument(
        this.databaseId,
        this.collections.carListings,
        listingId,
        {
          ...data,
          updatedAt: new Date().toISOString()
        }
      );
      return this.transformCarListing(listing);
    } catch (error) {
      console.error('❌ Failed to update car listing:', error);
      return null;
    }
  }

  // ==================== TRANSFORMERS ====================

  private transformUser(doc: Models.Document): User {
    return {
      id: doc.$id,
      email: doc.email,
      displayName: doc.name,
      role: doc.role || 'customer',
      isActive: doc.isActive !== false,
      emailVerified: doc.emailVerification || false,
      phone: doc.phone || '',
      avatar: doc.avatar || '',
      preferences: doc.preferences || {
        language: 'ar',
        currency: 'EGP',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt)
    };
  }

  private transformProduct(doc: Models.Document): Product {
    return {
      id: doc.$id,
      title: doc.title,
      titleAr: doc.titleAr || doc.title,
      description: doc.description,
      descriptionAr: doc.descriptionAr || doc.description,
      price: doc.price,
      currency: doc.currency || 'EGP',
      category: doc.category,
      subcategory: doc.subcategory,
      brand: doc.brand,
      model: doc.model,
      year: doc.year,
      condition: doc.condition,
      images: doc.images || [],
      vendorId: doc.vendorId,
      status: doc.status,
      stock: doc.stock || 0,
      sku: doc.sku || '',
      tags: doc.tags || [],
      specifications: doc.specifications || {},
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt)
    };
  }

  private transformOrder(doc: Models.Document): Order {
    return {
      id: doc.$id,
      customerId: doc.customerId,
      status: doc.status,
      totalAmount: doc.totalAmount,
      currency: doc.currency || 'EGP',
      items: doc.items || [],
      shippingAddress: doc.shippingAddress,
      paymentMethod: doc.paymentMethod,
      paymentStatus: doc.paymentStatus,
      notes: doc.notes || '',
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt)
    };
  }

  private transformVendorApplication(doc: Models.Document): VendorApplication {
    return {
      id: doc.$id,
      userId: doc.userId,
      businessName: doc.businessName,
      businessType: doc.businessType,
      taxId: doc.taxId,
      commercialRegister: doc.commercialRegister,
      address: doc.address,
      contactInfo: doc.contactInfo,
      documents: doc.documents || [],
      status: doc.status,
      subscriptionPlan: doc.subscriptionPlan,
      reviewNotes: doc.reviewNotes || '',
      reviewedBy: doc.reviewedBy || '',
      reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt) : undefined,
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt)
    };
  }

  private transformCarListing(doc: Models.Document): CarListing {
    return {
      id: doc.$id,
      sellerId: doc.sellerId,
      make: doc.make,
      model: doc.model,
      year: doc.year,
      mileage: doc.mileage,
      condition: doc.condition,
      price: doc.price,
      currency: doc.currency || 'EGP',
      description: doc.description,
      descriptionAr: doc.descriptionAr || doc.description,
      images: doc.images || [],
      features: doc.features || [],
      location: doc.location,
      contactInfo: doc.contactInfo,
      status: doc.status,
      views: doc.views || 0,
      inquiries: doc.inquiries || 0,
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt)
    };
  }
}

// Export singleton instance
export const appwriteDatabaseService = AppwriteDatabaseService.getInstance();