/**
 * Rate Limiting Service
 * Enterprise-level rate limiting and DDoS protection
 */

export interface RateLimitRule {
  id: string;
  name: string;
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
}

export interface RateLimitConfig {
  global: RateLimitRule;
  endpoints: Record<string, RateLimitRule>;
  users: Record<string, RateLimitRule>;
  ipAddresses: Record<string, RateLimitRule>;
}

export class RateLimitingService {
  private static instance: RateLimitingService;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private blockedIPs: Map<string, number> = new Map();
  private blockedUsers: Map<string, number> = new Map();
  private suspiciousIPs: Map<string, { count: number; lastSeen: number }> = new Map();

  // Default rate limiting rules
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    global: {
      id: 'global',
      name: 'Global Rate Limit',
      maxRequests: 1000,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    endpoints: {
      '/api/auth/login': {
        id: 'login',
        name: 'Login Rate Limit',
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
      '/api/auth/signup': {
        id: 'signup',
        name: 'Signup Rate Limit',
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      },
      '/api/auth/reset-password': {
        id: 'reset-password',
        name: 'Password Reset Rate Limit',
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      },
      '/api/products': {
        id: 'products',
        name: 'Products API Rate Limit',
        maxRequests: 100,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
      '/api/orders': {
        id: 'orders',
        name: 'Orders API Rate Limit',
        maxRequests: 50,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
      '/api/upload': {
        id: 'upload',
        name: 'File Upload Rate Limit',
        maxRequests: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      },
    },
    users: {
      'customer': {
        id: 'customer',
        name: 'Customer Rate Limit',
        maxRequests: 200,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
      'vendor': {
        id: 'vendor',
        name: 'Vendor Rate Limit',
        maxRequests: 500,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
      'admin': {
        id: 'admin',
        name: 'Admin Rate Limit',
        maxRequests: 1000,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
    },
    ipAddresses: {
      'default': {
        id: 'ip-default',
        name: 'IP Address Rate Limit',
        maxRequests: 100,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 60 * 60 * 1000, // 1 hour
      },
    },
  };

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  /**
   * Check if request is allowed based on rate limiting rules
   */
  static async checkRateLimit(
    key: string,
    endpoint?: string,
    userRole?: string,
    ipAddress?: string
  ): Promise<RateLimitResult> {
    const instance = RateLimitingService.getInstance();
    
    try {
      // Check if IP is blocked
      if (ipAddress && instance.isIPBlocked(ipAddress)) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: instance.blockedIPs.get(ipAddress) || 0,
          reason: 'IP address is blocked'
        };
      }

      // Check if user is blocked
      if (userRole && instance.isUserBlocked(key)) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: instance.blockedUsers.get(key) || 0,
          reason: 'User is blocked'
        };
      }

      // Get applicable rate limit rules
      const rules = instance.getApplicableRules(endpoint, userRole, ipAddress);
      
      // Check each rule
      for (const rule of rules) {
        const result = await instance.checkRule(key, rule);
        if (!result.allowed) {
          // Block IP if too many violations
          if (ipAddress) {
            instance.trackSuspiciousActivity(ipAddress);
          }
          
          return result;
        }
      }

      // All rules passed
      const globalRule = instance.DEFAULT_CONFIG.global;
      const globalKey = `global:${ipAddress || 'unknown'}`;
      const globalResult = await instance.checkRule(globalKey, globalRule);
      
      return globalResult;

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 15 * 60 * 1000
      };
    }
  }

  /**
   * Record a request for rate limiting
   */
  static async recordRequest(
    key: string,
    endpoint?: string,
    userRole?: string,
    ipAddress?: string,
    success: boolean = true
  ): Promise<void> {
    const instance = RateLimitingService.getInstance();
    
    try {
      // Record global request
      const globalKey = `global:${ipAddress || 'unknown'}`;
      instance.recordRequestForKey(globalKey, instance.DEFAULT_CONFIG.global, success);

      // Record endpoint-specific request
      if (endpoint && instance.DEFAULT_CONFIG.endpoints[endpoint]) {
        const endpointKey = `endpoint:${endpoint}:${key}`;
        instance.recordRequestForKey(endpointKey, instance.DEFAULT_CONFIG.endpoints[endpoint], success);
      }

      // Record user-specific request
      if (userRole && instance.DEFAULT_CONFIG.users[userRole]) {
        const userKey = `user:${userRole}:${key}`;
        instance.recordRequestForKey(userKey, instance.DEFAULT_CONFIG.users[userRole], success);
      }

      // Record IP-specific request
      if (ipAddress) {
        const ipKey = `ip:${ipAddress}`;
        instance.recordRequestForKey(ipKey, instance.DEFAULT_CONFIG.ipAddresses.default, success);
      }

    } catch (error) {
      console.error('Error recording request:', error);
    }
  }

  /**
   * Get rate limit status for a key
   */
  static getRateLimitStatus(key: string, endpoint?: string, userRole?: string): RateLimitResult {
    const instance = RateLimitingService.getInstance();
    
    try {
      const rules = instance.getApplicableRules(endpoint, userRole);
      const results: RateLimitResult[] = [];

      for (const rule of rules) {
        const result = instance.checkRuleSync(key, rule);
        results.push(result);
      }

      // Return the most restrictive result
      const mostRestrictive = results.reduce((prev, current) => {
        if (!current.allowed) return current;
        if (!prev.allowed) return prev;
        return current.remaining < prev.remaining ? current : prev;
      });

      return mostRestrictive;

    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 15 * 60 * 1000
      };
    }
  }

