import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CachingService } from './caching.service';
import { DatabaseOptimizationService } from './database-optimization.service';
import { CompressionService } from './compression.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestCount: number;
  errorCount: number;
  cacheHitRate: number;
  databaseQueryTime: number;
  compressionRatio: number;
  timestamp: Date;
}

export interface PerformanceConfig {
  enableCaching: boolean;
  enableCompression: boolean;
  enableDatabaseOptimization: boolean;
  enableMonitoring: boolean;
  cacheTTL: number;
  compressionLevel: number;
  maxMemoryUsage: number;
  slowQueryThreshold: number;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly performanceConfig: PerformanceConfig;
  private readonly metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsHistory = 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly cachingService: CachingService,
    private readonly databaseOptimizationService: DatabaseOptimizationService,
    private readonly compressionService: CompressionService,
    private readonly performanceMonitoringService: PerformanceMonitoringService,
  ) {
    this.performanceConfig = this.loadPerformanceConfig();
    this.logger.log('Performance Service initialized');
  }

  private loadPerformanceConfig(): PerformanceConfig {
    return {
      enableCaching: this.configService.get<boolean>('PERFORMANCE_ENABLE_CACHING', true),
      enableCompression: this.configService.get<boolean>('PERFORMANCE_ENABLE_COMPRESSION', true),
      enableDatabaseOptimization: this.configService.get<boolean>('PERFORMANCE_ENABLE_DB_OPTIMIZATION', true),
      enableMonitoring: this.configService.get<boolean>('PERFORMANCE_ENABLE_MONITORING', true),
      cacheTTL: this.configService.get<number>('CACHE_TTL', 300),
      compressionLevel: this.configService.get<number>('COMPRESSION_LEVEL', 6),
      maxMemoryUsage: this.configService.get<number>('MAX_MEMORY_USAGE', 100 * 1024 * 1024), // 100MB
      slowQueryThreshold: this.configService.get<number>('SLOW_QUERY_THRESHOLD', 1000), // 1 second
    };
  }

  async optimizeRequest<T>(operation: () => Promise<T>, context: string): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    try {
      let result: T;

      // Check cache first if enabled
      if (this.performanceConfig.enableCaching) {
        const cacheKey = this.generateCacheKey(context);
        const cachedResult = await this.cachingService.get<T>(cacheKey);
        
        if (cachedResult) {
          this.logger.debug(`Cache hit for ${context}`);
          await this.recordMetrics({
            responseTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(startCpu),
            requestCount: 1,
            errorCount: 0,
            cacheHitRate: 1,
            databaseQueryTime: 0,
            compressionRatio: 0,
            timestamp: new Date(),
          });
          return cachedResult;
        }
      }

      // Execute operation
      result = await operation();

      // Cache result if enabled
      if (this.performanceConfig.enableCaching) {
        const cacheKey = this.generateCacheKey(context);
        await this.cachingService.set(cacheKey, result, this.performanceConfig.cacheTTL);
      }

      // Record metrics
      await this.recordMetrics({
        responseTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(startCpu),
        requestCount: 1,
        errorCount: 0,
        cacheHitRate: 0,
        databaseQueryTime: 0,
        compressionRatio: 0,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      this.logger.error(`Error in optimized request for ${context}:`, error);
      
      await this.recordMetrics({
        responseTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(startCpu),
        requestCount: 1,
        errorCount: 1,
        cacheHitRate: 0,
        databaseQueryTime: 0,
        compressionRatio: 0,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  async optimizeDatabaseQuery<T>(query: () => Promise<T>, queryName: string): Promise<T> {
    const startTime = Date.now();

    try {
      let result: T;

      // Check cache first
      if (this.performanceConfig.enableCaching) {
        const cacheKey = `db_query:${queryName}`;
        const cachedResult = await this.cachingService.get<T>(cacheKey);
        
        if (cachedResult) {
          this.logger.debug(`Database cache hit for ${queryName}`);
          return cachedResult;
        }
      }

      // Execute query with optimization
      if (this.performanceConfig.enableDatabaseOptimization) {
        result = await this.databaseOptimizationService.executeOptimizedQuery(query, queryName);
      } else {
        result = await query();
      }

      // Cache result
      if (this.performanceConfig.enableCaching) {
        const cacheKey = `db_query:${queryName}`;
        await this.cachingService.set(cacheKey, result, this.performanceConfig.cacheTTL);
      }

      const queryTime = Date.now() - startTime;
      
      // Log slow queries
      if (queryTime > this.performanceConfig.slowQueryThreshold) {
        this.logger.warn(`Slow query detected: ${queryName} took ${queryTime}ms`);
      }

      return result;

    } catch (error) {
      this.logger.error(`Database query error for ${queryName}:`, error);
      throw error;
    }
  }

  async compressResponse(data: any): Promise<Buffer> {
    if (!this.performanceConfig.enableCompression) {
      return Buffer.from(JSON.stringify(data));
    }

    try {
      return await this.compressionService.compress(data, this.performanceConfig.compressionLevel);
    } catch (error) {
      this.logger.error('Error compressing response:', error);
      return Buffer.from(JSON.stringify(data));
    }
  }

  async decompressResponse(compressedData: Buffer): Promise<any> {
    try {
      return await this.compressionService.decompress(compressedData);
    } catch (error) {
      this.logger.error('Error decompressing response:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    return [...this.metrics];
  }

  async getCurrentPerformanceMetrics(): Promise<PerformanceMetrics> {
    const recentMetrics = this.metrics.slice(-10);
    
    if (recentMetrics.length === 0) {
      return {
        responseTime: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        requestCount: 0,
        errorCount: 0,
        cacheHitRate: 0,
        databaseQueryTime: 0,
        compressionRatio: 0,
        timestamp: new Date(),
      };
    }

    // Calculate averages
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length;
    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);

    return {
      responseTime: avgResponseTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      requestCount: totalRequests,
      errorCount: totalErrors,
      cacheHitRate: avgCacheHitRate,
      databaseQueryTime: 0,
      compressionRatio: 0,
      timestamp: new Date(),
    };
  }

  async getPerformanceReport(): Promise<any> {
    const metrics = await this.getCurrentPerformanceMetrics();
    const config = this.performanceConfig;

    return {
      timestamp: new Date().toISOString(),
      config,
      metrics,
      recommendations: this.generateRecommendations(metrics),
      health: this.assessPerformanceHealth(metrics),
    };
  }

  private async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.splice(0, this.metrics.length - this.maxMetricsHistory);
    }

    // Log to monitoring service if enabled
    if (this.performanceConfig.enableMonitoring) {
      await this.performanceMonitoringService.recordMetrics(metrics);
    }
  }

  private generateCacheKey(context: string): string {
    return `perf:${context}:${Date.now()}`;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.responseTime > 1000) {
      recommendations.push('Consider enabling caching for slow endpoints');
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low, consider increasing cache TTL');
    }

    if (metrics.memoryUsage.heapUsed > this.performanceConfig.maxMemoryUsage) {
      recommendations.push('Memory usage is high, consider optimizing memory usage');
    }

    if (metrics.errorCount > 0) {
      recommendations.push('Errors detected, review error handling');
    }

    return recommendations;
  }

  private assessPerformanceHealth(metrics: PerformanceMetrics): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;

    // Response time scoring
    if (metrics.responseTime > 2000) score -= 30;
    else if (metrics.responseTime > 1000) score -= 20;
    else if (metrics.responseTime > 500) score -= 10;

    // Cache hit rate scoring
    if (metrics.cacheHitRate < 0.3) score -= 20;
    else if (metrics.cacheHitRate < 0.5) score -= 10;

    // Memory usage scoring
    const memoryUsagePercent = metrics.memoryUsage.heapUsed / this.performanceConfig.maxMemoryUsage;
    if (memoryUsagePercent > 0.9) score -= 30;
    else if (memoryUsagePercent > 0.7) score -= 20;
    else if (memoryUsagePercent > 0.5) score -= 10;

    // Error rate scoring
    if (metrics.errorCount > 0) score -= 15;

    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  getPerformanceConfig(): PerformanceConfig {
    return { ...this.performanceConfig };
  }
}