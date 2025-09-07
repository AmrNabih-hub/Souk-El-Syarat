/**
 * Rate Limiting Service
 * Enterprise-level rate limiting and DDoS protection
 */

import { ref, set, get, push, remove } from 'firebase/database';
import { realtimeDb } from '@/config/firebase.config';

export interface RateLimitRule {
  id: string;
  name: string;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (key: string, rule: RateLimitRule) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds to wait before retry
  reason?: string;
}

export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedUsers: Array<{ userId: string; count: number }>;
}

export class RateLimitingService {
  private static instance: RateLimitingService;
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: Date }> = new Map();
  private blockedIPs: Set<string> = new Set();
  private blockedUsers: Set<string> = new Set();

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
    this.startCleanupInterval();
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    // Authentication rate limiting
    this.addRateLimitRule({
      id: 'auth_login',
      name: 'Login Attempts',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req) => `auth_login:${this.getClientIP(req)}`,
      onLimitReached: (key, rule) => this.handleRateLimitExceeded(key, rule, 'login')
    });

    // API rate limiting
    this.addRateLimitRule({
      id: 'api_general',
      name: 'General API',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      keyGenerator: (req) => `api:${this.getClientIP(req)}`,
      onLimitReached: (key, rule) => this.handleRateLimitExceeded(key, rule, 'api')
    });

    // File upload rate limiting
    this.addRateLimitRule({
      id: 'file_upload',
      name: 'File Upload',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      keyGenerator: (req) => `upload:${this.getClientIP(req)}`,
      onLimitReached: (key, rule) => this.handleRateLimitExceeded(key, rule, 'upload')
    });

    // Search rate limiting
    this.addRateLimitRule({
      id: 'search',
      name: 'Search Requests',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      keyGenerator: (req) => `search:${this.getClientIP(req)}`,
      onLimitReached: (key, rule) => this.handleRateLimitExceeded(key, rule, 'search')
    });

    // Admin operations rate limiting
    this.addRateLimitRule({
      id: 'admin_operations',
      name: 'Admin Operations',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyGenerator: (req) => `admin:${this.getUserId(req)}`,
      onLimitReached: (key, rule) => this.handleRateLimitExceeded(key, rule, 'admin')
    });

    // Vendor operations rate limiting
    this.addRateLimitRule({
      id: 'vendor_operations',
      name: 'Vendor Operations',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      keyGenerator: (req) => `vendor:${this.getUserId(req)}`,
      onLimitReached: (key, rule) => this.handleRateLimitExceeded(key, rule, 'vendor')
    });
  }

  /**
   * Add a rate limiting rule
   */
  addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.set(rule.id, rule);
  }

  /**
   * Check if request is allowed based on rate limiting rules
   */
  async checkRateLimit(ruleId: string, request: any): Promise<RateLimitResult> {
    const rule = this.rateLimitRules.get(ruleId);
    if (!rule) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + 60000)
      };
    }

    const key = rule.keyGenerator ? rule.keyGenerator(request) : `default:${this.getClientIP(request)}`;
    const now = new Date();
    
    // Check if IP or user is blocked
    if (this.isBlocked(key)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + rule.windowMs),
        retryAfter: Math.ceil(rule.windowMs / 1000),
        reason: 'IP or user is blocked'
      };
    }

    // Get current count
    const currentCount = this.requestCounts.get(key);
    const resetTime = currentCount ? currentCount.resetTime : new Date(now.getTime() + rule.windowMs);
    
    // Check if window has expired
    if (now >= resetTime) {
      this.requestCounts.delete(key);
      this.requestCounts.set(key, { count: 1, resetTime: new Date(now.getTime() + rule.windowMs) });
      
      await this.logRateLimitEvent(key, ruleId, 1, rule.maxRequests, true);
      
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: new Date(now.getTime() + rule.windowMs)
      };
    }

    // Check if limit exceeded
    if (currentCount && currentCount.count >= rule.maxRequests) {
      await this.logRateLimitEvent(key, ruleId, currentCount.count, rule.maxRequests, false);
      
      if (rule.onLimitReached) {
        rule.onLimitReached(key, rule);
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: resetTime,
        retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
        reason: 'Rate limit exceeded'
      };
    }

    // Increment count
    const newCount = (currentCount?.count || 0) + 1;
    this.requestCounts.set(key, { count: newCount, resetTime });

    await this.logRateLimitEvent(key, ruleId, newCount, rule.maxRequests, true);

    return {
      allowed: true,
      remaining: rule.maxRequests - newCount,
      resetTime: resetTime
    };
  }

  /**
   * Check multiple rate limits
   */
  async checkMultipleRateLimits(ruleIds: string[], request: any): Promise<RateLimitResult[]> {
    const results = await Promise.all(
      ruleIds.map(ruleId => this.checkRateLimit(ruleId, request))
    );

    return results;
  }

  /**
   * Check if key is blocked
   */
  private isBlocked(key: string): boolean {
    const ip = this.extractIPFromKey(key);
    const userId = this.extractUserIdFromKey(key);
    
    return this.blockedIPs.has(ip) || (userId && this.blockedUsers.has(userId));
  }

  /**
   * Handle rate limit exceeded
   */
  private handleRateLimitExceeded(key: string, rule: RateLimitRule, type: string): void {
    const ip = this.extractIPFromKey(key);
    const userId = this.extractUserIdFromKey(key);

    // Block IP for repeated violations
    this.blockedIPs.add(ip);
    
    if (userId) {
      this.blockedUsers.add(userId);
    }

    // Log security event
    this.logSecurityEvent(key, `rate_limit_exceeded_${type}`, {
      ruleId: rule.id,
      ruleName: rule.name,
      ip,
      userId,
      windowMs: rule.windowMs,
      maxRequests: rule.maxRequests
    });

    // Auto-unblock after extended period
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      if (userId) {
        this.blockedUsers.delete(userId);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Extract IP from key
   */
  private extractIPFromKey(key: string): string {
    const parts = key.split(':');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Extract user ID from key
   */
  private extractUserIdFromKey(key: string): string | null {
    const parts = key.split(':');
    return parts.length > 1 ? parts[1] : null;
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: any): string {
    return request?.ip || 
           request?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           request?.connection?.remoteAddress ||
           'unknown';
  }

  /**
   * Get user ID from request
   */
  private getUserId(request: any): string {
    return request?.user?.id || 
           request?.userId || 
           'anonymous';
  }

  /**
   * Log rate limit event
   */
  private async logRateLimitEvent(
    key: string, 
    ruleId: string, 
    count: number, 
    maxRequests: number, 
    allowed: boolean
  ): Promise<void> {
    try {
      const eventRef = ref(realtimeDb, `rateLimitLogs/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await set(eventRef, {
        key,
        ruleId,
        count,
        maxRequests,
        allowed,
        timestamp: new Date().toISOString(),
        ip: this.extractIPFromKey(key),
        userId: this.extractUserIdFromKey(key)
      });
    } catch (error) {
      console.error('Error logging rate limit event:', error);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(key: string, event: string, metadata: any): Promise<void> {
    try {
      const eventRef = ref(realtimeDb, `securityEvents/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await set(eventRef, {
        key,
        event,
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getRateLimitStats(): Promise<RateLimitStats> {
    try {
      const statsRef = ref(realtimeDb, 'rateLimitLogs');
      const snapshot = await get(statsRef);
      
      if (!snapshot.exists()) {
        return {
          totalRequests: 0,
          blockedRequests: 0,
          allowedRequests: 0,
          topBlockedIPs: [],
          topBlockedUsers: []
        };
      }

      const logs = snapshot.val();
      const logEntries = Object.values(logs) as any[];

      const totalRequests = logEntries.length;
      const blockedRequests = logEntries.filter(log => !log.allowed).length;
      const allowedRequests = totalRequests - blockedRequests;

      // Calculate top blocked IPs
      const ipCounts: Record<string, number> = {};
      logEntries.forEach(log => {
        if (!log.allowed && log.ip) {
          ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
        }
      });

      const topBlockedIPs = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate top blocked users
      const userCounts: Record<string, number> = {};
      logEntries.forEach(log => {
        if (!log.allowed && log.userId) {
          userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
        }
      });

      const topBlockedUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalRequests,
        blockedRequests,
        allowedRequests,
        topBlockedIPs,
        topBlockedUsers
      };
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return {
        totalRequests: 0,
        blockedRequests: 0,
        allowedRequests: 0,
        topBlockedIPs: [],
        topBlockedUsers: []
      };
    }
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, duration: number = 24 * 60 * 60 * 1000): void {
    this.blockedIPs.add(ip);
    
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  /**
   * Block user
   */
  blockUser(userId: string, duration: number = 24 * 60 * 60 * 1000): void {
    this.blockedUsers.add(userId);
    
    setTimeout(() => {
      this.blockedUsers.delete(userId);
    }, duration);
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  /**
   * Unblock user
   */
  unblockUser(userId: string): void {
    this.blockedUsers.delete(userId);
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  /**
   * Get blocked users
   */
  getBlockedUsers(): string[] {
    return Array.from(this.blockedUsers);
  }

  /**
   * Clear all rate limiting data
   */
  clearAllData(): void {
    this.requestCounts.clear();
    this.blockedIPs.clear();
    this.blockedUsers.clear();
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredCounts();
    }, 60 * 1000); // Every minute
  }

  /**
   * Cleanup expired counts
   */
  private cleanupExpiredCounts(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, count] of this.requestCounts.entries()) {
      if (now >= count.resetTime) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.requestCounts.delete(key);
    }
  }

  /**
   * Middleware for Express.js integration
   */
  createRateLimitMiddleware(ruleId: string) {
    return async (req: any, res: any, next: any) => {
      try {
        const result = await this.checkRateLimit(ruleId, req);
        
        if (!result.allowed) {
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: result.retryAfter,
            resetTime: result.resetTime
          });
          return;
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.rateLimitRules.get(ruleId)?.maxRequests || 0,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000)
        });

        next();
      } catch (error) {
        console.error('Rate limiting middleware error:', error);
        next();
      }
    };
  }
}

export default RateLimitingService;