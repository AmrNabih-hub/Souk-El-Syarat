/**
 * Real-time Analytics Engine
 * Provides comprehensive analytics with live updates
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, onValue, set, push } from 'firebase/database';

interface AnalyticsMetric {
  id: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

interface UserBehavior {
  userId: string;
  sessionId: string;
  events: Array<{
    type: string;
    timestamp: Date;
    data: any;
  }>;
  device: {
    type: string;
    browser: string;
    os: string;
  };
  location?: {
    country: string;
    city: string;
  };
}

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  errorRate: number;
  uptime: number;
}

interface BusinessMetrics {
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    returning: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
    trending: string[];
  };
  vendors: {
    total: number;
    active: number;
    topPerformers: string[];
  };
}

class AnalyticsEngineService {
  private static instance: AnalyticsEngineService;
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private userBehaviors: Map<string, UserBehavior> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
    errorRate: 0,
    uptime: 99.9
  };
  private businessMetrics: BusinessMetrics = {
    revenue: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
    orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
    customers: { total: 0, active: 0, new: 0, returning: 0 },
    products: { total: 0, active: 0, outOfStock: 0, trending: [] },
    vendors: { total: 0, active: 0, topPerformers: [] }
  };

  private constructor() {
    this.initializeAnalytics();
    this.startRealTimeMonitoring();
  }

  static getInstance(): AnalyticsEngineService {
    if (!AnalyticsEngineService.instance) {
      AnalyticsEngineService.instance = new AnalyticsEngineService();
    }
    return AnalyticsEngineService.instance;
  }

  /**
   * Initialize analytics system
   */
  private async initializeAnalytics() {
    await this.loadHistoricalData();
    this.setupRealtimeListeners();
    this.startMetricsCollection();
  }

  /**
   * Load historical data for baseline
   */
  private async loadHistoricalData() {
    try {
      // Load orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate revenue
      let totalRevenue = 0;
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      orders.forEach(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const amount = order.totalAmount || 0;
        
        totalRevenue += amount;
        
        if (orderDate >= dayAgo) {
          this.businessMetrics.revenue.daily += amount;
        }
        if (orderDate >= weekAgo) {
          this.businessMetrics.revenue.weekly += amount;
        }
        if (orderDate >= monthAgo) {
          this.businessMetrics.revenue.monthly += amount;
        }
        
        this.businessMetrics.revenue.yearly = totalRevenue;
      });

      // Update order metrics
      this.businessMetrics.orders.total = orders.length;
      this.businessMetrics.orders.pending = orders.filter(o => o.status === 'pending').length;
      this.businessMetrics.orders.completed = orders.filter(o => o.status === 'delivered').length;
      this.businessMetrics.orders.cancelled = orders.filter(o => o.status === 'cancelled').length;

      // Load customers
      const customersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'customer'))
      );
      this.businessMetrics.customers.total = customersSnapshot.size;

      // Load products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      this.businessMetrics.products.total = productsSnapshot.size;
      this.businessMetrics.products.active = productsSnapshot.docs.filter(
        doc => doc.data().isActive !== false
      ).length;
      this.businessMetrics.products.outOfStock = productsSnapshot.docs.filter(
        doc => (doc.data().quantity || 0) === 0
      ).length;

      // Load vendors
      const vendorsSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'vendor'))
      );
      this.businessMetrics.vendors.total = vendorsSnapshot.size;

    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  /**
   * Setup real-time listeners
   */
  private setupRealtimeListeners() {
    // Listen to orders
    onSnapshot(collection(db, 'orders'), (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const order = change.doc.data();
          this.businessMetrics.orders.total++;
          this.businessMetrics.revenue.daily += order.totalAmount || 0;
          
          // Track real-time revenue
          this.updateMetric('revenue_realtime', order.totalAmount || 0);
        }
        
        if (change.type === 'modified') {
          const order = change.doc.data();
          // Update status counts
          this.recalculateOrderMetrics();
        }
      });
    });

    // Listen to user activity
    const activityRef = ref(realtimeDb, 'userActivity');
    onValue(activityRef, (snapshot) => {
      const activities = snapshot.val();
      if (activities) {
        Object.entries(activities).forEach(([userId, activity]: [string, any]) => {
          this.trackUserBehavior(userId, activity);
        });
      }
    });

    // Listen to performance metrics
    const performanceRef = ref(realtimeDb, 'performance');
    onValue(performanceRef, (snapshot) => {
      const performance = snapshot.val();
      if (performance) {
        this.performanceMetrics = { ...this.performanceMetrics, ...performance };
      }
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection() {
    // Collect metrics every minute
    setInterval(() => {
      this.collectPerformanceMetrics();
      this.calculateTrends();
      this.identifyAnomalies();
    }, 60000);

    // Update real-time dashboard every 5 seconds
    setInterval(() => {
      this.broadcastMetrics();
    }, 5000);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring() {
    // Monitor page performance
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.performanceMetrics.pageLoadTime = entry.duration;
          }
          if (entry.entryType === 'resource') {
            // Track API calls
            if (entry.name.includes('api') || entry.name.includes('firestore')) {
              this.performanceMetrics.apiResponseTime = 
                (this.performanceMetrics.apiResponseTime + entry.duration) / 2;
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
    }

    // Monitor errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(event.reason);
      });
    }
  }

  /**
   * Track user behavior
   */
  trackUserBehavior(userId: string, activity: any) {
    const sessionId = activity.sessionId || `session_${Date.now()}`;
    
    if (!this.userBehaviors.has(sessionId)) {
      this.userBehaviors.set(sessionId, {
        userId,
        sessionId,
        events: [],
        device: this.detectDevice(),
        location: activity.location
      });
    }

    const behavior = this.userBehaviors.get(sessionId)!;
    behavior.events.push({
      type: activity.type,
      timestamp: new Date(),
      data: activity.data
    });

    // Analyze behavior patterns
    this.analyzeBehaviorPatterns(behavior);
  }

  /**
   * Detect device information
   */
  private detectDevice() {
    if (typeof window === 'undefined') {
      return { type: 'unknown', browser: 'unknown', os: 'unknown' };
    }

    const ua = window.navigator.userAgent;
    const type = /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 'desktop';
    const browser = /Chrome/.test(ua) ? 'Chrome' : 
                   /Firefox/.test(ua) ? 'Firefox' : 
                   /Safari/.test(ua) ? 'Safari' : 'Other';
    const os = /Windows/.test(ua) ? 'Windows' :
              /Mac/.test(ua) ? 'MacOS' :
              /Linux/.test(ua) ? 'Linux' :
              /Android/.test(ua) ? 'Android' :
              /iOS|iPhone|iPad/.test(ua) ? 'iOS' : 'Other';

    return { type, browser, os };
  }

  /**
   * Analyze behavior patterns
   */
  private analyzeBehaviorPatterns(behavior: UserBehavior) {
    // Identify user journey
    const journey = behavior.events.map(e => e.type).join(' -> ');
    
    // Detect potential issues
    const bounceEvents = behavior.events.filter(e => e.type === 'page_exit');
    if (bounceEvents.length > 0 && behavior.events.length < 3) {
      this.trackMetric('bounce_rate', 1);
    }

    // Track conversion funnel
    const cartEvents = behavior.events.filter(e => e.type === 'add_to_cart');
    const checkoutEvents = behavior.events.filter(e => e.type === 'checkout');
    const purchaseEvents = behavior.events.filter(e => e.type === 'purchase');
    
    if (cartEvents.length > 0) {
      this.trackMetric('cart_abandonment', checkoutEvents.length === 0 ? 1 : 0);
    }
    
    if (checkoutEvents.length > 0) {
      this.trackMetric('checkout_conversion', purchaseEvents.length > 0 ? 1 : 0);
    }
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics() {
    // Calculate error rate
    const totalRequests = this.getMetricValue('total_requests') || 1;
    const totalErrors = this.getMetricValue('total_errors') || 0;
    this.performanceMetrics.errorRate = (totalErrors / totalRequests) * 100;

    // Save to database
    set(ref(realtimeDb, 'analytics/performance'), this.performanceMetrics);
  }

  /**
   * Calculate trends
   */
  private calculateTrends() {
    this.metrics.forEach((metric, key) => {
      const previousValue = this.getMetricValue(`${key}_previous`) || metric.value;
      const change = ((metric.value - previousValue) / previousValue) * 100;
      
      metric.change = change;
      metric.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      
      this.updateMetric(`${key}_previous`, metric.value);
    });
  }

  /**
   * Identify anomalies
   */
  private identifyAnomalies() {
    // Check for unusual patterns
    const errorRate = this.performanceMetrics.errorRate;
    if (errorRate > 5) {
      this.sendAlert('High error rate detected', `Error rate: ${errorRate.toFixed(2)}%`);
    }

    const pageLoadTime = this.performanceMetrics.pageLoadTime;
    if (pageLoadTime > 3000) {
      this.sendAlert('Slow page load', `Load time: ${pageLoadTime.toFixed(0)}ms`);
    }

    // Check for sudden traffic spikes
    const currentTraffic = this.getMetricValue('active_users') || 0;
    const avgTraffic = this.getMetricValue('avg_active_users') || currentTraffic;
    if (currentTraffic > avgTraffic * 2) {
      this.sendAlert('Traffic spike detected', `Current: ${currentTraffic}, Average: ${avgTraffic}`);
    }
  }

  /**
   * Broadcast metrics to dashboard
   */
  private async broadcastMetrics() {
    const dashboard = {
      business: this.businessMetrics,
      performance: this.performanceMetrics,
      realtime: {
        activeUsers: this.userBehaviors.size,
        currentRevenue: this.getMetricValue('revenue_realtime') || 0,
        ordersPerMinute: this.getMetricValue('orders_per_minute') || 0,
        topProducts: await this.getTopProducts(),
        topVendors: await this.getTopVendors()
      },
      trends: Array.from(this.metrics.entries()).map(([key, metric]) => ({
        name: key,
        ...metric
      }))
    };

    // Save to realtime database
    await set(ref(realtimeDb, 'analytics/dashboard'), dashboard);
  }

  /**
   * Get top products
   */
  private async getTopProducts(): Promise<string[]> {
    try {
      const ordersSnapshot = await getDocs(
        query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      );

      const productCounts = new Map<string, number>();
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        order.items?.forEach((item: any) => {
          const count = productCounts.get(item.productId) || 0;
          productCounts.set(item.productId, count + item.quantity);
        });
      });

      return Array.from(productCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId]) => productId);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  /**
   * Get top vendors
   */
  private async getTopVendors(): Promise<string[]> {
    try {
      const ordersSnapshot = await getDocs(
        query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      );

      const vendorRevenue = new Map<string, number>();
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        const vendorId = order.vendorId;
        if (vendorId) {
          const revenue = vendorRevenue.get(vendorId) || 0;
          vendorRevenue.set(vendorId, revenue + (order.totalAmount || 0));
        }
      });

      return Array.from(vendorRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([vendorId]) => vendorId);
    } catch (error) {
      console.error('Error getting top vendors:', error);
      return [];
    }
  }

  /**
   * Recalculate order metrics
   */
  private async recalculateOrderMetrics() {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    this.businessMetrics.orders.pending = orders.filter(o => o.status === 'pending').length;
    this.businessMetrics.orders.completed = orders.filter(o => o.status === 'delivered').length;
    this.businessMetrics.orders.cancelled = orders.filter(o => o.status === 'cancelled').length;
  }

  /**
   * Track metric
   */
  trackMetric(name: string, value: number) {
    const existing = this.metrics.get(name);
    if (existing) {
      existing.value = (existing.value + value) / 2; // Moving average
      existing.timestamp = new Date();
    } else {
      this.metrics.set(name, {
        id: name,
        value,
        change: 0,
        trend: 'stable',
        timestamp: new Date()
      });
    }
  }

  /**
   * Update metric
   */
  private updateMetric(name: string, value: number) {
    this.metrics.set(name, {
      id: name,
      value,
      change: 0,
      trend: 'stable',
      timestamp: new Date()
    });
  }

  /**
   * Get metric value
   */
  private getMetricValue(name: string): number | undefined {
    return this.metrics.get(name)?.value;
  }

  /**
   * Track error
   */
  private trackError(error: any) {
    const currentErrors = this.getMetricValue('total_errors') || 0;
    this.updateMetric('total_errors', currentErrors + 1);
    
    // Log error details
    push(ref(realtimeDb, 'analytics/errors'), {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
  }

  /**
   * Send alert
   */
  private sendAlert(title: string, message: string) {
    push(ref(realtimeDb, 'analytics/alerts'), {
      title,
      message,
      severity: 'warning',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Public API
   */
  getBusinessMetrics(): BusinessMetrics {
    return this.businessMetrics;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }

  getUserBehaviors(): UserBehavior[] {
    return Array.from(this.userBehaviors.values());
  }

  trackEvent(eventName: string, data?: any) {
    const userId = data?.userId || 'anonymous';
    this.trackUserBehavior(userId, {
      type: eventName,
      data,
      timestamp: new Date()
    });
  }
}

export const analyticsEngine = AnalyticsEngineService.getInstance();