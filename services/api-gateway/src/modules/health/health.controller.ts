import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get comprehensive health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'production' },
        checks: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 15.5 }
              }
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 5.2 }
              }
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string' },
                  responseTime: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
  async getHealth(@Res() res: Response) {
    const health = await this.healthService.getHealthStatus();
    const statusCode = health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(health);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get readiness status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Readiness status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        timestamp: { type: 'string', format: 'date-time' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'ready' },
            redis: { type: 'string', example: 'ready' },
            services: { type: 'string', example: 'ready' }
          }
        }
      }
    }
  })
  async getReadiness(@Res() res: Response) {
    const readiness = await this.healthService.getReadinessStatus();
    const statusCode = readiness.status === 'ready' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(readiness);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get liveness status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liveness status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 }
      }
    }
  })
  async getLiveness(@Res() res: Response) {
    const liveness = await this.healthService.getLivenessStatus();
    return res.status(HttpStatus.OK).json(liveness);
  }
}