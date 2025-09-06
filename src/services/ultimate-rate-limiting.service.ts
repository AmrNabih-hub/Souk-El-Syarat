/**
 * Ultimate Rate Limiting Service
 * Advanced rate limiting with multiple algorithms and Redis backend
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  algorithm: 'fixed' | 'sliding' | 'token-bucket' | 'leaky-bucket';
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (req: any, res: any) => void;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or endpoint
  config: RateLimitConfig;
  enabled: boolean;
  priority: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  totalHits: number;
  limit: number;
  windowMs: number;
}

export interface RateLimitMetrics {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  blockRate: number;
  averageResponseTime: number;
  rules: { [ruleId: string]: any };
}

export class UltimateRateLimitingService {
  private static instance: UltimateRateLimitingService;
  private redis: any; // Redis client
  private rules: Map<string, RateLimitRule>;
  private metrics: RateLimitMetrics;
  private isInitialized: boolean = false;

  // Default rate limiting rules for different endpoints
  private defaultRules: RateLimitRule[] = [
    {
      id: 'auth_login',
      name: 'Authentication Login',
      pattern: '/api/auth/login',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
        algorithm: 'sliding',
        skipSuccessfulRequests: true,
        keyGenerator: (req) => `auth_login:${req.ip}:${req.body?.email || 'unknown'}`
      },
      enabled: true,
      priority: 1
    },
    {
      id: 'auth_register',
      name: 'Authentication Register',
      pattern: '/api/auth/register',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // 3 registrations per hour
        algorithm: 'fixed',
        keyGenerator: (req) => `auth_register:${req.ip}`
      },
      enabled: true,
      priority: 1
    },
    {
      id: 'api_general',
      name: 'General API',
      pattern: '/api/*',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
        algorithm: 'sliding',
        keyGenerator: (req) => `api:${req.ip}`
      },
      enabled: true,
      priority: 3
    },
    {
      id: 'api_products',
      name: 'Products API',
      pattern: '/api/products*',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200, // 200 requests per minute
        algorithm: 'sliding',
        keyGenerator: (req) => `api_products:${req.ip}`
      },
      enabled: true,
      priority: 2
    },
    {
      id: 'api_search',
      name: 'Search API',
      pattern: '/api/products/search',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 50, // 50 searches per minute
        algorithm: 'sliding',
        keyGenerator: (req) => `api_search:${req.ip}`
      },
      enabled: true,
      priority: 2
    },
    {
      id: 'api_orders',
      name: 'Orders API',
      pattern: '/api/orders*',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10, // 10 orders per hour
        algorithm: 'fixed',
        keyGenerator: (req) => `api_orders:${req.user?.id || req.ip}`
      },
      enabled: true,
      priority: 1
    },
    {
      id: 'api_upload',
      name: 'File Upload API',
      pattern: '/api/upload*',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10, // 10 uploads per hour
        algorithm: 'token-bucket',
        keyGenerator: (req) => `api_upload:${req.user?.id || req.ip}`
      },
      enabled: true,
      priority: 1
    },
    {
      id: 'realtime_chat',
      name: 'Real-time Chat',
      pattern: '/api/chat*',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 500, // 500 messages per minute
        algorithm: 'sliding',
        keyGenerator: (req) => `realtime_chat:${req.user?.id || req.ip}`
      },
      enabled: true,
      priority: 2
    }
  ];

  static getInstance(): UltimateRateLimitingService {
    if (!UltimateRateLimitingService.instance) {
      UltimateRateLimitingService.instance = new UltimateRateLimitingService();
    }
    return UltimateRateLimitingService.instance;
  }

  constructor() {
    this.rules = new Map();
    this.metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      blockRate: 0,
      averageResponseTime: 0,
      rules: {}
    };
    this.initializeRules();
  }

  private initializeRules(): void {
    this.defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
      this.metrics.rules[rule.id] = {
        requests: 0,
        allowed: 0,
        blocked: 0,
        blockRate: 0
      };
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔗 Initializing rate limiting service...');
      
      // Initialize Redis client for rate limiting
      this.redis = {
        // Simulate Redis client for now - in production, use actual Redis client
        get: this.simulateRedisGet.bind(this),
        set: this.simulateRedisSet.bind(this),
        incr: this.simulateRedisIncr.bind(this),
        expire: this.simulateRedisExpire.bind(this),
        ttl: this.simulateRedisTtl.bind(this),
        del: this.simulateRedisDel.bind(this),
        eval: this.simulateRedisEval.bind(this)
      };

      this.isInitialized = true;
      console.log('✅ Rate limiting service initialized successfully');
    } catch (error) {
      console.error('❌ Rate limiting service initialization failed:', error);
      throw error;
    }
  }

  // Main rate limiting check
  async checkRateLimit(req: any, res?: any): Promise<RateLimitResult> {
    if (!this.isInitialized) {
      throw new Error('Rate limiting service not initialized');
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Find matching rule
      const rule = this.findMatchingRule(req);
      if (!rule || !rule.enabled) {
        this.metrics.allowedRequests++;
        this.updateMetrics(startTime);
        return this.createAllowResult();
      }

      // Generate rate limit key
      const key = this.generateKey(rule, req);
      
      // Check rate limit based on algorithm
      const result = await this.checkRateLimitByAlgorithm(rule, key);
      
      // Update metrics
      this.metrics.rules[rule.id].requests++;
      if (result.allowed) {
        this.metrics.allowedRequests++;
        this.metrics.rules[rule.id].allowed++;
      } else {
        this.metrics.blockedRequests++;
        this.metrics.rules[rule.id].blocked++;
        
        // Call limit reached callback
        if (rule.config.onLimitReached && res) {
          rule.config.onLimitReached(req, res);
        }
      }

      this.updateMetrics(startTime);
      return result;
    } catch (error) {
      console.error('Rate limiting check error:', error);
      this.metrics.allowedRequests++; // Allow on error
      this.updateMetrics(startTime);
      return this.createAllowResult();
    }
  }

  // Rate limiting middleware
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const result = await this.checkRateLimit(req, res);
        
        // Set rate limit headers
        this.setRateLimitHeaders(res, result);
        
        if (result.allowed) {
          next();
        } else {
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: result.retryAfter,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime
          });
        }
      } catch (error) {
        console.error('Rate limiting middleware error:', error);
        next(); // Allow request on error
      }
    };
  }

  // Rule management
  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
    this.metrics.rules[rule.id] = {
      requests: 0,
      allowed: 0,
      blocked: 0,
      blockRate: 0
    };
    console.log(`📝 Rate limiting rule added: ${rule.name}`);
  }

  updateRule(ruleId: string, updates: Partial<RateLimitRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      console.log(`📝 Rate limiting rule updated: ${rule.name}`);
    }
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    delete this.metrics.rules[ruleId];
    console.log(`🗑️ Rate limiting rule removed: ${ruleId}`);
  }

  getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  // Metrics and monitoring
  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  async getRateLimitStats(): Promise<any> {
    if (!this.isInitialized) {
      return { error: 'Service not initialized' };
    }

    try {
      const stats = {
        metrics: this.metrics,
        rules: this.getRules(),
        redis: {
          connected: true, // In production, check actual Redis connection
          memory: 0, // In production, get from Redis INFO
          keys: 0 // In production, get from Redis INFO
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return { error: error.message };
    }
  }

  // Private methods
  private findMatchingRule(req: any): RateLimitRule | null {
    const url = req.url || req.path || '';
    const method = req.method || 'GET';
    
    // Find rule with highest priority that matches
    const matchingRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && this.matchesPattern(url, rule.pattern))
      .sort((a, b) => b.priority - a.priority);
    
    return matchingRules[0] || null;
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }

  private generateKey(rule: RateLimitRule, req: any): string {
    if (rule.config.keyGenerator) {
      return rule.config.keyGenerator(req);
    }
    
    // Default key generation
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const user = req.user?.id || 'anonymous';
    return `rate_limit:${rule.id}:${ip}:${user}`;
  }

  private async checkRateLimitByAlgorithm(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    const config = rule.config;
    
    switch (config.algorithm) {
      case 'fixed':
        return await this.checkFixedWindow(rule, key);
      case 'sliding':
        return await this.checkSlidingWindow(rule, key);
      case 'token-bucket':
        return await this.checkTokenBucket(rule, key);
      case 'leaky-bucket':
        return await this.checkLeakyBucket(rule, key);
      default:
        return await this.checkFixedWindow(rule, key);
    }
  }

  private async checkFixedWindow(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    const config = rule.config;
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;
    
    const current = await this.redis.incr(windowKey);
    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(config.windowMs / 1000));
    }
    
    const allowed = current <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - current);
    const resetTime = windowStart + config.windowMs;
    
    return {
      allowed,
      remaining,
      resetTime,
      totalHits: current,
      limit: config.maxRequests,
      windowMs: config.windowMs
    };
  }

  private async checkSlidingWindow(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    const config = rule.config;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Use Redis sorted set for sliding window
    const script = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      -- Remove old entries
      redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
      
      -- Count current entries
      local current = redis.call('ZCARD', key)
      
      if current < limit then
        -- Add new entry
        redis.call('ZADD', key, now, now)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        return {1, limit - current - 1, now + window}
      else
        return {0, 0, now + window}
      end
    `;
    
    const result = await this.redis.eval(script, 1, key, config.windowMs, config.maxRequests, now);
    
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
      totalHits: config.maxRequests - result[1],
      limit: config.maxRequests,
      windowMs: config.windowMs
    };
  }

  private async checkTokenBucket(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    const config = rule.config;
    const now = Date.now();
    const bucketKey = `${key}:bucket`;
    
    // Token bucket implementation
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add
      local timePassed = now - lastRefill
      local tokensToAdd = math.floor(timePassed * refillRate / 1000)
      tokens = math.min(capacity, tokens + tokensToAdd)
      
      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {1, math.floor(tokens), now + 1000}
      else
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {0, 0, now + 1000}
      end
    `;
    
    const refillRate = config.maxRequests / (config.windowMs / 1000); // tokens per second
    const result = await this.redis.eval(script, 1, bucketKey, config.maxRequests, refillRate, now);
    
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
      totalHits: config.maxRequests - result[1],
      limit: config.maxRequests,
      windowMs: config.windowMs
    };
  }

  private async checkLeakyBucket(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    // Leaky bucket implementation
    const config = rule.config;
    const now = Date.now();
    const bucketKey = `${key}:leaky`;
    
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local leakRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'level', 'lastLeak')
      local level = tonumber(bucket[1]) or 0
      local lastLeak = tonumber(bucket[2]) or now
      
      -- Calculate leaked amount
      local timePassed = now - lastLeak
      local leaked = math.floor(timePassed * leakRate / 1000)
      level = math.max(0, level - leaked)
      
      if level < capacity then
        level = level + 1
        redis.call('HMSET', key, 'level', level, 'lastLeak', now)
        redis.call('EXPIRE', key, 3600)
        return {1, capacity - level, now + 1000}
      else
        redis.call('HMSET', key, 'level', level, 'lastLeak', now)
        redis.call('EXPIRE', key, 3600)
        return {0, 0, now + 1000}
      end
    `;
    
    const leakRate = config.maxRequests / (config.windowMs / 1000); // leaks per second
    const result = await this.redis.eval(script, 1, bucketKey, config.maxRequests, leakRate, now);
    
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
      totalHits: config.maxRequests - result[1],
      limit: config.maxRequests,
      windowMs: config.windowMs
    };
  }

  private createAllowResult(): RateLimitResult {
    return {
      allowed: true,
      remaining: 999999,
      resetTime: Date.now() + 60000,
      totalHits: 0,
      limit: 999999,
      windowMs: 60000
    };
  }

  private setRateLimitHeaders(res: any, result: RateLimitResult): void {
    res.set('X-RateLimit-Limit', result.limit.toString());
    res.set('X-RateLimit-Remaining', result.remaining.toString());
    res.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.allowed && result.retryAfter) {
      res.set('Retry-After', result.retryAfter.toString());
    }
  }

  private updateMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
    
    this.metrics.blockRate = 
      this.metrics.totalRequests > 0 ? 
      (this.metrics.blockedRequests / this.metrics.totalRequests) * 100 : 0;
  }

  // Simulation methods for development
  private async simulateRedisGet(key: string): Promise<string | null> {
    await new Promise(resolve => setTimeout(resolve, 1));
    return null;
  }

  private async simulateRedisSet(key: string, value: string, mode?: string, ttl?: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1));
    return 'OK';
  }

  private async simulateRedisIncr(key: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 1));
    return Math.floor(Math.random() * 10) + 1;
  }

  private async simulateRedisExpire(key: string, ttl: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 1));
    return 1;
  }

  private async simulateRedisTtl(key: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 1));
    return 300;
  }

  private async simulateRedisDel(key: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 1));
    return 1;
  }

  private async simulateRedisEval(script: string, numKeys: number, ...args: any[]): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2));
    return [1, 5, Date.now() + 60000]; // Simulate success
  }
}

export default UltimateRateLimitingService;