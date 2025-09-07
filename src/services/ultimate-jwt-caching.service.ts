/**
 * Ultimate JWT Token Caching Service
 * High-performance JWT token caching and validation
 */

export interface TokenCacheEntry {
  token: string;
  payload: any;
  userId: string;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  isValid: boolean;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: any;
  error?: string;
  fromCache: boolean;
  responseTime: number;
}

export interface TokenCacheMetrics {
  totalTokens: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  expiredTokens: number;
  invalidTokens: number;
  memoryUsage: number;
}

export interface TokenBlacklistEntry {
  token: string;
  userId: string;
  reason: string;
  blacklistedAt: number;
  expiresAt: number;
}

export class UltimateJWTTokenCachingService {
  private static instance: UltimateJWTTokenCachingService;
  private tokenCache: Map<string, TokenCacheEntry>;
  private blacklist: Map<string, TokenBlacklistEntry>;
  private metrics: TokenCacheMetrics;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxCacheSize: number = 10000;
  private defaultTTL: number = 3600; // 1 hour

  static getInstance(): UltimateJWTTokenCachingService {
    if (!UltimateJWTTokenCachingService.instance) {
      UltimateJWTTokenCachingService.instance = new UltimateJWTTokenCachingService();
    }
    return UltimateJWTTokenCachingService.instance;
  }

  constructor() {
    this.tokenCache = new Map();
    this.blacklist = new Map();
    this.metrics = {
      totalTokens: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      expiredTokens: 0,
      invalidTokens: 0,
      memoryUsage: 0
    };
    this.startCleanupInterval();
  }

  // Initialize the service
  async initialize(): Promise<void> {
    console.log('🔐 Initializing JWT token caching service...');
    
    try {
      // Start cleanup interval
      this.startCleanupInterval();
      
      // Load existing blacklist
      await this.loadBlacklist();
      
      console.log('✅ JWT token caching service initialized');
    } catch (error) {
      console.error('❌ JWT token caching service initialization failed:', error);
      throw error;
    }
  }

