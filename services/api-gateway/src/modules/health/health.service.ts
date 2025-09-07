import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ExternalServiceHealthIndicator } from './indicators/external-service.health';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseHealth: DatabaseHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly externalServiceHealth: ExternalServiceHealthIndicator,
  ) {}

  async getHealthStatus() {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const version = process.env.npm_package_version || '1.0.0';
    const uptime = process.uptime();

    try {
      // Check all health indicators
      const [database, redis, services] = await Promise.allSettled([
        this.databaseHealth.check(),
        this.redisHealth.check(),
        this.externalServiceHealth.check(),
      ]);

      const checks = {
        database: database.status === 'fulfilled' ? database.value : { status: 'down', error: database.reason },
        redis: redis.status === 'fulfilled' ? redis.value : { status: 'down', error: redis.reason },
        services: services.status === 'fulfilled' ? services.value : { status: 'down', error: services.reason },
      };

      // Determine overall status
      const allHealthy = Object.values(checks).every(check => check.status === 'up' || check.status === 'healthy');
      const status = allHealthy ? 'ok' : 'degraded';

      return {
        status,
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime * 100) / 100,
        version,
        environment,
        checks,
        system: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
            external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
          },
          cpu: {
            usage: process.cpuUsage(),
            loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
          },
          uptime: Math.round(uptime * 100) / 100,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime * 100) / 100,
        version,
        environment,
        error: error.message,
        checks: {
          database: { status: 'unknown' },
          redis: { status: 'unknown' },
          services: { status: 'unknown' },
        },
      };
    }
  }

  async getReadinessStatus() {
    try {
      // Check if the service is ready to accept traffic
      const [database, redis] = await Promise.allSettled([
        this.databaseHealth.check(),
        this.redisHealth.check(),
      ]);

      const checks = {
        database: database.status === 'fulfilled' && database.value.status === 'up' ? 'ready' : 'not ready',
        redis: redis.status === 'fulfilled' && redis.value.status === 'up' ? 'ready' : 'not ready',
        services: 'ready', // Assume services are ready if we can check them
      };

      const allReady = Object.values(checks).every(check => check === 'ready');
      const status = allReady ? 'ready' : 'not ready';

      return {
        status,
        timestamp: new Date().toISOString(),
        checks,
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: 'unknown',
          redis: 'unknown',
          services: 'unknown',
        },
      };
    }
  }

  async getLivenessStatus() {
    // Liveness check - is the service alive and running?
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Check if memory usage is too high (potential memory leak)
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB
    const isMemoryHealthy = memoryUsage.heapUsed < memoryThreshold;

    // Check if uptime is reasonable (not just started)
    const isUptimeHealthy = uptime > 10; // At least 10 seconds

    const status = isMemoryHealthy && isUptimeHealthy ? 'alive' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime * 100) / 100,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        healthy: isMemoryHealthy,
      },
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}