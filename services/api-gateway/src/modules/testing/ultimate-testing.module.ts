import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UltimateTestingController } from './ultimate-testing.controller';
import { ChaosEngineeringService } from './chaos-engineering.service';
import { LoadTestingService } from './load-testing.service';
import { PerformanceTestingService } from './performance-testing.service';
import { SecurityTestingService } from './security-testing.service';
import { IntegrationTestingService } from './integration-testing.service';
import { EndToEndTestingService } from './end-to-end-testing.service';
import { MutationTestingService } from './mutation-testing.service';
import { ContractTestingService } from './contract-testing.service';
import { VisualRegressionTestingService } from './visual-regression-testing.service';
import { AccessibilityTestingService } from './accessibility-testing.service';
import { TestDataManagementService } from './test-data-management.service';
import { TestEnvironmentService } from './test-environment.service';
import { TestReportingService } from './test-reporting.service';
import { TestAutomationService } from './test-automation.service';

@Module({
  imports: [ConfigModule],
  controllers: [UltimateTestingController],
  providers: [
    ChaosEngineeringService,
    LoadTestingService,
    PerformanceTestingService,
    SecurityTestingService,
    IntegrationTestingService,
    EndToEndTestingService,
    MutationTestingService,
    ContractTestingService,
    VisualRegressionTestingService,
    AccessibilityTestingService,
    TestDataManagementService,
    TestEnvironmentService,
    TestReportingService,
    TestAutomationService,
  ],
  exports: [
    ChaosEngineeringService,
    LoadTestingService,
    PerformanceTestingService,
    SecurityTestingService,
    IntegrationTestingService,
    EndToEndTestingService,
    MutationTestingService,
    ContractTestingService,
    VisualRegressionTestingService,
    AccessibilityTestingService,
    TestDataManagementService,
    TestEnvironmentService,
    TestReportingService,
    TestAutomationService,
  ],
})
export class UltimateTestingModule {}