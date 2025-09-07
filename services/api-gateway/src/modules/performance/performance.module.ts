import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { CachingService } from './caching.service';
import { DatabaseOptimizationService } from './database-optimization.service';
import { CompressionService } from './compression.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX_ITEMS', 1000),
        store: 'memory', // In-memory cache
      }),
      inject: ['ConfigService'],
    }),
  ],
  controllers: [PerformanceController],
  providers: [
    PerformanceService,
    CachingService,
    DatabaseOptimizationService,
    CompressionService,
    PerformanceMonitoringService,
  ],
  exports: [
    PerformanceService,
    CachingService,
    DatabaseOptimizationService,
    CompressionService,
    PerformanceMonitoringService,
  ],
})
export class PerformanceModule {}