import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SimulationDataGeneratorService {
  private readonly logger = new Logger(SimulationDataGeneratorService.name);

  constructor() {
    this.logger.log('Simulation Data Generator Service initialized');
  }

  async generateTestData(config: any): Promise<any> {
    return {
      data: [],
      count: 0,
      timestamp: new Date(),
    };
  }
}