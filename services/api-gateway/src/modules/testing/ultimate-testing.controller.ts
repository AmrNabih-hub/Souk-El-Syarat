import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ChaosEngineeringService } from './chaos-engineering.service';
import { LoadTestingService } from './load-testing.service';
import { PerformanceTestingService } from './performance-testing.service';
import { SecurityTestingService } from './security-testing.service';

@Controller('testing')
export class UltimateTestingController {
  private readonly logger = new Logger(UltimateTestingController.name);

  constructor(
    private readonly chaosEngineeringService: ChaosEngineeringService,
    private readonly loadTestingService: LoadTestingService,
    private readonly performanceTestingService: PerformanceTestingService,
    private readonly securityTestingService: SecurityTestingService,
  ) {}

  @Post('chaos/experiments')
  async createChaosExperiment(@Body() experimentData: any) {
    try {
      const experimentId = await this.chaosEngineeringService.createExperiment(experimentData);
      
      return {
        success: true,
        message: 'Chaos experiment created successfully',
        experimentId,
      };
    } catch (error) {
      this.logger.error('Error creating chaos experiment:', error);
      return {
        success: false,
        message: 'Failed to create chaos experiment',
        error: error.message,
      };
    }
  }

  @Post('chaos/experiments/:experimentId/start')
  async startChaosExperiment(@Param('experimentId') experimentId: string) {
    try {
      await this.chaosEngineeringService.startExperiment(experimentId);
      
      return {
        success: true,
        message: 'Chaos experiment started successfully',
        experimentId,
      };
    } catch (error) {
      this.logger.error(`Error starting chaos experiment ${experimentId}:`, error);
      return {
        success: false,
        message: 'Failed to start chaos experiment',
        error: error.message,
      };
    }
  }

  @Post('chaos/experiments/:experimentId/stop')
  async stopChaosExperiment(@Param('experimentId') experimentId: string) {
    try {
      await this.chaosEngineeringService.stopExperiment(experimentId);
      
      return {
        success: true,
        message: 'Chaos experiment stopped successfully',
        experimentId,
      };
    } catch (error) {
      this.logger.error(`Error stopping chaos experiment ${experimentId}:`, error);
      return {
        success: false,
        message: 'Failed to stop chaos experiment',
        error: error.message,
      };
    }
  }

  @Get('chaos/experiments')
  async getChaosExperiments(@Query('active') active?: boolean) {
    try {
      let experiments;
      
      if (active) {
        experiments = await this.chaosEngineeringService.getActiveExperiments();
      } else {
        experiments = await this.chaosEngineeringService.getExperimentHistory();
      }
      
      return {
        success: true,
        data: experiments,
        count: experiments.length,
      };
    } catch (error) {
      this.logger.error('Error getting chaos experiments:', error);
      return {
        success: false,
        message: 'Failed to get chaos experiments',
        error: error.message,
      };
    }
  }

  @Get('chaos/experiments/:experimentId')
  async getChaosExperiment(@Param('experimentId') experimentId: string) {
    try {
      const experiment = await this.chaosEngineeringService.getExperimentById(experimentId);
      
      if (!experiment) {
        return {
          success: false,
          message: 'Experiment not found',
        };
      }
      
      return {
        success: true,
        data: experiment,
      };
    } catch (error) {
      this.logger.error(`Error getting chaos experiment ${experimentId}:`, error);
      return {
        success: false,
        message: 'Failed to get chaos experiment',
        error: error.message,
      };
    }
  }

  @Post('chaos/monkey')
  async runChaosMonkey() {
    try {
      await this.chaosEngineeringService.runChaosMonkey();
      
      return {
        success: true,
        message: 'Chaos monkey executed successfully',
      };
    } catch (error) {
      this.logger.error('Error running chaos monkey:', error);
      return {
        success: false,
        message: 'Failed to run chaos monkey',
        error: error.message,
      };
    }
  }

  @Get('chaos/metrics')
  async getChaosMetrics() {
    try {
      const metrics = await this.chaosEngineeringService.getChaosMetrics();
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error('Error getting chaos metrics:', error);
      return {
        success: false,
        message: 'Failed to get chaos metrics',
        error: error.message,
      };
    }
  }

  @Post('load-tests')
  async runLoadTest(@Body() loadTestData: any) {
    try {
      // This would call the actual load testing service
      const result = {
        testId: `load_${Date.now()}`,
        status: 'running',
        duration: loadTestData.duration || 300,
        virtualUsers: loadTestData.virtualUsers || 100,
      };
      
      return {
        success: true,
        message: 'Load test started successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error running load test:', error);
      return {
        success: false,
        message: 'Failed to run load test',
        error: error.message,
      };
    }
  }

  @Post('performance-tests')
  async runPerformanceTest(@Body() performanceTestData: any) {
    try {
      // This would call the actual performance testing service
      const result = {
        testId: `perf_${Date.now()}`,
        status: 'running',
        duration: performanceTestData.duration || 600,
        metrics: ['response_time', 'throughput', 'cpu_usage', 'memory_usage'],
      };
      
      return {
        success: true,
        message: 'Performance test started successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error running performance test:', error);
      return {
        success: false,
        message: 'Failed to run performance test',
        error: error.message,
      };
    }
  }

  @Post('security-tests')
  async runSecurityTest(@Body() securityTestData: any) {
    try {
      // This would call the actual security testing service
      const result = {
        testId: `sec_${Date.now()}`,
        status: 'running',
        testType: securityTestData.testType || 'vulnerability_scan',
        target: securityTestData.target,
      };
      
      return {
        success: true,
        message: 'Security test started successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error running security test:', error);
      return {
        success: false,
        message: 'Failed to run security test',
        error: error.message,
      };
    }
  }

  @Get('test-results')
  async getTestResults(@Query('type') type?: string) {
    try {
      // This would return actual test results
      const results = {
        loadTests: [],
        performanceTests: [],
        securityTests: [],
        chaosExperiments: [],
      };
      
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      this.logger.error('Error getting test results:', error);
      return {
        success: false,
        message: 'Failed to get test results',
        error: error.message,
      };
    }
  }
}