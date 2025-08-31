/**
 * API Client
 * Unified interface for all backend operations
 * Automatically switches between mock and real services
 */

import { mockApi } from './mock/mockService';
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
  CheckoutRequest,
  CheckoutResponse,
} from './contracts';

// Check if we should use mock data
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// API client class
class ApiClient {
  private static instance: ApiClient;
  private token: string | null = null;

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Make HTTP request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Request failed',
          errors: data.errors || [],
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        pagination: data.pagination,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error',
        errors: [{ code: 'NETWORK', message: 'Failed to connect to server' }],
        timestamp: new Date(),
      };
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    if (USE_MOCK) {
      const response = await mockApi.login(request);
      if (response.success && response.data) {
        this.setToken(response.data.token);
      }
      return response;
    }

    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(request: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    if (USE_MOCK) {
      return mockApi.register(request);
    }

    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      this.setToken(null);
      return mockApi.logout();
    }

    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    this.setToken(null);
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    if (USE_MOCK) {
      return mockApi.getCurrentUser();
    }

    return this.request<UserProfile>('/auth/me');
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    if (USE_MOCK) {
      return mockApi.updateProfile(updates);
    }

    return this.request<UserProfile>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date(),
      };
    }

    return this.request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Password reset link sent to your email',
        timestamp: new Date(),
      };
    }

    return this.request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date(),
      };
    }

    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(filters?: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    if (USE_MOCK) {
      return mockApi.getProducts(filters);
    }

    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<SearchResponse>(`/products?${params}`);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    if (USE_MOCK) {
      return mockApi.getProduct(id);
    }

    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    if (USE_MOCK) {
      return mockApi.createProduct(product);
    }

    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    if (USE_MOCK) {
      return mockApi.updateProduct(id, updates);
    }

    return this.request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return mockApi.deleteProduct(id);
    }

    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadProductImage(productId: string, file: File): Promise<ApiResponse<string>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: 'https://example.com/image.jpg',
        message: 'Image uploaded successfully',
        timestamp: new Date(),
      };
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: data.url,
      message: data.message,
      timestamp: new Date(),
    };
  }

  // ============================================
  // CART
  // ============================================

  async getCart(): Promise<ApiResponse<Cart>> {
    if (USE_MOCK) {
      return mockApi.getCart();
    }

    return this.request<Cart>('/cart');
  }

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<Cart>> {
    if (USE_MOCK) {
      return mockApi.addToCart(productId, quantity);
    }

    return this.request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<Cart>> {
    if (USE_MOCK) {
      return mockApi.updateCartItem(itemId, quantity);
    }

    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string): Promise<ApiResponse<Cart>> {
    if (USE_MOCK) {
      return mockApi.removeFromCart(itemId);
    }

    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return mockApi.clearCart();
    }

    return this.request<void>('/cart', {
      method: 'DELETE',
    });
  }

  async applyCoupon(code: string): Promise<ApiResponse<Cart>> {
    if (USE_MOCK) {
      return mockApi.getCart();
    }

    return this.request<Cart>('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // ============================================
  // CHECKOUT & ORDERS
  // ============================================

  async checkout(request: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          success: true,
          orderId: 'order-' + Math.random().toString(36).substr(2, 9),
          orderNumber: 'ORD-2024-' + Math.floor(Math.random() * 1000),
          message: 'Order placed successfully',
        },
        timestamp: new Date(),
      };
    }

    return this.request<CheckoutResponse>('/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    if (USE_MOCK) {
      return mockApi.getOrders();
    }

    return this.request<Order[]>('/orders');
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    if (USE_MOCK) {
      return mockApi.getOrder(id);
    }

    return this.request<Order>(`/orders/${id}`);
  }

  async cancelOrder(id: string, reason?: string): Promise<ApiResponse<Order>> {
    if (USE_MOCK) {
      return mockApi.updateOrderStatus(id, 'cancelled');
    }

    return this.request<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async trackOrder(id: string): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          status: 'in_transit',
          location: 'Cairo Distribution Center',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          events: [
            { date: new Date(), status: 'Order placed', location: 'Online' },
            { date: new Date(), status: 'Processing', location: 'Warehouse' },
            { date: new Date(), status: 'Shipped', location: 'Cairo' },
          ],
        },
        timestamp: new Date(),
      };
    }

    return this.request<any>(`/orders/${id}/tracking`);
  }

  // ============================================
  // REVIEWS
  // ============================================

  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    if (USE_MOCK) {
      return mockApi.getProductReviews(productId);
    }

    return this.request<Review[]>(`/products/${productId}/reviews`);
  }

  async createReview(review: Partial<Review>): Promise<ApiResponse<Review>> {
    if (USE_MOCK) {
      return mockApi.createReview(review);
    }

    return this.request<Review>(`/products/${review.productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<ApiResponse<Review>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: { ...updates, id } as Review,
        message: 'Review updated successfully',
        timestamp: new Date(),
      };
    }

    return this.request<Review>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Review deleted successfully',
        timestamp: new Date(),
      };
    }

    return this.request<void>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // FAVORITES/WISHLIST
  // ============================================

  async getFavorites(): Promise<ApiResponse<Product[]>> {
    if (USE_MOCK) {
      return mockApi.getProducts();
    }

    return this.request<Product[]>('/favorites');
  }

  async addToFavorites(productId: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Added to favorites',
        timestamp: new Date(),
      };
    }

    return this.request<void>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  async removeFromFavorites(productId: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Removed from favorites',
        timestamp: new Date(),
      };
    }

    return this.request<void>(`/favorites/${productId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    if (USE_MOCK) {
      return mockApi.getNotifications();
    }

    return this.request<Notification[]>('/notifications');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return mockApi.markNotificationAsRead(id);
    }

    return this.request<void>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'All notifications marked as read',
        timestamp: new Date(),
      };
    }

    return this.request<void>('/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Notification deleted',
        timestamp: new Date(),
      };
    }

    return this.request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // MESSAGES & CHAT
  // ============================================

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    if (USE_MOCK) {
      return mockApi.getConversations();
    }

    return this.request<Conversation[]>('/conversations');
  }

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    if (USE_MOCK) {
      return mockApi.getMessages(conversationId);
    }

    return this.request<Message[]>(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(message: Partial<Message>): Promise<ApiResponse<Message>> {
    if (USE_MOCK) {
      return mockApi.sendMessage(message);
    }

    return this.request<Message>(`/conversations/${message.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async markMessageAsRead(messageId: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Message marked as read',
        timestamp: new Date(),
      };
    }

    return this.request<void>(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  // ============================================
  // VENDOR OPERATIONS
  // ============================================

  async getVendorProfile(vendorId: string): Promise<ApiResponse<Vendor>> {
    if (USE_MOCK) {
      return mockApi.getVendorProfile(vendorId);
    }

    return this.request<Vendor>(`/vendors/${vendorId}`);
  }

  async updateVendorProfile(vendorId: string, updates: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    if (USE_MOCK) {
      return mockApi.updateVendorProfile(vendorId, updates);
    }

    return this.request<Vendor>(`/vendors/${vendorId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getVendorProducts(vendorId: string): Promise<ApiResponse<Product[]>> {
    if (USE_MOCK) {
      return mockApi.getVendorProducts(vendorId);
    }

    return this.request<Product[]>(`/vendors/${vendorId}/products`);
  }

  async getVendorOrders(vendorId: string): Promise<ApiResponse<Order[]>> {
    if (USE_MOCK) {
      return mockApi.getVendorOrders(vendorId);
    }

    return this.request<Order[]>(`/vendors/${vendorId}/orders`);
  }

  async getVendorAnalytics(vendorId: string): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return mockApi.getVendorAnalytics(vendorId);
    }

    return this.request<any>(`/vendors/${vendorId}/analytics`);
  }

  async applyToBeVendor(application: any): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: { applicationId: 'app-' + Math.random().toString(36).substr(2, 9) },
        message: 'Application submitted successfully',
        timestamp: new Date(),
      };
    }

    return this.request<any>('/vendors/apply', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  // ============================================
  // DASHBOARD & ANALYTICS
  // ============================================

  async getDashboardStats(role?: string): Promise<ApiResponse<DashboardStats>> {
    if (USE_MOCK) {
      return mockApi.getDashboardStats(role || 'customer');
    }

    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getAnalytics(type: string, params?: any): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          type,
          data: [],
          summary: {},
        },
        timestamp: new Date(),
      };
    }

    const queryParams = new URLSearchParams(params);
    return this.request<any>(`/analytics/${type}?${queryParams}`);
  }

  // ============================================
  // SUPPORT TICKETS
  // ============================================

  async getSupportTickets(): Promise<ApiResponse<SupportTicket[]>> {
    if (USE_MOCK) {
      return mockApi.getSupportTickets();
    }

    return this.request<SupportTicket[]>('/support/tickets');
  }

  async getSupportTicket(id: string): Promise<ApiResponse<SupportTicket>> {
    if (USE_MOCK) {
      const tickets = await mockApi.getSupportTickets();
      const ticket = tickets.data?.find(t => t.id === id);
      
      if (!ticket) {
        return {
          success: false,
          message: 'Ticket not found',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: ticket,
        timestamp: new Date(),
      };
    }

    return this.request<SupportTicket>(`/support/tickets/${id}`);
  }

  async createSupportTicket(ticket: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    if (USE_MOCK) {
      return mockApi.createSupportTicket(ticket);
    }

    return this.request<SupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    if (USE_MOCK) {
      const ticketResponse = await this.getSupportTicket(id);
      
      if (!ticketResponse.success) {
        return ticketResponse;
      }

      return {
        success: true,
        data: { ...ticketResponse.data!, ...updates },
        message: 'Ticket updated successfully',
        timestamp: new Date(),
      };
    }

    return this.request<SupportTicket>(`/support/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async addTicketResponse(ticketId: string, message: string): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          id: 'response-' + Math.random().toString(36).substr(2, 9),
          ticketId,
          message,
          createdAt: new Date(),
        },
        message: 'Response added successfully',
        timestamp: new Date(),
      };
    }

    return this.request<any>(`/support/tickets/${ticketId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ============================================
  // SEARCH & AUTOCOMPLETE
  // ============================================

  async search(query: string, filters?: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    if (USE_MOCK) {
      return mockApi.getProducts({ ...filters, query });
    }

    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<SearchResponse>(`/search?${params}`);
  }

  async autocomplete(query: string): Promise<ApiResponse<string[]>> {
    if (USE_MOCK) {
      const suggestions = [
        'Toyota Camry',
        'Toyota Corolla',
        'Toyota Land Cruiser',
        'Honda Civic',
        'Honda Accord',
      ].filter(s => s.toLowerCase().includes(query.toLowerCase()));

      return {
        success: true,
        data: suggestions,
        timestamp: new Date(),
      };
    }

    return this.request<string[]>(`/search/autocomplete?q=${query}`);
  }

  // ============================================
  // PAYMENT METHODS
  // ============================================

  async getPaymentMethods(): Promise<ApiResponse<any[]>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: [
          { id: 'pm-1', type: 'card', last4: '1234', brand: 'Visa' },
          { id: 'pm-2', type: 'wallet', provider: 'PayPal' },
        ],
        timestamp: new Date(),
      };
    }

    return this.request<any[]>('/payment-methods');
  }

  async addPaymentMethod(method: any): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: { ...method, id: 'pm-' + Math.random().toString(36).substr(2, 9) },
        message: 'Payment method added successfully',
        timestamp: new Date(),
      };
    }

    return this.request<any>('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(method),
    });
  }

  async removePaymentMethod(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Payment method removed successfully',
        timestamp: new Date(),
      };
    }

    return this.request<void>(`/payment-methods/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // ADDRESSES
  // ============================================

  async getAddresses(): Promise<ApiResponse<any[]>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: mockUsers['customer-1'].addresses,
        timestamp: new Date(),
      };
    }

    return this.request<any[]>('/addresses');
  }

  async addAddress(address: any): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: { ...address, id: 'addr-' + Math.random().toString(36).substr(2, 9) },
        message: 'Address added successfully',
        timestamp: new Date(),
      };
    }

    return this.request<any>('/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  async updateAddress(id: string, updates: any): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return {
        success: true,
        data: { id, ...updates },
        message: 'Address updated successfully',
        timestamp: new Date(),
      };
    }

    return this.request<any>(`/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAddress(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Address deleted successfully',
        timestamp: new Date(),
      };
    }

    return this.request<void>(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export for convenience
export default apiClient;