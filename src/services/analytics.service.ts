/**
 * Real-time Analytics and Monitoring Service
 * Enterprise-level analytics with real-time data collection and insights
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { 
  ref, 
  push, 
  set, 
  get, 
  onValue, 
  off 
} from 'firebase/database';
import { db, realtimeDb } from '@/config/firebase.config';

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  page: string;
  userAgent: string;
  ipAddress?: string;
  referrer?: string;
  duration?: number;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  pageViews: number;
  uniquePageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  revenue: number;
  orders: number;
  products: number;
}

export interface RealTimeAnalytics {
  activeUsers: number;
  currentPageViews: number;
  topPages: Array<{ page: string; views: number }>;
  userLocations: Array<{ country: string; users: number }>;
  deviceTypes: Array<{ device: string; users: number }>;
  browsers: Array<{ browser: string; users: number }>;
  realTimeEvents: AnalyticsEvent[];
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export type AnalyticsEventType = 
  | 'page_view'
  | 'user_action'
  | 'ecommerce'
  | 'error'
  | 'performance'
  | 'custom';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = true;
  private realTimeSubscriptions: Map<string, () => void> = new Map();

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      this.userId = userId;
      this.sessionId = this.generateSessionId();
      
      // Set up connection monitoring
      this.setupConnectionMonitoring();
      
      // Track session start
      await this.trackEvent('user_action', 'session_start', {
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      });

      // Set up real-time listeners
      this.setupRealTimeListeners();

      console.log('✅ Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('page_view', 'page_view', {
      page,
      ...properties
    });
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('user_action', action, properties);
  }

  /**
   * Track ecommerce event
   */
  async trackEcommerceEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('ecommerce', eventName, properties);
  }

  /**
   * Track error
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('error', 'error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metrics: PerformanceMetrics): Promise<void> {
    await this.trackEvent('performance', 'performance_metrics', metrics);
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('custom', eventName, properties);
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(): Promise<RealTimeAnalytics> {
    try {
      const analyticsRef = ref(realtimeDb, 'analytics/realTime');
      const snapshot = await new Promise((resolve, reject) => {
        onValue(analyticsRef, resolve, reject, { onlyOnce: true });
      });

      const data = snapshot.val() || {};
      
      return {
        activeUsers: data.activeUsers || 0,
        currentPageViews: data.currentPageViews || 0,
        topPages: data.topPages || [],
        userLocations: data.userLocations || [],
        deviceTypes: data.deviceTypes || [],
        browsers: data.browsers || [],
        realTimeEvents: data.realTimeEvents || []
      };
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics metrics
   */
  async getAnalyticsMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<AnalyticsMetrics> {
    try {
      const now = new Date();
      const startTime = this.getStartTime(now, timeRange);
      
      const eventsRef = collection(db, 'analytics/events');
      const q = query(
        eventsRef,
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent));

      return this.calculateMetrics(events);
    } catch (error) {
      console.error('Error getting analytics metrics:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time analytics updates
   */
  subscribeToRealTimeAnalytics(callback: (analytics: RealTimeAnalytics) => void): () => void {
    const analyticsRef = ref(realtimeDb, 'analytics/realTime');
    
    const unsubscribe = onValue(analyticsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const analytics: RealTimeAnalytics = {
        activeUsers: data.activeUsers || 0,
        currentPageViews: data.currentPageViews || 0,
        topPages: data.topPages || [],
        userLocations: data.userLocations || [],
        deviceTypes: data.deviceTypes || [],
        browsers: data.browsers || [],
        realTimeEvents: data.realTimeEvents || []
      };
      callback(analytics);
    });

    this.realTimeSubscriptions.set('realTimeAnalytics', unsubscribe);
    return unsubscribe;
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<{
    totalSessions: number;
    totalPageViews: number;
    averageSessionDuration: number;
    favoritePages: string[];
    lastActive: Date;
  }> {
    try {
      const eventsRef = collection(db, 'analytics/events');
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent));

      const sessions = new Set(events.map(e => e.sessionId));
      const pageViews = events.filter(e => e.eventType === 'page_view');
      const sessionStarts = events.filter(e => e.eventName === 'session_start');

      return {
        totalSessions: sessions.size,
        totalPageViews: pageViews.length,
        averageSessionDuration: this.calculateAverageSessionDuration(events),
        favoritePages: this.getFavoritePages(events),
        lastActive: events[0]?.timestamp || new Date()
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const performanceRef = ref(realtimeDb, 'analytics/performance');
      const snapshot = await new Promise((resolve, reject) => {
        onValue(performanceRef, resolve, reject, { onlyOnce: true });
      });

      const data = snapshot.val() || {};
      
      return {
        pageLoadTime: data.pageLoadTime || 0,
        apiResponseTime: data.apiResponseTime || 0,
        errorRate: data.errorRate || 0,
        uptime: data.uptime || 100,
        memoryUsage: data.memoryUsage || 0,
        cpuUsage: data.cpuUsage || 0
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(
    startDate: Date, 
    endDate: Date, 
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const eventsRef = collection(db, 'analytics/events');
      const q = query(
        eventsRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent));

      if (format === 'csv') {
        return this.convertToCSV(events);
      } else {
        return JSON.stringify(events, null, 2);
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // Private helper methods

  private async trackEvent(
    eventType: AnalyticsEventType,
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.userId,
        sessionId: this.sessionId,
        eventType,
        eventName,
        properties,
        timestamp: new Date(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Add to queue
      this.eventQueue.push(event);

      // Process queue if online
      if (this.isOnline) {
        await this.processEventQueue();
      }

      // Update real-time analytics
      await this.updateRealTimeAnalytics(event);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const batch = this.eventQueue.splice(0, 10); // Process 10 events at a time
      
      for (const event of batch) {
        // Store in Firestore
        await addDoc(collection(db, 'analytics/events'), {
          ...event,
          timestamp: serverTimestamp()
        });

        // Update real-time database
        const realTimeRef = ref(realtimeDb, `analytics/realTime/events/${event.id}`);
        await set(realTimeRef, event);
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...batch);
    }
  }

  private async updateRealTimeAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      const analyticsRef = ref(realtimeDb, 'analytics/realTime');
      
      // Update active users
      if (event.eventType === 'user_action' && event.eventName === 'session_start') {
        await set(ref(realtimeDb, 'analytics/realTime/activeUsers'), increment(1));
      }

      // Update page views
      if (event.eventType === 'page_view') {
        await set(ref(realtimeDb, 'analytics/realTime/currentPageViews'), increment(1));
      }

      // Update top pages
      const topPagesRef = ref(realtimeDb, `analytics/realTime/topPages/${event.page}`);
      await set(topPagesRef, increment(1));

    } catch (error) {
      console.error('Error updating real-time analytics:', error);
    }
  }

  private setupConnectionMonitoring(): void {
    const connectedRef = ref(realtimeDb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      this.isOnline = snapshot.val() === true;
      
      if (this.isOnline && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    });
  }

  private setupRealTimeListeners(): void {
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
    
    // Set up error tracking
    this.setupErrorTracking();
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.trackPerformance({
        pageLoadTime: loadTime,
        apiResponseTime: 0,
        errorRate: 0,
        uptime: 100,
        memoryUsage: 0,
        cpuUsage: 0
      });
    });

    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        this.trackPerformance({
          pageLoadTime: 0,
          apiResponseTime: duration,
          errorRate: 0,
          uptime: 100,
          memoryUsage: 0,
          cpuUsage: 0
        });
        
        return response;
      } catch (error) {
        this.trackError(error as Error, { context: 'fetch' });
        throw error;
      }
    };
  }

  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        context: 'unhandledrejection'
      });
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStartTime(now: Date, timeRange: string): Date {
    const start = new Date(now);
    switch (timeRange) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  private calculateMetrics(events: AnalyticsEvent[]): AnalyticsMetrics {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const uniquePages = new Set(pageViews.map(e => e.page));
    const sessions = new Set(events.map(e => e.sessionId));

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: uniqueUsers.size,
      newUsers: 0, // Would need additional logic to determine new vs returning
      returningUsers: 0,
      pageViews: pageViews.length,
      uniquePageViews: uniquePages.size,
      averageSessionDuration: this.calculateAverageSessionDuration(events),
      bounceRate: this.calculateBounceRate(events),
      conversionRate: this.calculateConversionRate(events),
      revenue: this.calculateRevenue(events),
      orders: events.filter(e => e.eventName === 'purchase').length,
      products: events.filter(e => e.eventName === 'view_item').length
    };
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const sessions = new Map<string, AnalyticsEvent[]>();
    
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
    });

    let totalDuration = 0;
    let sessionCount = 0;

    sessions.forEach(sessionEvents => {
      if (sessionEvents.length > 1) {
        const start = Math.min(...sessionEvents.map(e => e.timestamp.getTime()));
        const end = Math.max(...sessionEvents.map(e => e.timestamp.getTime()));
        totalDuration += end - start;
        sessionCount++;
      }
    });

    return sessionCount > 0 ? totalDuration / sessionCount : 0;
  }

  private calculateBounceRate(events: AnalyticsEvent[]): number {
    const sessions = new Map<string, AnalyticsEvent[]>();
    
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
    });

    let bounceCount = 0;
    sessions.forEach(sessionEvents => {
      if (sessionEvents.length === 1) {
        bounceCount++;
      }
    });

    return sessions.size > 0 ? (bounceCount / sessions.size) * 100 : 0;
  }

  private calculateConversionRate(events: AnalyticsEvent[]): number {
    const sessions = new Set(events.map(e => e.sessionId));
    const purchases = events.filter(e => e.eventName === 'purchase');
    const purchaseSessions = new Set(purchases.map(e => e.sessionId));

    return sessions.size > 0 ? (purchaseSessions.size / sessions.size) * 100 : 0;
  }

  private calculateRevenue(events: AnalyticsEvent[]): number {
    const purchases = events.filter(e => e.eventName === 'purchase');
    return purchases.reduce((total, event) => {
      return total + (event.properties.value || 0);
    }, 0);
  }

  private getFavoritePages(events: AnalyticsEvent[]): string[] {
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const pageCounts = new Map<string, number>();

    pageViews.forEach(event => {
      const count = pageCounts.get(event.page) || 0;
      pageCounts.set(event.page, count + 1);
    });

    return Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page]) => page);
  }

  private convertToCSV(events: AnalyticsEvent[]): string {
    if (events.length === 0) return '';

    const headers = ['id', 'userId', 'sessionId', 'eventType', 'eventName', 'timestamp', 'page'];
    const rows = events.map(event => [
      event.id,
      event.userId || '',
      event.sessionId,
      event.eventType,
      event.eventName,
      event.timestamp.toISOString(),
      event.page
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.realTimeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.realTimeSubscriptions.clear();
    this.eventQueue = [];
  }
}

export default AnalyticsService;