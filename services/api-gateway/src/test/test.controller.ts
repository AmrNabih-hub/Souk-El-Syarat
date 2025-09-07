import { Controller, Post, Get, HttpStatus, Res, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TestRunnerService } from './test-runner.service';
import { AuthSimulationService, SimulationConfig } from './simulation/auth-simulation.service';
import { BugBotService, BugBotConfig } from './bug-bot/bug-bot.service';

@ApiTags('Testing')
@Controller('test')
export class TestController {
  constructor(
    private readonly testRunnerService: TestRunnerService,
    private readonly authSimulationService: AuthSimulationService,
    private readonly bugBotService: BugBotService
  ) {}

  @Post('run-all')
  @ApiOperation({ summary: 'Run all test suites' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All test suites completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All tests completed successfully' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              suiteName: { type: 'string' },
              totalTests: { type: 'number' },
              passedTests: { type: 'number' },
              failedTests: { type: 'number' },
              successRate: { type: 'number' },
              duration: { type: 'number' },
              bugs: { type: 'array' }
            }
          }
        }
      }
    }
  })
  async runAllTests(@Res() res: Response) {
    try {
      const results = await this.testRunnerService.runAllTests();
      
      return res.status(HttpStatus.OK).json({
        message: 'All tests completed successfully',
        results
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Test execution failed',
        error: error.message
      });
    }
  }

  @Post('run-unit')
  @ApiOperation({ summary: 'Run unit tests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit tests completed successfully'
  })
  async runUnitTests(@Res() res: Response) {
    try {
      const result = await this.testRunnerService.runUnitTests();
      
      return res.status(HttpStatus.OK).json({
        message: 'Unit tests completed successfully',
        result
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unit test execution failed',
        error: error.message
      });
    }
  }

  @Post('run-e2e')
  @ApiOperation({ summary: 'Run E2E tests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'E2E tests completed successfully'
  })
  async runE2ETests(@Res() res: Response) {
    try {
      const result = await this.testRunnerService.runE2ETests();
      
      return res.status(HttpStatus.OK).json({
        message: 'E2E tests completed successfully',
        result
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'E2E test execution failed',
        error: error.message
      });
    }
  }

  @Post('run-simulation')
  @ApiOperation({ summary: 'Run simulation tests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Simulation tests completed successfully'
  })
  async runSimulationTests(
    @Body() config: SimulationConfig,
    @Res() res: Response
  ) {
    try {
      const results = await this.authSimulationService.runComprehensiveSimulation(config);
      const report = this.authSimulationService.generateTestReport(results);
      
      return res.status(HttpStatus.OK).json({
        message: 'Simulation tests completed successfully',
        results,
        report
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Simulation test execution failed',
        error: error.message
      });
    }
  }

  @Post('start-bug-bot')
  @ApiOperation({ summary: 'Start Bug Bot monitoring' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug Bot monitoring started successfully'
  })
  async startBugBot(
    @Body() config: BugBotConfig,
    @Res() res: Response
  ) {
    try {
      await this.bugBotService.startMonitoring(config);
      
      return res.status(HttpStatus.OK).json({
        message: 'Bug Bot monitoring started successfully',
        config
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to start Bug Bot monitoring',
        error: error.message
      });
    }
  }

  @Post('stop-bug-bot')
  @ApiOperation({ summary: 'Stop Bug Bot monitoring' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug Bot monitoring stopped successfully'
  })
  async stopBugBot(@Res() res: Response) {
    try {
      await this.bugBotService.stopMonitoring();
      
      return res.status(HttpStatus.OK).json({
        message: 'Bug Bot monitoring stopped successfully'
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to stop Bug Bot monitoring',
        error: error.message
      });
    }
  }

  @Get('bug-reports')
  @ApiOperation({ summary: 'Get bug reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug reports retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        bugs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              category: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getBugReports(@Res() res: Response) {
    try {
      const bugs = this.bugBotService.getBugReports();
      
      return res.status(HttpStatus.OK).json({
        bugs
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve bug reports',
        error: error.message
      });
    }
  }

  @Get('bug-report')
  @ApiOperation({ summary: 'Get comprehensive bug report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bug report generated successfully'
  })
  async getBugReport(@Res() res: Response) {
    try {
      const report = this.bugBotService.generateBugReport();
      
      return res.status(HttpStatus.OK).json({
        report
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate bug report',
        error: error.message
      });
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Get test system health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test system health retrieved successfully'
  })
  async getTestHealth(@Res() res: Response) {
    try {
      const bugs = this.bugBotService.getBugReports();
      const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
      const highBugs = bugs.filter(b => b.severity === 'high').length;
      
      const health = {
        status: criticalBugs > 0 ? 'critical' : highBugs > 0 ? 'warning' : 'healthy',
        totalBugs: bugs.length,
        criticalBugs,
        highBugs,
        lastChecked: new Date().toISOString()
      };
      
      return res.status(HttpStatus.OK).json(health);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve test system health',
        error: error.message
      });
    }
  }
}