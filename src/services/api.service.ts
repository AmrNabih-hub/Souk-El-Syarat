/**
 * 🚀 PROFESSIONAL API SERVICE
 * Centralized API communication with error handling and retry logic
 * Implements professional HTTP client patterns
 */

import { services } from './data.service';
import type { User, Product, Order, Review } from './data.service';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/api'
    : 'http://localhost:8080/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Professional HTTP Client Class
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config = API_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
    this.retryAttempts = config.retryAttempts;
    this.retryDelay = config.retryDelay;
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed (attempt ${attempt}):`, error);

      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.request<T>(endpoint, options, attempt + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient();

/**
 * Professional API Service Class
 * Provides high-level API methods with proper error handling
 */
export class ApiService {
  /**
   * Health and Status APIs
   */
  async getHealth(): Promise<ApiResponse> {
    return apiClient.get('/status');
  }

  async getSystemStatus(): Promise<ApiResponse> {
    return apiClient.get('/status');
  }

  async getRealtimeStatus(): Promise<ApiResponse> {
    return apiClient.get('/realtime/status');
  }

  /**
   * User Management APIs
   */
  async getUserStats(): Promise<ApiResponse<{ users: any }>> {
    return apiClient.get('/users/stats');
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.post('/users', userData);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return apiClient.delete(`/users/${userId}`);
  }

  /**
   * Product Management APIs
   */
  async getProductStats(): Promise<ApiResponse<{ products: any }>> {
    return apiClient.get('/products/stats');
  }

  async createProduct(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.post('/products', productData);
  }

  async updateProduct(productId: string, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.put(`/products/${productId}`, productData);
  }

  async deleteProduct(productId: string): Promise<ApiResponse> {
    return apiClient.delete(`/products/${productId}`);
  }

  async getProducts(category?: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (category) {
      params.append('category', category);
    }

    return apiClient.get(`/products?${params.toString()}`);
  }

  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/products/${productId}`);
  }

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    return apiClient.get(`/products/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Order Management APIs
   */
  async getOrderStats(): Promise<ApiResponse<{ orders: any }>> {
    return apiClient.get('/orders/stats');
  }

  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    return apiClient.post('/orders', orderData);
  }

  async updateOrder(orderId: string, orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    return apiClient.put(`/orders/${orderId}`, orderData);
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.put(`/orders/${orderId}/cancel`);
  }

  async getOrders(userId: string, type: 'customer' | 'vendor'): Promise<ApiResponse<Order[]>> {
    return apiClient.get(`/orders?userId=${userId}&type=${type}`);
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.get(`/orders/${orderId}`);
  }

  /**
   * Review Management APIs
   */
  async createReview(reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
    return apiClient.post('/reviews', reviewData);
  }

  async updateReview(reviewId: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
    return apiClient.put(`/reviews/${reviewId}`, reviewData);
  }

  async deleteReview(reviewId: string): Promise<ApiResponse> {
    return apiClient.delete(`/reviews/${reviewId}`);
  }

  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    return apiClient.get(`/reviews/product/${productId}`);
  }

  /**
   * Analytics APIs
   */
  async getAnalytics(): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/dashboard');
  }

  async getBusinessMetrics(): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/business-metrics');
  }

  async getRealtimeStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/analytics/realtime-stats');
  }

  /**
   * Authentication APIs
   */
  async verifyAuth(): Promise<ApiResponse> {
    return apiClient.get('/auth/verify');
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> {
    return apiClient.post('/auth/login', credentials);
  }

  async register(userData: { email: string; password: string; displayName: string; role?: string }): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/auth/register', userData);
  }

  async logout(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout');
  }

  async resetPassword(email: string): Promise<ApiResponse> {
    return apiClient.post('/auth/reset-password', { email });
  }

  /**
   * File Upload APIs
   */
  async uploadFile(file: File, path: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    return apiClient.post('/upload', formData);
  }

  async deleteFile(fileUrl: string): Promise<ApiResponse> {
    return apiClient.delete(`/files?url=${encodeURIComponent(fileUrl)}`);
  }

  /**
   * Notification APIs
   */
  async getNotifications(userId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/notifications?userId=${userId}`);
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    return apiClient.put(`/notifications/${notificationId}/read`);
  }

  async sendNotification(notificationData: any): Promise<ApiResponse> {
    return apiClient.post('/notifications', notificationData);
  }
}

// Create API service instance
export const apiService = new ApiService();

// Export individual service methods for convenience
export const {
  getHealth,
  getSystemStatus,
  getUserStats,
  getProductStats,
  getOrderStats,
  getAnalytics,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  updateOrder,
  getOrders,
  getOrder,
  createReview,
  getProductReviews,
  login,
  register,
  logout,
  resetPassword,
  uploadFile,
  deleteFile,
  getNotifications,
  markNotificationRead,
  sendNotification,
} = apiService;

// Export the API client for custom requests
export { apiClient };

// Export types
export type { ApiResponse, PaginatedResponse };

