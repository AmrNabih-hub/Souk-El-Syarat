/**
 * 🚀 BACKEND SERVICE
 * Souk El-Sayarat - Backend API Integration
 */

import { BACKEND_CONFIG } from '@/config/firebase.config';

interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  service: string;
}

interface APIStatus {
  message: string;
  status: string;
  services: {
    authentication: string;
    database: string;
    realtime: string;
    notifications: string;
  };
  timestamp: string;
}

interface RealtimeStatus {
  realtime: {
    messaging: string;
    notifications: string;
    presence: string;
    orders: string;
  };
  websocket: string;
  timestamp: string;
}

class BackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BACKEND_CONFIG.baseUrl;
  }

  /**
   * Make HTTP request to backend
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BackendResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const defaultOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        ...options,
      };

      console.log(`🔗 Backend API Call: ${defaultOptions.method} ${url}`);

      const response = await fetch(url, defaultOptions);
      
      let data: T | undefined;
      try {
        data = await response.json();
      } catch (e) {
        // Handle non-JSON responses
        data = (await response.text()) as unknown as T;
      }

      return {
        success: response.ok,
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('❌ Backend API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      };
    }
  }

  /**
   * Health check endpoint
   */
  async getHealth(): Promise<BackendResponse<HealthStatus>> {
    return this.makeRequest<HealthStatus>(BACKEND_CONFIG.endpoints.health);
  }

  /**
   * Get API status
   */
  async getStatus(): Promise<BackendResponse<APIStatus>> {
    return this.makeRequest<APIStatus>(BACKEND_CONFIG.endpoints.status);
  }

  /**
   * Get real-time services status
   */
  async getRealtimeStatus(): Promise<BackendResponse<RealtimeStatus>> {
    return this.makeRequest<RealtimeStatus>(BACKEND_CONFIG.endpoints.realtime);
  }

  /**
   * Verify authentication
   */
  async verifyAuth(): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.auth, {
      method: 'POST',
    });
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Signup user
   */
  async signup(email: string, password: string, name: string, role: string = 'customer'): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.signup, {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.logout, {
      method: 'POST',
    });
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.reset, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Process order
   */
  async processOrder(orderData: any): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.orders, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Get vendors status
   */
  async getVendorsStatus(): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.vendors);
  }

  /**
   * Get products status
   */
  async getProductsStatus(): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.products);
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(): Promise<BackendResponse> {
    return this.makeRequest(BACKEND_CONFIG.endpoints.analytics);
  }

  /**
   * Test backend connectivity
   */
  async testConnectivity(): Promise<{
    backend: boolean;
    health: boolean;
    api: boolean;
    realtime: boolean;
  }> {
    console.log('🧪 Testing Backend Connectivity...');

    const results = {
      backend: false,
      health: false,
      api: false,
      realtime: false,
    };

    try {
      // Test health endpoint
      const healthResponse = await this.getHealth();
      results.health = healthResponse.success;
      console.log(`Health Check: ${results.health ? '✅' : '❌'}`);

      // Test API status
      const statusResponse = await this.getStatus();
      results.api = statusResponse.success;
      console.log(`API Status: ${results.api ? '✅' : '❌'}`);

      // Test real-time status
      const realtimeResponse = await this.getRealtimeStatus();
      results.realtime = realtimeResponse.success;
      console.log(`Realtime Status: ${results.realtime ? '✅' : '❌'}`);

      // Overall backend status
      results.backend = results.health && results.api && results.realtime;

      console.log(`Backend Overall: ${results.backend ? '✅' : '❌'}`);

    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
    }

    return results;
  }
}

// Export singleton instance
export const backendService = new BackendService();
export default backendService;
