import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroservicesController } from './microservices.controller';
import { ServiceDiscoveryService } from './service-discovery.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { LoadBalancerService } from './load-balancer.service';
import { ServiceMeshService } from './service-mesh.service';
import { InterServiceCommunicationService } from './inter-service-communication.service';
import { ServiceHealthService } from './service-health.service';
import { ServiceMetricsService } from './service-metrics.service';

@Module({
  imports: [ConfigModule],
  controllers: [MicroservicesController],
  providers: [
    ServiceDiscoveryService,
    CircuitBreakerService,
    LoadBalancerService,
    ServiceMeshService,
    InterServiceCommunicationService,
    ServiceHealthService,
    ServiceMetricsService,
  ],
  exports: [
    ServiceDiscoveryService,
    CircuitBreakerService,
    LoadBalancerService,
    ServiceMeshService,
    InterServiceCommunicationService,
    ServiceHealthService,
    ServiceMetricsService,
  ],
})
export class MicroservicesModule {}