  // Cache a JWT token
  async cacheToken(token: string, payload: any, userId: string, ttl?: number): Promise<boolean> {
    try {
      const expiresAt = Date.now() + (ttl || this.defaultTTL) * 1000;
      
      const entry: TokenCacheEntry = {
        token,
        payload,
        userId,
        expiresAt,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        isValid: true
      };

      // Check cache size limit
      if (this.tokenCache.size >= this.maxCacheSize) {
        await this.evictOldestTokens();
      }

      this.tokenCache.set(token, entry);
      this.metrics.totalTokens++;
      
      console.log(`✅ Token cached for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to cache token:', error);
      return false;
    }
  }

  // Validate a JWT token (with caching)
  async validateToken(token: string): Promise<TokenValidationResult> {
    const startTime = Date.now();
    
    try {
      // Check blacklist first
      if (this.blacklist.has(token)) {
        this.metrics.invalidTokens++;
        return {
          valid: false,
          error: 'Token is blacklisted',
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      }

      // Check cache
      const cachedEntry = this.tokenCache.get(token);
      if (cachedEntry) {
        // Check if token is expired
        if (Date.now() > cachedEntry.expiresAt) {
          this.tokenCache.delete(token);
          this.metrics.expiredTokens++;
          this.metrics.cacheMisses++;
          return {
            valid: false,
            error: 'Token expired',
            fromCache: false,
            responseTime: Date.now() - startTime
          };
        }

        // Update access statistics
        cachedEntry.lastAccessed = Date.now();
        cachedEntry.accessCount++;
        
        this.metrics.cacheHits++;
        this.updateMetrics(startTime);
        
        return {
          valid: true,
          payload: cachedEntry.payload,
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      }

      // Token not in cache, validate it
      const validationResult = await this.validateTokenDirectly(token);
      
      if (validationResult.valid) {
        // Cache the valid token
        await this.cacheToken(
          token,
          validationResult.payload,
          validationResult.payload?.userId || 'unknown'
        );
      }

      this.metrics.cacheMisses++;
      this.updateMetrics(startTime);
      
      return {
        ...validationResult,
        fromCache: false,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      this.metrics.cacheMisses++;
      this.updateMetrics(startTime);
      
      return {
        valid: false,
        error: error.message,
        fromCache: false,
        responseTime: Date.now() - startTime
      };
    }
  }

  // Get cached token
  async getCachedToken(token: string): Promise<TokenCacheEntry | null> {
    const entry = this.tokenCache.get(token);
    
    if (entry) {
      // Check if token is expired
      if (Date.now() > entry.expiresAt) {
        this.tokenCache.delete(token);
        this.metrics.expiredTokens++;
        return null;
      }

      // Update access statistics
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      
      return entry;
    }
    
    return null;
  }

  // Invalidate a token
  async invalidateToken(token: string, reason: string = 'Manual invalidation'): Promise<boolean> {
    try {
      // Remove from cache
      const removed = this.tokenCache.delete(token);
      
      // Add to blacklist
      const entry = this.tokenCache.get(token);
      if (entry) {
        const blacklistEntry: TokenBlacklistEntry = {
          token,
          userId: entry.userId,
          reason,
          blacklistedAt: Date.now(),
          expiresAt: entry.expiresAt
        };
        this.blacklist.set(token, blacklistEntry);
      }
      
      console.log(`✅ Token invalidated: ${reason}`);
      return removed;
    } catch (error) {
      console.error('❌ Failed to invalidate token:', error);
      return false;
    }
  }

  // Invalidate all tokens for a user
  async invalidateUserTokens(userId: string, reason: string = 'User logout'): Promise<number> {
    let invalidatedCount = 0;
    
    try {
      // Find and invalidate all tokens for the user
      for (const [token, entry] of this.tokenCache) {
        if (entry.userId === userId) {
          await this.invalidateToken(token, reason);
          invalidatedCount++;
        }
      }
      
      console.log(`✅ Invalidated ${invalidatedCount} tokens for user ${userId}`);
      return invalidatedCount;
    } catch (error) {
      console.error('❌ Failed to invalidate user tokens:', error);
      return 0;
    }
  }

  // Blacklist management
  async addToBlacklist(token: string, userId: string, reason: string, expiresAt?: number): Promise<boolean> {
    try {
      const blacklistEntry: TokenBlacklistEntry = {
        token,
        userId,
        reason,
        blacklistedAt: Date.now(),
        expiresAt: expiresAt || Date.now() + (24 * 60 * 60 * 1000) // 24 hours default
      };
      
      this.blacklist.set(token, blacklistEntry);
      console.log(`✅ Token added to blacklist: ${reason}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add token to blacklist:', error);
      return false;
    }
  }

  async removeFromBlacklist(token: string): Promise<boolean> {
    try {
      const removed = this.blacklist.delete(token);
      console.log(`✅ Token removed from blacklist`);
      return removed;
    } catch (error) {
      console.error('❌ Failed to remove token from blacklist:', error);
      return false;
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    console.log('🗑️ Clearing token cache...');
    this.tokenCache.clear();
    this.metrics.totalTokens = 0;
    console.log('✅ Token cache cleared');
  }

  async clearExpiredTokens(): Promise<number> {
    console.log('🗑️ Clearing expired tokens...');
    
    let clearedCount = 0;
    const now = Date.now();
    
    for (const [token, entry] of this.tokenCache) {
      if (now > entry.expiresAt) {
        this.tokenCache.delete(token);
        clearedCount++;
      }
    }
    
    this.metrics.expiredTokens += clearedCount;
    console.log(`✅ Cleared ${clearedCount} expired tokens`);
    return clearedCount;
  }

  async evictOldestTokens(): Promise<number> {
    console.log('🗑️ Evicting oldest tokens...');
    
    const entries = Array.from(this.tokenCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const evictCount = Math.floor(this.maxCacheSize * 0.1); // Evict 10%
    let evictedCount = 0;
    
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this.tokenCache.delete(entries[i][0]);
      evictedCount++;
    }
    
    console.log(`✅ Evicted ${evictedCount} oldest tokens`);
    return evictedCount;
  }

  // Token validation (direct)
  private async validateTokenDirectly(token: string): Promise<TokenValidationResult> {
    try {
      // Simulate JWT validation
      // In a real implementation, you would use a JWT library
      const payload = this.decodeJWT(token);
      
      if (!payload) {
        return {
          valid: false,
          error: 'Invalid token format',
          fromCache: false,
          responseTime: 0
        };
      }

      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return {
          valid: false,
          error: 'Token expired',
          fromCache: false,
          responseTime: 0
        };
      }

      return {
        valid: true,
        payload,
        fromCache: false,
        responseTime: 0
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        fromCache: false,
        responseTime: 0
      };
    }
  }

  // JWT decoding (simplified)
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  // Cleanup interval
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, 60000); // Cleanup every minute
  }

  private async performCleanup(): Promise<void> {
    try {
      // Clear expired tokens
      await this.clearExpiredTokens();
      
      // Clear expired blacklist entries
      await this.clearExpiredBlacklistEntries();
      
      // Update memory usage
      this.updateMemoryUsage();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  private async clearExpiredBlacklistEntries(): Promise<number> {
    let clearedCount = 0;
    const now = Date.now();
    
    for (const [token, entry] of this.blacklist) {
      if (now > entry.expiresAt) {
        this.blacklist.delete(token);
        clearedCount++;
      }
    }
    
    return clearedCount;
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    // Calculate cache memory usage
    for (const [token, entry] of this.tokenCache) {
      totalSize += token.length * 2; // Rough estimate
      totalSize += JSON.stringify(entry).length * 2;
    }
    
    // Calculate blacklist memory usage
    for (const [token, entry] of this.blacklist) {
      totalSize += token.length * 2;
      totalSize += JSON.stringify(entry).length * 2;
    }
    
    this.metrics.memoryUsage = totalSize;
  }

  private updateMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
    
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.hitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }

  // Load blacklist from storage
  private async loadBlacklist(): Promise<void> {
    try {
      // In a real implementation, you would load from Redis or database
      console.log('📥 Loading blacklist...');
    } catch (error) {
      console.error('❌ Failed to load blacklist:', error);
    }
  }

  // Save blacklist to storage
  private async saveBlacklist(): Promise<void> {
    try {
      // In a real implementation, you would save to Redis or database
      console.log('💾 Saving blacklist...');
    } catch (error) {
      console.error('❌ Failed to save blacklist:', error);
    }
  }

  // Get metrics
  getMetrics(): TokenCacheMetrics {
    return { ...this.metrics };
  }

  // Get cache statistics
  getCacheStats(): any {
    return {
      cacheSize: this.tokenCache.size,
      blacklistSize: this.blacklist.size,
      maxCacheSize: this.maxCacheSize,
      metrics: this.metrics,
      memoryUsage: this.metrics.memoryUsage
    };
  }

  // Get all cached tokens
  getCachedTokens(): TokenCacheEntry[] {
    return Array.from(this.tokenCache.values());
  }

  // Get blacklisted tokens
  getBlacklistedTokens(): TokenBlacklistEntry[] {
    return Array.from(this.blacklist.values());
  }

  // Health check
  async healthCheck(): Promise<{ status: string; metrics: TokenCacheMetrics }> {
    return {
      status: 'healthy',
      metrics: this.metrics
    };
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.tokenCache.clear();
    this.blacklist.clear();
  }
}

export default UltimateJWTTokenCachingService;