import { Injectable, Logger } from '@nestjs/common';
import { PerformanceMetrics } from './performance.service';

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private readonly metrics: PerformanceMetrics[] = [];

  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      this.metrics.push(metrics);
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics.splice(0, this.metrics.length - 1000);
      }
      
      this.logger.debug('Performance metrics recorded');
    } catch (error) {
      this.logger.error('Error recording performance metrics:', error);
    }
  }

  async getMetrics(): Promise<PerformanceMetrics[]> {
    return [...this.metrics];
  }
}