import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TestEnvironmentService {
  private readonly logger = new Logger(TestEnvironmentService.name);

  constructor() {
    this.logger.log('Test Environment Service initialized');
  }

  async setupEnvironment(config: any): Promise<any> {
    return {
      environmentId: `env_${Date.now()}`,
      status: 'ready',
      config,
      timestamp: new Date(),
    };
  }
}