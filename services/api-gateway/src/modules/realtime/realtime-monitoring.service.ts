import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RealtimeMonitoringService {
  private readonly logger = new Logger(RealtimeMonitoringService.name);

  async recordMetrics(metrics: any): Promise<void> {
    try {
      this.logger.debug('Realtime metrics recorded');
    } catch (error) {
      this.logger.error('Error recording realtime metrics:', error);
    }
  }
}