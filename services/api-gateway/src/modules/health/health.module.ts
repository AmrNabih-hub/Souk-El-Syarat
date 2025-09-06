import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ExternalServiceHealthIndicator } from './indicators/external-service.health';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    ExternalServiceHealthIndicator,
  ],
})
export class HealthModule {}