  /**
   * Block an IP address
   */
  static blockIP(ipAddress: string, durationMs: number = 60 * 60 * 1000): void {
    const instance = RateLimitingService.getInstance();
    instance.blockedIPs.set(ipAddress, Date.now() + durationMs);
    console.warn(`IP address ${ipAddress} blocked for ${durationMs}ms`);
  }

  /**
   * Block a user
   */
  static blockUser(userId: string, durationMs: number = 60 * 60 * 1000): void {
    const instance = RateLimitingService.getInstance();
    instance.blockedUsers.set(userId, Date.now() + durationMs);
    console.warn(`User ${userId} blocked for ${durationMs}ms`);
  }

  /**
   * Unblock an IP address
   */
  static unblockIP(ipAddress: string): void {
    const instance = RateLimitingService.getInstance();
    instance.blockedIPs.delete(ipAddress);
    console.log(`IP address ${ipAddress} unblocked`);
  }

  /**
   * Unblock a user
   */
  static unblockUser(userId: string): void {
    const instance = RateLimitingService.getInstance();
    instance.blockedUsers.delete(userId);
    console.log(`User ${userId} unblocked`);
  }

  /**
   * Get blocked IPs
   */
  static getBlockedIPs(): string[] {
    const instance = RateLimitingService.getInstance();
    const now = Date.now();
    const blocked: string[] = [];

    for (const [ip, blockTime] of instance.blockedIPs.entries()) {
      if (blockTime > now) {
        blocked.push(ip);
      } else {
        instance.blockedIPs.delete(ip);
      }
    }

    return blocked;
  }

  /**
   * Get blocked users
   */
  static getBlockedUsers(): string[] {
    const instance = RateLimitingService.getInstance();
    const now = Date.now();
    const blocked: string[] = [];

    for (const [user, blockTime] of instance.blockedUsers.entries()) {
      if (blockTime > now) {
        blocked.push(user);
      } else {
        instance.blockedUsers.delete(user);
      }
    }

    return blocked;
  }

  /**
   * Get suspicious IPs
   */
  static getSuspiciousIPs(): Array<{ ip: string; count: number; lastSeen: number }> {
    const instance = RateLimitingService.getInstance();
    const suspicious: Array<{ ip: string; count: number; lastSeen: number }> = [];

    for (const [ip, data] of instance.suspiciousIPs.entries()) {
      suspicious.push({
        ip,
        count: data.count,
        lastSeen: data.lastSeen
      });
    }

    return suspicious.sort((a, b) => b.count - a.count);
  }

  // Private helper methods

