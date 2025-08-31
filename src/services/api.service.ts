/**
 * Professional API Service
 * Connects to Real Firebase Backend
 */

import axios, { AxiosInstance } from 'axios';
import { auth } from '@/config/firebase.config';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-souk-el-syarat.cloudfunctions.net/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
          
          if (error.response.status === 401) {
            // Unauthorized - redirect to login
            window.location.href = '/login';
          }
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.request);
        } else {
          // Something else happened
          console.error('Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile(userId: string) {
    const response = await this.api.get(`/auth/profile/${userId}`);
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.api.get('/products', { params });
    return response.data;
  }

  async getProduct(productId: string) {
    const response = await this.api.get(`/products/${productId}`);
    return response.data;
  }

  async createProduct(data: any) {
    const response = await this.api.post('/products', data);
    return response.data;
  }

  async updateProduct(productId: string, data: any) {
    const response = await this.api.put(`/products/${productId}`, data);
    return response.data;
  }

  async deleteProduct(productId: string) {
    const response = await this.api.delete(`/products/${productId}`);
    return response.data;
  }

  // ============================================
  // VENDORS
  // ============================================

  async applyAsVendor(data: {
    businessName: string;
    businessType: string;
    nationalId: string;
    commercialRegister: string;
    taxNumber: string;
    businessAddress: string;
    bankAccount: string;
    subscriptionPlan: string;
    instaPayProof: string;
  }) {
    const response = await this.api.post('/vendors/apply', data);
    return response.data;
  }

  async getVendorApplicationStatus(applicationId: string) {
    const response = await this.api.get(`/vendors/application/${applicationId}`);
    return response.data;
  }

  async reviewVendorApplication(applicationId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    const response = await this.api.put(`/vendors/application/${applicationId}/review`, {
      status,
      rejectionReason,
    });
    return response.data;
  }

  // ============================================
  // CAR LISTINGS
  // ============================================

  async submitCarForSale(data: {
    brand: string;
    model: string;
    year: number;
    mileage: number;
    condition: string;
    price: number;
    description: string;
    images: string[];
    location: string;
    contactNumber: string;
  }) {
    const response = await this.api.post('/cars/sell', data);
    return response.data;
  }

  async getCarListingStatus(listingId: string) {
    const response = await this.api.get(`/cars/listing/${listingId}/status`);
    return response.data;
  }

  async reviewCarListing(listingId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
    const response = await this.api.put(`/cars/listing/${listingId}/review`, {
      status,
      rejectionReason,
    });
    return response.data;
  }

  // ============================================
  // ORDERS
  // ============================================

  async createOrder(data: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: any;
    paymentMethod?: string;
    notes?: string;
  }) {
    const response = await this.api.post('/orders/create', data);
    return response.data;
  }

  async getUserOrders(userId: string) {
    const response = await this.api.get(`/orders/user/${userId}`);
    return response.data;
  }

  // ============================================
  // CHAT
  // ============================================

  async sendMessage(receiverId: string, message: string, type: string = 'text') {
    const response = await this.api.post('/chat/send', {
      receiverId,
      message,
      type,
    });
    return response.data;
  }

  async getAdmin2Conversations() {
    const response = await this.api.get('/chat/admin2/conversations');
    return response.data;
  }

  async markMessagesAsRead(conversationId: string) {
    const response = await this.api.put(`/chat/read/${conversationId}`);
    return response.data;
  }

  // ============================================
  // SEARCH
  // ============================================

  async searchProducts(params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    year?: number;
    brand?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.api.get('/search/products', { params });
    return response.data;
  }

  async getTrendingSearches() {
    const response = await this.api.get('/search/trending');
    return response.data;
  }

  // ============================================
  // PAYMENTS
  // ============================================

  async submitInstaPayProof(data: {
    transactionImage: string;
    transactionNumber: string;
    amount: number;
    plan: string;
  }) {
    const response = await this.api.post('/vendors/subscription/instapay', data);
    return response.data;
  }

  async verifyPayment(verificationId: string, status: 'approved' | 'rejected', notes?: string) {
    const response = await this.api.put(`/admin/payment/verify/${verificationId}`, {
      status,
      notes,
    });
    return response.data;
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getRealtimeDashboard() {
    const response = await this.api.get('/dashboard/realtime');
    return response.data;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async checkHealth() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();