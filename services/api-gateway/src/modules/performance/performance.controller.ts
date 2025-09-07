import { Controller, Get, Post, HttpStatus, Res, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PerformanceService } from './performance.service';
import { CachingService } from './caching.service';

@ApiTags('Performance')
@Controller('performance')
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly cachingService: CachingService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics retrieved successfully'
  })
  async getPerformanceMetrics(@Res() res: Response) {
    try {
      const metrics = await this.performanceService.getCurrentPerformanceMetrics();
      return res.status(HttpStatus.OK).json({
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve performance metrics',
        error: error.message
      });
    }
  }

  @Get('report')
  @ApiOperation({ summary: 'Get performance report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance report generated successfully'
  })
  async getPerformanceReport(@Res() res: Response) {
    try {
      const report = await this.performanceService.getPerformanceReport();
      return res.status(HttpStatus.OK).json(report);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate performance report',
        error: error.message
      });
    }
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache statistics retrieved successfully'
  })
  async getCacheStats(@Res() res: Response) {
    try {
      const stats = await this.cachingService.getStats();
      return res.status(HttpStatus.OK).json({
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve cache statistics',
        error: error.message
      });
    }
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear cache' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache cleared successfully'
  })
  async clearCache(@Res() res: Response) {
    try {
      await this.cachingService.clear();
      return res.status(HttpStatus.OK).json({
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to clear cache',
        error: error.message
      });
    }
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Run performance optimization' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance optimization completed'
  })
  async runOptimization(@Body() body: { operation: string; context: string }, @Res() res: Response) {
    try {
      const result = await this.performanceService.optimizeRequest(
        async () => ({ message: 'Optimization completed' }),
        body.context
      );
      
      return res.status(HttpStatus.OK).json({
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Performance optimization failed',
        error: error.message
      });
    }
  }
}