import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { SecurityModule } from './modules/security/security.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { CacheModule } from './modules/cache/cache.module';
import { ValidationModule } from './modules/validation/validation.module';
import { LoggingModule } from './modules/logging/logging.module';
import { ErrorHandlingModule } from './modules/error-handling/error-handling.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { TracingModule } from './modules/tracing/tracing.module';
import { CircuitBreakerModule } from './modules/circuit-breaker/circuit-breaker.module';
import { LoadBalancerModule } from './modules/load-balancer/load-balancer.module';
import { ServiceDiscoveryModule } from './modules/service-discovery/service-discovery.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { ElasticsearchModule } from './modules/elasticsearch/elasticsearch.module';
import { PrometheusModule } from './modules/prometheus/prometheus.module';
import { JaegerModule } from './modules/jaeger/jaeger.module';
import { SentryModule } from './modules/sentry/sentry.module';
import { NewRelicModule } from './modules/newrelic/newrelic.module';
import { DataDogModule } from './modules/datadog/datadog.module';
import { LogRocketModule } from './modules/logrocket/logrocket.module';
import { HoneycombModule } from './modules/honeycomb/honeycomb.module';
import { LightstepModule } from './modules/lightstep/lightstep.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    ProxyModule,
    RateLimitModule,
    SecurityModule,
    MonitoringModule,
    CacheModule,
    ValidationModule,
    LoggingModule,
    ErrorHandlingModule,
    MetricsModule,
    TracingModule,
    CircuitBreakerModule,
    LoadBalancerModule,
    ServiceDiscoveryModule,
    ConfigurationModule,
    DatabaseModule,
    RedisModule,
    KafkaModule,
    ElasticsearchModule,
    PrometheusModule,
    JaegerModule,
    SentryModule,
    NewRelicModule,
    DataDogModule,
    LogRocketModule,
    HoneycombModule,
    LightstepModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}