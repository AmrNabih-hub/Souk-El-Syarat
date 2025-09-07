import { Controller, Get, Post, HttpStatus, Res, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SecurityService } from './security.service';
import { SecurityMonitoringService } from './security-monitoring.service';

@ApiTags('Security')
@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly securityMonitoringService: SecurityMonitoringService
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get security configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security configuration retrieved successfully'
  })
  async getSecurityConfig(@Res() res: Response) {
    try {
      const config = this.securityService.getSecurityConfig();
      return res.status(HttpStatus.OK).json({
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve security configuration',
        error: error.message
      });
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get security metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security metrics retrieved successfully'
  })
  async getSecurityMetrics(@Res() res: Response) {
    try {
      const metrics = await this.securityService.getSecurityMetrics();
      return res.status(HttpStatus.OK).json({
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve security metrics',
        error: error.message
      });
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'Get security events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security events retrieved successfully'
  })
  async getSecurityEvents(
    @Query('limit') limit: string = '100',
    @Query('type') type: string,
    @Query('severity') severity: string,
    @Res() res: Response
  ) {
    try {
      const limitNum = parseInt(limit, 10) || 100;
      let events;

      if (type) {
        events = await this.securityMonitoringService.getSecurityEventsByType(type as any, limitNum);
      } else if (severity) {
        events = await this.securityMonitoringService.getSecurityEventsBySeverity(severity as any, limitNum);
      } else {
        events = await this.securityService.getSecurityEvents(limitNum);
      }

      return res.status(HttpStatus.OK).json({
        events,
        count: events.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve security events',
        error: error.message
      });
    }
  }

  @Post('validate-request')
  @ApiOperation({ summary: 'Validate a request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request validation completed'
  })
  async validateRequest(@Body() requestData: any, @Res() res: Response) {
    try {
      const result = await this.securityService.validateRequest(requestData);
      return res.status(HttpStatus.OK).json({
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Request validation failed',
        error: error.message
      });
    }
  }

  @Post('validate-file')
  @ApiOperation({ summary: 'Validate a file upload' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File validation completed'
  })
  async validateFile(@Body() fileData: any, @Res() res: Response) {
    try {
      const result = await this.securityService.validateFileUpload(fileData);
      return res.status(HttpStatus.OK).json({
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'File validation failed',
        error: error.message
      });
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Export security events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security events exported successfully'
  })
  async exportSecurityEvents(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res: Response
  ) {
    try {
      const exportData = await this.securityMonitoringService.exportSecurityEvents(format);
      
      const contentType = format === 'json' ? 'application/json' : 'text/csv';
      const filename = `security-events-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.status(HttpStatus.OK).send(exportData);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to export security events',
        error: error.message
      });
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up old security events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security events cleaned up successfully'
  })
  async cleanupOldEvents(
    @Body() body: { olderThanDays?: number },
    @Res() res: Response
  ) {
    try {
      const olderThanDays = body.olderThanDays || 7;
      const removedCount = await this.securityMonitoringService.clearOldEvents(olderThanDays);
      
      return res.status(HttpStatus.OK).json({
        message: `Cleaned up ${removedCount} old security events`,
        removedCount,
        olderThanDays,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to cleanup old events',
        error: error.message
      });
    }
  }
}