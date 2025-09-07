import { Controller, Get, Post, HttpStatus, Res, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { RealtimeService } from './realtime.service';

@ApiTags('Realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get realtime statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Realtime statistics retrieved successfully'
  })
  async getRealtimeStats(@Res() res: Response) {
    try {
      const stats = await this.realtimeService.getRealtimeStats();
      return res.status(HttpStatus.OK).json({
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve realtime statistics',
        error: error.message
      });
    }
  }

  @Get('users')
  @ApiOperation({ summary: 'Get online users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Online users retrieved successfully'
  })
  async getOnlineUsers(@Res() res: Response) {
    try {
      const users = await this.realtimeService.getOnlineUsers();
      return res.status(HttpStatus.OK).json({
        users,
        count: users.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve online users',
        error: error.message
      });
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'Get event history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event history retrieved successfully'
  })
  async getEventHistory(
    @Query('limit') limit: string = '100',
    @Res() res: Response
  ) {
    try {
      const limitNum = parseInt(limit, 10) || 100;
      const events = await this.realtimeService.getEventHistory(limitNum);
      
      return res.status(HttpStatus.OK).json({
        events,
        count: events.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve event history',
        error: error.message
      });
    }
  }

  @Post('notification')
  @ApiOperation({ summary: 'Send notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification sent successfully'
  })
  async sendNotification(
    @Body() body: {
      userId: string;
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
      data?: any;
    },
    @Res() res: Response
  ) {
    try {
      await this.realtimeService.sendNotification(
        body.userId,
        body.title,
        body.message,
        body.type,
        body.data
      );
      
      return res.status(HttpStatus.OK).json({
        message: 'Notification sent successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send notification',
        error: error.message
      });
    }
  }

  @Post('system-alert')
  @ApiOperation({ summary: 'Send system alert' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System alert sent successfully'
  })
  async sendSystemAlert(
    @Body() body: {
      message: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      data?: any;
    },
    @Res() res: Response
  ) {
    try {
      await this.realtimeService.sendSystemAlert(
        body.message,
        body.severity,
        body.data
      );
      
      return res.status(HttpStatus.OK).json({
        message: 'System alert sent successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send system alert',
        error: error.message
      });
    }
  }
}