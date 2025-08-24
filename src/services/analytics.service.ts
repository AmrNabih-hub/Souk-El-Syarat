import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

export interface AnalyticsEvent {
  id: string;
  type:
    | 'page_view'
    | 'product_view'
    | 'search'
    | 'add_to_cart'
    | 'purchase'
    | 'user_action'
    | 'system_event';
  userId?: string;
  sessionId: string;
  productId?: string;
  vendorId?: string;
  orderId?: string;
  category?: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  timestamp: Date;
}

export interface SystemMetrics {
  id: string;
  type: 'performance' | 'usage' | 'error' | 'business';
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface BusinessMetrics {
  totalUsers: number;
  activeUsers: number;
  totalVendors: number;
  activeVendors: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topCategories: Array<{ category: string; count: number; revenue: number }>;
  topVendors: Array<{ vendorId: string; vendorName: string; orders: number; revenue: number }>;
  topProducts: Array<{ productId: string; productName: string; views: number; sales: number }>;
  revenueByPeriod: Array<{ period: string; revenue: number; orders: number }>;
  userGrowth: Array<{ period: string; newUsers: number; totalUsers: number }>;
  lastUpdated: Date;
}

export interface RealTimeStats {
  onlineUsers: number;
  activeVendors: number;
  pendingOrders: number;
  processingOrders: number;
  recentOrders: Array<{
    orderId: string;
    customerName: string;
    vendorName: string;
    amount: number;
    status: string;
    timestamp: Date;
  }>;
  recentSignups: Array<{
    userId: string;
    userName: string;
    userType: 'customer' | 'vendor';
    timestamp: Date;
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  lastUpdated: Date;
}

export class AnalyticsService {
  private static EVENTS_COLLECTION = 'analytics_events';
  private static METRICS_COLLECTION = 'system_metrics';
  private static BUSINESS_METRICS_DOC = 'business_metrics';
  private static REALTIME_STATS_DOC = 'realtime_stats';

  /**
   * Track analytics event
   */
  static async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const eventData = {
        ...event,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.EVENTS_COLLECTION), eventData);

      // Update real-time counters based on event type
      await this.updateRealTimeCounters(event);

