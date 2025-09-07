import { Injectable, Logger } from '@nestjs/common';
import { RealtimeWebSocketGateway } from './websocket.gateway';
import { EventService } from './event.service';
import { NotificationService } from './notification.service';
import { RealtimeMonitoringService } from './realtime-monitoring.service';

export interface RealtimeEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  target?: {
    type: 'user' | 'role' | 'room' | 'all';
    value: string;
  };
}

export interface RealtimeStats {
  connectedClients: number;
  onlineUsers: number;
  messagesPerMinute: number;
  eventsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly startTime = Date.now();
  private readonly eventCounts = {
    messages: 0,
    events: 0,
    errors: 0,
  };
  private readonly responseTimes: number[] = [];

  constructor(
    private readonly webSocketGateway: RealtimeWebSocketGateway,
    private readonly eventService: EventService,
    private readonly notificationService: NotificationService,
    private readonly realtimeMonitoringService: RealtimeMonitoringService,
  ) {}

  async sendEvent(event: RealtimeEvent): Promise<void> {
    try {
      const startTime = Date.now();

      // Store event
      await this.eventService.storeEvent(event);

      // Broadcast based on target
      if (event.target) {
        switch (event.target.type) {
          case 'user':
            await this.webSocketGateway.broadcastToUser(event.target.value, event.type, event.data);
            break;
          case 'role':
            await this.webSocketGateway.broadcastToRole(event.target.value, event.type, event.data);
            break;
          case 'room':
            await this.webSocketGateway.broadcastToRoom(event.target.value, event.type, event.data);
            break;
          case 'all':
            await this.webSocketGateway.broadcastToAll(event.type, event.data);
            break;
        }
      } else {
        // Broadcast to all if no target specified
        await this.webSocketGateway.broadcastToAll(event.type, event.data);
      }

      // Record metrics
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      this.eventCounts.events++;

      this.logger.debug(`Event sent: ${event.type} to ${event.target?.type || 'all'}`);

    } catch (error) {
      this.logger.error(`Error sending event ${event.type}:`, error);
      this.eventCounts.errors++;
      throw error;
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
  ): Promise<void> {
    try {
      const notification = {
        id: this.generateId(),
        userId,
        title,
        message,
        type,
        data,
        timestamp: new Date(),
        read: false,
      };

      // Store notification
      await this.notificationService.storeNotification(notification);

      // Send real-time event
      await this.sendEvent({
        id: this.generateId(),
        type: 'notification',
        data: notification,
        timestamp: new Date(),
        target: {
          type: 'user',
          value: userId,
        },
      });

      this.logger.debug(`Notification sent to user ${userId}`);

    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  async sendSystemAlert(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    data?: any
  ): Promise<void> {
    try {
      const alert = {
        id: this.generateId(),
        message,
        severity,
        data,
        timestamp: new Date(),
      };

      // Send to all admins
      await this.sendEvent({
        id: this.generateId(),
        type: 'system_alert',
        data: alert,
        timestamp: new Date(),
        target: {
          type: 'role',
          value: 'admin',
        },
      });

      this.logger.warn(`System alert sent: ${message}`);

    } catch (error) {
      this.logger.error(`Error sending system alert:`, error);
      throw error;
    }
  }

  async broadcastOrderUpdate(orderId: string, status: string, data?: any): Promise<void> {
    try {
      await this.sendEvent({
        id: this.generateId(),
        type: 'order_update',
        data: {
          orderId,
          status,
          ...data,
        },
        timestamp: new Date(),
        target: {
          type: 'room',
          value: `order:${orderId}`,
        },
      });

      this.logger.debug(`Order update broadcasted: ${orderId} - ${status}`);

    } catch (error) {
      this.logger.error(`Error broadcasting order update for ${orderId}:`, error);
      throw error;
    }
  }

  async broadcastProductUpdate(productId: string, action: string, data?: any): Promise<void> {
    try {
      await this.sendEvent({
        id: this.generateId(),
        type: 'product_update',
        data: {
          productId,
          action,
          ...data,
        },
        timestamp: new Date(),
        target: {
          type: 'room',
          value: `product:${productId}`,
        },
      });

      this.logger.debug(`Product update broadcasted: ${productId} - ${action}`);

    } catch (error) {
      this.logger.error(`Error broadcasting product update for ${productId}:`, error);
      throw error;
    }
  }

  async broadcastInventoryUpdate(inventoryId: string, action: string, data?: any): Promise<void> {
    try {
      await this.sendEvent({
        id: this.generateId(),
        type: 'inventory_update',
        data: {
          inventoryId,
          action,
          ...data,
        },
        timestamp: new Date(),
        target: {
          type: 'role',
          value: 'vendor',
        },
      });

      this.logger.debug(`Inventory update broadcasted: ${inventoryId} - ${action}`);

    } catch (error) {
      this.logger.error(`Error broadcasting inventory update for ${inventoryId}:`, error);
      throw error;
    }
  }

  async getRealtimeStats(): Promise<RealtimeStats> {
    try {
      const connectedClients = this.webSocketGateway.getConnectedClientsCount();
      const onlineUsers = this.webSocketGateway.getOnlineUsers().length;
      const uptime = Date.now() - this.startTime;

      // Calculate rates (per minute)
      const messagesPerMinute = this.eventCounts.messages / (uptime / 60000);
      const eventsPerMinute = this.eventCounts.events / (uptime / 60000);

      // Calculate average response time
      const averageResponseTime = this.responseTimes.length > 0
        ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
        : 0;

      // Calculate error rate
      const totalEvents = this.eventCounts.events + this.eventCounts.errors;
      const errorRate = totalEvents > 0 ? (this.eventCounts.errors / totalEvents) * 100 : 0;

      return {
        connectedClients,
        onlineUsers,
        messagesPerMinute: Math.round(messagesPerMinute * 100) / 100,
        eventsPerMinute: Math.round(eventsPerMinute * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        uptime,
      };

    } catch (error) {
      this.logger.error('Error getting realtime stats:', error);
      return {
        connectedClients: 0,
        onlineUsers: 0,
        messagesPerMinute: 0,
        eventsPerMinute: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
      };
    }
  }

  async getOnlineUsers(): Promise<any[]> {
    try {
      return this.webSocketGateway.getOnlineUsers();
    } catch (error) {
      this.logger.error('Error getting online users:', error);
      return [];
    }
  }

  async getEventHistory(limit: number = 100): Promise<RealtimeEvent[]> {
    try {
      return await this.eventService.getEventHistory(limit);
    } catch (error) {
      this.logger.error('Error getting event history:', error);
      return [];
    }
  }

  async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await this.notificationService.getNotificationHistory(userId, limit);
    } catch (error) {
      this.logger.error(`Error getting notification history for user ${userId}:`, error);
      return [];
    }
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.splice(0, this.responseTimes.length - 1000);
    }
  }

  private generateId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}