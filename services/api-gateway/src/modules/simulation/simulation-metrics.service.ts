import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SimulationMetricsService {
  private readonly logger = new Logger(SimulationMetricsService.name);

  constructor() {
    this.logger.log('Simulation Metrics Service initialized');
  }

  async getMetrics(simulationId: string): Promise<any> {
    return {
      simulationId,
      metrics: {},
      timestamp: new Date(),
    };
  }
}