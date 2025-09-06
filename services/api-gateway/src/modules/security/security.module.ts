import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { RateLimitingMiddleware } from './middleware/rate-limiting.middleware';
import { InputValidationMiddleware } from './middleware/input-validation.middleware';
import { SecurityMonitoringService } from './security-monitoring.service';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
          },
          {
            name: 'auth',
            ttl: 60000, // 1 minute
            limit: 10, // 10 auth requests per minute
          },
          {
            name: 'api',
            ttl: 60000, // 1 minute
            limit: 200, // 200 API requests per minute
          },
        ],
        storage: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: ['ConfigService'],
    }),
  ],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    SecurityHeadersMiddleware,
    RateLimitingMiddleware,
    InputValidationMiddleware,
    SecurityMonitoringService,
  ],
  exports: [
    SecurityService,
    SecurityHeadersMiddleware,
    RateLimitingMiddleware,
    InputValidationMiddleware,
    SecurityMonitoringService,
  ],
})
export class SecurityModule {}