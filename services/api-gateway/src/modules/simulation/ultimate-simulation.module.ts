import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UltimateSimulationController } from './ultimate-simulation.controller';
import { UserBehaviorSimulationService } from './user-behavior-simulation.service';
import { SystemLoadSimulationService } from './system-load-simulation.service';
import { NetworkConditionSimulationService } from './network-condition-simulation.service';
import { DatabaseLoadSimulationService } from './database-load-simulation.service';
import { SecurityAttackSimulationService } from './security-attack-simulation.service';
import { BusinessProcessSimulationService } from './business-process-simulation.service';
import { RealTimeSimulationService } from './real-time-simulation.service';
import { SimulationOrchestratorService } from './simulation-orchestrator.service';
import { SimulationDataGeneratorService } from './simulation-data-generator.service';
import { SimulationMetricsService } from './simulation-metrics.service';
import { SimulationReportingService } from './simulation-reporting.service';

@Module({
  imports: [ConfigModule],
  controllers: [UltimateSimulationController],
  providers: [
    UserBehaviorSimulationService,
    SystemLoadSimulationService,
    NetworkConditionSimulationService,
    DatabaseLoadSimulationService,
    SecurityAttackSimulationService,
    BusinessProcessSimulationService,
    RealTimeSimulationService,
    SimulationOrchestratorService,
    SimulationDataGeneratorService,
    SimulationMetricsService,
    SimulationReportingService,
  ],
  exports: [
    UserBehaviorSimulationService,
    SystemLoadSimulationService,
    NetworkConditionSimulationService,
    DatabaseLoadSimulationService,
    SecurityAttackSimulationService,
    BusinessProcessSimulationService,
    RealTimeSimulationService,
    SimulationOrchestratorService,
    SimulationDataGeneratorService,
    SimulationMetricsService,
    SimulationReportingService,
  ],
})
export class UltimateSimulationModule {}