  private getApplicableRules(endpoint?: string, userRole?: string, ipAddress?: string): RateLimitRule[] {
    const rules: RateLimitRule[] = [];

    // Add global rule
    rules.push(this.DEFAULT_CONFIG.global);

    // Add endpoint-specific rule
    if (endpoint && this.DEFAULT_CONFIG.endpoints[endpoint]) {
      rules.push(this.DEFAULT_CONFIG.endpoints[endpoint]);
    }

    // Add user role-specific rule
    if (userRole && this.DEFAULT_CONFIG.users[userRole]) {
      rules.push(this.DEFAULT_CONFIG.users[userRole]);
    }

    // Add IP-specific rule
    if (ipAddress) {
      rules.push(this.DEFAULT_CONFIG.ipAddresses.default);
    }

    return rules;
  }

  private async checkRule(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const fullKey = `${rule.id}:${key}`;
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    // Get current count
    const current = this.requestCounts.get(fullKey);
    
    if (!current || current.resetTime < now) {
      // New window
      this.requestCounts.set(fullKey, {
        count: 1,
        resetTime: now + rule.windowMs
      });
      
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: now + rule.windowMs
      };
    }

    // Check if limit exceeded
    if (current.count >= rule.maxRequests) {
      // Block if configured
      if (rule.blockDurationMs > 0) {
        const blockKey = `block:${rule.id}:${key}`;
        this.requestCounts.set(blockKey, {
          count: 1,
          resetTime: now + rule.blockDurationMs
        });
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
        reason: `Rate limit exceeded for ${rule.name}`
      };
    }

    // Increment count
    current.count++;
    this.requestCounts.set(fullKey, current);

    return {
      allowed: true,
      remaining: rule.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  private checkRuleSync(key: string, rule: RateLimitRule): RateLimitResult {
    const fullKey = `${rule.id}:${key}`;
    const now = Date.now();
    const current = this.requestCounts.get(fullKey);

    if (!current || current.resetTime < now) {
      return {
        allowed: true,
        remaining: rule.maxRequests,
        resetTime: now + rule.windowMs
      };
    }

    return {
      allowed: current.count < rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - current.count),
      resetTime: current.resetTime
    };
  }

  private recordRequestForKey(key: string, rule: RateLimitRule, success: boolean): void {
    const fullKey = `${rule.id}:${key}`;
    const now = Date.now();
    const current = this.requestCounts.get(fullKey);

    if (!current || current.resetTime < now) {
      this.requestCounts.set(fullKey, {
        count: 1,
        resetTime: now + rule.windowMs
      });
    } else {
      current.count++;
      this.requestCounts.set(fullKey, current);
    }
  }

  private isIPBlocked(ipAddress: string): boolean {
    const blockTime = this.blockedIPs.get(ipAddress);
    if (!blockTime) return false;
    
    if (blockTime < Date.now()) {
      this.blockedIPs.delete(ipAddress);
      return false;
    }
    
    return true;
  }

  private isUserBlocked(userId: string): boolean {
    const blockTime = this.blockedUsers.get(userId);
    if (!blockTime) return false;
    
    if (blockTime < Date.now()) {
      this.blockedUsers.delete(userId);
      return false;
    }
    
    return true;
  }

  private trackSuspiciousActivity(ipAddress: string): void {
    const now = Date.now();
    const existing = this.suspiciousIPs.get(ipAddress);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
    } else {
      this.suspiciousIPs.set(ipAddress, {
        count: 1,
        lastSeen: now
      });
    }

    // Auto-block if too many violations
    const suspicious = this.suspiciousIPs.get(ipAddress);
    if (suspicious && suspicious.count > 10) {
      this.blockIP(ipAddress, 24 * 60 * 60 * 1000); // Block for 24 hours
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    
    // Cleanup request counts
    for (const [key, data] of this.requestCounts.entries()) {
      if (data.resetTime < now) {
        this.requestCounts.delete(key);
      }
    }
    
    // Cleanup blocked IPs
    for (const [ip, blockTime] of this.blockedIPs.entries()) {
      if (blockTime < now) {
        this.blockedIPs.delete(ip);
      }
    }
    
    // Cleanup blocked users
    for (const [user, blockTime] of this.blockedUsers.entries()) {
      if (blockTime < now) {
        this.blockedUsers.delete(user);
      }
    }
    
    // Cleanup suspicious IPs (older than 24 hours)
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > 24 * 60 * 60 * 1000) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Initialize cleanup interval
const rateLimitingService = RateLimitingService.getInstance();
setInterval(() => {
  rateLimitingService['cleanup']();
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export default RateLimitingService;