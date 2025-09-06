import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';

@ApiTags('API Gateway')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API Gateway information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API Gateway information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Souk El-Syarat API Gateway' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'Ultimate Professional API Gateway' },
        status: { type: 'string', example: 'operational' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 },
        environment: { type: 'string', example: 'production' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              url: { type: 'string' },
              health: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getApiGatewayInfo(@Res() res: Response) {
    const info = await this.appService.getApiGatewayInfo();
    return res.status(HttpStatus.OK).json(info);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get API Gateway status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API Gateway status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'operational' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'production' }
      }
    }
  })
  async getStatus(@Res() res: Response) {
    const status = await this.appService.getStatus();
    return res.status(HttpStatus.OK).json(status);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get API Gateway metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API Gateway metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 12345 },
            successful: { type: 'number', example: 12000 },
            failed: { type: 'number', example: 345 },
            rate: { type: 'number', example: 150.5 }
          }
        },
        responseTime: {
          type: 'object',
          properties: {
            average: { type: 'number', example: 125.5 },
            p50: { type: 'number', example: 100.0 },
            p95: { type: 'number', example: 250.0 },
            p99: { type: 'number', example: 500.0 }
          }
        },
        errors: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 345 },
            rate: { type: 'number', example: 2.8 },
            byType: {
              type: 'object',
              properties: {
                '4xx': { type: 'number', example: 200 },
                '5xx': { type: 'number', example: 145 }
              }
            }
          }
        },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              responseTime: { type: 'number' },
              errorRate: { type: 'number' },
              requests: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getMetrics(@Res() res: Response) {
    const metrics = await this.appService.getMetrics();
    return res.status(HttpStatus.OK).json(metrics);
  }
}