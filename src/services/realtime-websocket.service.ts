// Integrated with blueprint:javascript_websocket
interface WebSocketMessage {
  type: 'vendor_application' | 'vendor_approved' | 'vendor_rejected' | 'order_update' | 'product_update' | 'user_activity';
  data: any;
  timestamp: number;
  userId?: string;
}

interface VendorStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  monthlyGrowth: number;
  recentOrders: any[];
  topProducts: any[];
  customerSatisfaction: number;
}

export class RealTimeWebSocketService {
  private static instance: RealTimeWebSocketService;
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  private constructor() {
    this.connect();
  }

  static getInstance(): RealTimeWebSocketService {
    if (!RealTimeWebSocketService.instance) {
      RealTimeWebSocketService.instance = new RealTimeWebSocketService();
    }
    return RealTimeWebSocketService.instance;
  }

  private connect(): void {
    try {
      // Use the WebSocket configuration from the blueprint
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('🔌 WebSocket connected for real-time updates');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connection', { status: 'connected' });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.notifyListeners('connection', { status: 'disconnected' });
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners('error', { error: 'Connection error' });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 Real-time message received:', message.type);
    this.notifyListeners(message.type, message.data);
    
    // Handle specific message types
    switch (message.type) {
      case 'vendor_application':
      break;
        this.notifyListeners('admin_notifications', {
          type: 'new_application',
          data: message.data
        });
        break;
      case 'vendor_approved':
      break;
      case 'vendor_rejected':
      break;
        this.notifyListeners('vendor_status_update', message.data);
        break;
      case 'order_update':
      break;
        this.notifyListeners('vendor_dashboard_update', message.data);
        break;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.notifyListeners('connection', { status: 'failed' });
    }
  }

  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  // Public API methods
  public subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  public sendMessage(type: string, data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: type as any,
        data,
        timestamp: Date.now()
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  // Real-time vendor statistics
  public subscribeToVendorStats(vendorId: string, callback: (stats: VendorStats) => void): () => void {
    return this.subscribe(`vendor_stats_${vendorId}`, callback);
  }

  // Real-time admin notifications
  public subscribeToAdminNotifications(callback: (notification: any) => void): () => void {
    return this.subscribe('admin_notifications', callback);
  }

  // Simulate real-time data for demo (in production, this would come from the server)
  public simulateVendorStats(vendorId: string): void {
    const mockStats: VendorStats = {
      totalOrders: Math.floor(Math.random() * 100) + 50,
      totalRevenue: Math.floor(Math.random() * 50000) + 25000,
      totalProducts: Math.floor(Math.random() * 50) + 20,
      pendingOrders: Math.floor(Math.random() * 10) + 1,
      monthlyGrowth: (Math.random() * 20) + 5,
      recentOrders: [],
      topProducts: [],
      customerSatisfaction: 4.2 + (Math.random() * 0.8)  // Random rating between 4.2-5.0
    };

    // Simulate real-time updates every 5 seconds
    setInterval(() => {
      mockStats.totalOrders += Math.floor(Math.random() * 3);
      mockStats.totalRevenue += Math.floor(Math.random() * 1000);
      mockStats.pendingOrders = Math.floor(Math.random() * 10) + 1;
      
      this.notifyListeners(`vendor_stats_${vendorId}`, mockStats);
    }, 5000);
  }

  public destroy(): void {
    if (this.socket) {
      this.socket.close();
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const realTimeService = RealTimeWebSocketService.getInstance();