import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ServiceHealthService {
  private readonly logger = new Logger(ServiceHealthService.name);

  constructor() {
    this.logger.log('Service Health Service initialized');
  }

  async checkServiceHealth(serviceName: string): Promise<any> {
    return {
      service: serviceName,
      status: 'healthy',
      timestamp: new Date(),
    };
  }
}