      return docRef.id;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error tracking analytics event:', error);
      throw new Error('Failed to track analytics event');
    }
  }

  /**
   * Track multiple events in batch
   */
  static async trackEvents(
    events: Array<Omit<AnalyticsEvent, 'id' | 'timestamp'>>
  ): Promise<string[]> {
    try {
      const promises = events.map(event => this.trackEvent(event));
      return await Promise.all(promises);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error tracking batch analytics events:', error);
      throw new Error('Failed to track batch analytics events');
    }
  }

  /**
   * Track system metric
   */
  static async trackMetric(
    type: SystemMetrics['type'],
    metric: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): Promise<string> {
    try {
      const metricData: Omit<SystemMetrics, 'id'> = {
        type,
        metric,
        value,
        unit,
        tags,
        timestamp: new Date(),
      };

      const docRef = await addDoc(collection(db, this.METRICS_COLLECTION), {
        ...metricData,
        timestamp: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error tracking system metric:', error);
      throw new Error('Failed to track system metric');
    }
  }

  /**
   * Get business metrics with real-time updates
   */
  static subscribeToBusinessMetrics(callback: (metrics: BusinessMetrics) => void): () => void {
    const metricsDoc = doc(db, 'analytics', this.BUSINESS_METRICS_DOC);

    return onSnapshot(metricsDoc, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const metrics: BusinessMetrics = {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as BusinessMetrics;
        callback(metrics);
      }
    });
  }

  /**
   * Get real-time stats with live updates
   */
  static subscribeToRealTimeStats(callback: (stats: RealTimeStats) => void): () => void {
    const statsDoc = doc(db, 'analytics', this.REALTIME_STATS_DOC);

    return onSnapshot(statsDoc, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const stats: RealTimeStats = {
          ...data,
          recentOrders:
            data.recentOrders?.map((order: unknown) => ({
              ...order,
              timestamp: order.timestamp?.toDate() || new Date(),
            })) || [],
          recentSignups:
            data.recentSignups?.map((signup: unknown) => ({
              ...signup,
              timestamp: signup.timestamp?.toDate() || new Date(),
            })) || [],
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as RealTimeStats;
        callback(stats);
      }
    });
  }

  /**
   * Update business metrics (should be called periodically)
   */
  static async updateBusinessMetrics(): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        // Get all required data
        const usersQuery = query(collection(db, 'users'));
        const vendorsQuery = query(collection(db, 'vendors'), where('status', '==', 'approved'));
        const productsQuery = query(collection(db, 'products'), where('status', '==', 'published'));
        const ordersQuery = query(collection(db, 'orders'));

        const [usersSnapshot, vendorsSnapshot, productsSnapshot, ordersSnapshot] =
          await Promise.all([
            getDocs(usersQuery),
            getDocs(vendorsQuery),
            getDocs(productsQuery),
            getDocs(ordersQuery),
          ]);

        // Calculate metrics
        const totalUsers = usersSnapshot.size;
        const totalVendors = vendorsSnapshot.size;
        const totalProducts = productsSnapshot.size;
        const totalOrders = ordersSnapshot.size;

        let totalRevenue = 0;
        let completedOrders = 0;
        const categoryStats: Record<string, { count: number; revenue: number }> = {};
        const vendorStats: Record<string, { name: string; orders: number; revenue: number }> = {};

        ordersSnapshot.forEach(orderDoc => {
          const order = orderDoc.data();
          if (order.status === 'delivered' || order.status === 'completed') {
            completedOrders++;
            totalRevenue += order.finalAmount || 0;

            // Category stats
            order.items?.forEach((item: unknown) => {
              const category = item.category || 'other';
              if (!categoryStats[category]) {
                categoryStats[category] = { count: 0, revenue: 0 };
              }
              categoryStats[category].count += item.quantity;
              categoryStats[category].revenue += item.price * item.quantity;
            });

            // Vendor stats
            const vendorId = order.vendorId;
            if (vendorId) {
              if (!vendorStats[vendorId]) {
                vendorStats[vendorId] = {
                  name: order.vendorName || 'Unknown',
                  orders: 0,
                  revenue: 0,
                };
              }
              vendorStats[vendorId].orders++;
              vendorStats[vendorId].revenue += order.finalAmount || 0;
            }
          }
        });

        const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
        const conversionRate = totalUsers > 0 ? (completedOrders / totalUsers) * 100 : 0;

        // Top categories
        const topCategories = Object.entries(categoryStats)
          .map(([category, stats]) => ({ category, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        // Top vendors
        const topVendors = Object.entries(vendorStats)
          .map(([vendorId, stats]) => ({
            vendorId,
            vendorName: stats.name,
            orders: stats.orders,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        const businessMetrics: BusinessMetrics = {
          totalUsers,
          activeUsers: totalUsers, // Simplified - could be calculated based on recent activity
          totalVendors,
          activeVendors: totalVendors, // Simplified
          totalProducts,
          activeProducts: totalProducts, // Simplified
          totalOrders,
          completedOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate,
          topCategories,
          topVendors,
          topProducts: [], // Would need separate calculation
          revenueByPeriod: [], // Would need time-based calculation
          userGrowth: [], // Would need time-based calculation
          lastUpdated: new Date(),
        };

        // Update business metrics document
        const metricsDoc = doc(db, 'analytics', this.BUSINESS_METRICS_DOC);
        transaction.set(
          metricsDoc,
          {
            ...businessMetrics,
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating business metrics:', error);
      throw new Error('Failed to update business metrics');
    }
  }

  /**
   * Update real-time stats (should be called frequently)
   */
  static async updateRealTimeStats(): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        // Get recent orders
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);

        // Get recent signups
        const recentSignupsQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const recentSignupsSnapshot = await getDocs(recentSignupsQuery);

        // Get pending orders count
        const pendingOrdersQuery = query(
          collection(db, 'orders'),
          where('status', '==', 'pending')
        );
        const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);

        // Get processing orders count
        const processingOrdersQuery = query(
          collection(db, 'orders'),
          where('status', '==', 'processing')
        );
        const processingOrdersSnapshot = await getDocs(processingOrdersQuery);

        const recentOrders = recentOrdersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            orderId: doc.id,
            customerName: data.customerName,
            vendorName: data.vendorName,
            amount: data.finalAmount,
            status: data.status,
            timestamp: data.createdAt?.toDate() || new Date(),
          };
        });

        const recentSignups = recentSignupsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            userId: doc.id,
            userName: data.displayName,
            userType: data.role || 'customer',
            timestamp: data.createdAt?.toDate() || new Date(),
          };
        });

        const realTimeStats: RealTimeStats = {
          onlineUsers: 0, // Would need real-time presence system
          activeVendors: 0, // Would need real-time presence system
          pendingOrders: pendingOrdersSnapshot.size,
          processingOrders: processingOrdersSnapshot.size,
          recentOrders,
          recentSignups,
          systemHealth: {
            status: 'healthy',
            responseTime: 150, // Would be measured
            errorRate: 0.01, // Would be calculated
            uptime: 99.9, // Would be calculated
          },
          lastUpdated: new Date(),
        };

        // Update real-time stats document
        const statsDoc = doc(db, 'analytics', this.REALTIME_STATS_DOC);
        transaction.set(
          statsDoc,
          {
            ...realTimeStats,
            recentOrders: recentOrders.map(order => ({
              ...order,
              timestamp: serverTimestamp(),
            })),
            recentSignups: recentSignups.map(signup => ({
              ...signup,
              timestamp: serverTimestamp(),
            })),
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating real-time stats:', error);
      throw new Error('Failed to update real-time stats');
    }
  }

  /**
   * Update real-time counters based on events
   */
  private static async updateRealTimeCounters(
    event: Omit<AnalyticsEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const statsDoc = doc(db, 'analytics', this.REALTIME_STATS_DOC);

      // Update counters based on event type
      switch (event.type) {
        case 'user_action':
          if (event.action === 'login') {
            await updateDoc(statsDoc, {
              onlineUsers: increment(1),
              lastUpdated: serverTimestamp(),
            });
          }
          break;

        case 'purchase':
          // This would be handled by order creation
          break;

        default:
          // Generic event tracking
          break;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating real-time counters:', error);
    }
  }

  /**
   * Get analytics events with filtering
   */
  static async getAnalyticsEvents(
    filters: {
      type?: AnalyticsEvent['type'];
      userId?: string;
      productId?: string;
      vendorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limitCount: number = 100
  ): Promise<AnalyticsEvent[]> {
    try {
      let q = query(
        collection(db, this.EVENTS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Apply filters
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.productId) {
        q = query(q, where('productId', '==', filters.productId));
      }
      if (filters.vendorId) {
        q = query(q, where('vendorId', '==', filters.vendorId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as AnalyticsEvent[];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting analytics events:', error);
      throw new Error('Failed to get analytics events');
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(
    userId: string | undefined,
    sessionId: string,
    page: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      type: 'page_view',
      userId,
      sessionId,
      action: 'view',
      label: page,
      metadata,
    });
  }

  /**
   * Track product view
   */
  static async trackProductView(
    userId: string | undefined,
    sessionId: string,
    productId: string,
    vendorId: string,
    category?: string
  ): Promise<void> {
    await this.trackEvent({
      type: 'product_view',
      userId,
      sessionId,
      productId,
      vendorId,
      category,
      action: 'view',
      label: 'product_detail',
    });
  }

  /**
   * Track add to cart
   */
  static async trackAddToCart(
    userId: string | undefined,
    sessionId: string,
    productId: string,
    vendorId: string,
    quantity: number,
    value: number
  ): Promise<void> {
    await this.trackEvent({
      type: 'add_to_cart',
      userId,
      sessionId,
      productId,
      vendorId,
      action: 'add_to_cart',
      value,
      metadata: { quantity },
    });
  }

  /**
   * Track purchase
   */
  static async trackPurchase(
    userId: string,
    sessionId: string,
    orderId: string,
    vendorId: string,
    value: number,
    items: Array<{ productId: string; quantity: number; price: number }>
  ): Promise<void> {
    await this.trackEvent({
      type: 'purchase',
      userId,
      sessionId,
      orderId,
      vendorId,
      action: 'purchase',
      value,
      metadata: { items },
    });
  }

  /**
   * Track search
   */
  static async trackSearch(
    userId: string | undefined,
    sessionId: string,
    searchTerm: string,
    resultsCount: number,
    filters?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      type: 'search',
      userId,
      sessionId,
      action: 'search',
      label: searchTerm,
      value: resultsCount,
      metadata: { filters },
    });
  }
}
