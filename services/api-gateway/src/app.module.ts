import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { SecurityModule } from './modules/security/security.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TestModule } from './test/test.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test/test.controller';
import { PerformanceController } from './modules/performance/performance.controller';
import { RealtimeController } from './modules/realtime/realtime.controller';
import { SecurityHeadersMiddleware } from './modules/security/middleware/security-headers.middleware';
import { RateLimitingMiddleware } from './modules/security/middleware/rate-limiting.middleware';
import { InputValidationMiddleware } from './modules/security/middleware/input-validation.middleware';
import { CorsMiddleware } from './modules/security/middleware/cors.middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 10,
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: 50,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: 100,
          },
        ],
        storage: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // JWT Authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-super-secret-jwt-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get('JWT_ISSUER', 'souk-el-syarat'),
          audience: configService.get('JWT_AUDIENCE', 'souk-el-syarat-api'),
        },
      }),
      inject: [ConfigService],
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Core modules
    HealthModule,
    AuthModule,
    SecurityModule,
    PerformanceModule,
    RealtimeModule,
    TestModule,
  ],
  controllers: [AppController, TestController, PerformanceController, RealtimeController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes('*');
    
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');
    
    consumer
      .apply(RateLimitingMiddleware)
      .forRoutes('*');
    
    consumer
      .apply(InputValidationMiddleware)
      .forRoutes('*');
  }
}