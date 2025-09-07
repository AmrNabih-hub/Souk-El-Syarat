import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ExternalServiceHealthIndicator } from './indicators/external-service.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    ExternalServiceHealthIndicator,
  ],
})
export class HealthModule {}