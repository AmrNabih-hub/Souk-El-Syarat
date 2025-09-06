import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  type: 'network' | 'cpu' | 'memory' | 'disk' | 'service' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // in milliseconds
  probability: number; // 0-1
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  results?: ChaosExperimentResults;
}

export interface ChaosExperimentResults {
  success: boolean;
  errorRate: number;
  responseTime: number;
  throughput: number;
  recoveryTime: number;
  observations: string[];
  recommendations: string[];
}

@Injectable()
export class ChaosEngineeringService {
  private readonly logger = new Logger(ChaosEngineeringService.name);
  private readonly activeExperiments = new Map<string, ChaosExperiment>();
  private readonly experimentHistory: ChaosExperiment[] = [];
  private readonly maxHistorySize = 1000;

  constructor(private readonly configService: ConfigService) {}

  async createExperiment(experiment: Omit<ChaosExperiment, 'id' | 'status'>): Promise<string> {
    try {
      const id = `chaos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newExperiment: ChaosExperiment = {
        ...experiment,
        id,
        status: 'pending',
      };

      this.activeExperiments.set(id, newExperiment);
      this.logger.log(`Chaos experiment created: ${experiment.name} (${id})`);
      
      return id;
    } catch (error) {
      this.logger.error('Error creating chaos experiment:', error);
      throw error;
    }
  }

  async startExperiment(experimentId: string): Promise<void> {
    try {
      const experiment = this.activeExperiments.get(experimentId);
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      if (experiment.status !== 'pending') {
        throw new Error(`Experiment ${experimentId} is not in pending status`);
      }

      experiment.status = 'running';
      experiment.startTime = new Date();

      // Start the chaos experiment based on type
      await this.executeChaosExperiment(experiment);

      this.logger.log(`Chaos experiment started: ${experiment.name} (${experimentId})`);
    } catch (error) {
      this.logger.error(`Error starting chaos experiment ${experimentId}:`, error);
      throw error;
    }
  }

  async stopExperiment(experimentId: string): Promise<void> {
    try {
      const experiment = this.activeExperiments.get(experimentId);
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      if (experiment.status !== 'running') {
        throw new Error(`Experiment ${experimentId} is not running`);
      }

      // Stop the chaos experiment
      await this.stopChaosExperiment(experiment);

      experiment.status = 'completed';
      experiment.endTime = new Date();

      // Move to history
      this.experimentHistory.push(experiment);
      this.activeExperiments.delete(experimentId);

      // Keep history size manageable
      if (this.experimentHistory.length > this.maxHistorySize) {
        this.experimentHistory.splice(0, this.experimentHistory.length - this.maxHistorySize);
      }

      this.logger.log(`Chaos experiment stopped: ${experiment.name} (${experimentId})`);
    } catch (error) {
      this.logger.error(`Error stopping chaos experiment ${experimentId}:`, error);
      throw error;
    }
  }

  async getActiveExperiments(): Promise<ChaosExperiment[]> {
    return Array.from(this.activeExperiments.values());
  }

  async getExperimentHistory(limit: number = 100): Promise<ChaosExperiment[]> {
    return this.experimentHistory
      .slice(-limit)
      .sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));
  }

  async getExperimentById(experimentId: string): Promise<ChaosExperiment | null> {
    return this.activeExperiments.get(experimentId) || 
           this.experimentHistory.find(exp => exp.id === experimentId) || 
           null;
  }

  async runChaosMonkey(): Promise<void> {
    try {
      // Randomly select and run a chaos experiment
      const experiments = Array.from(this.activeExperiments.values())
        .filter(exp => exp.status === 'pending' && Math.random() < exp.probability);

      if (experiments.length === 0) {
        this.logger.debug('No chaos experiments to run');
        return;
      }

      const experiment = experiments[Math.floor(Math.random() * experiments.length)];
      await this.startExperiment(experiment.id);

      // Auto-stop after duration
      setTimeout(async () => {
        try {
          await this.stopExperiment(experiment.id);
        } catch (error) {
          this.logger.error(`Error auto-stopping experiment ${experiment.id}:`, error);
        }
      }, experiment.duration);

    } catch (error) {
      this.logger.error('Error running chaos monkey:', error);
    }
  }

  private async executeChaosExperiment(experiment: ChaosExperiment): Promise<void> {
    try {
      switch (experiment.type) {
        case 'network':
          await this.executeNetworkChaos(experiment);
          break;
        case 'cpu':
          await this.executeCpuChaos(experiment);
          break;
        case 'memory':
          await this.executeMemoryChaos(experiment);
          break;
        case 'disk':
          await this.executeDiskChaos(experiment);
          break;
        case 'service':
          await this.executeServiceChaos(experiment);
          break;
        case 'database':
          await this.executeDatabaseChaos(experiment);
          break;
        default:
          throw new Error(`Unknown chaos type: ${experiment.type}`);
      }
    } catch (error) {
      experiment.status = 'failed';
      experiment.endTime = new Date();
      this.logger.error(`Error executing chaos experiment ${experiment.id}:`, error);
      throw error;
    }
  }

  private async stopChaosExperiment(experiment: ChaosExperiment): Promise<void> {
    try {
      // Stop the specific chaos experiment
      this.logger.debug(`Stopping chaos experiment: ${experiment.name}`);
    } catch (error) {
      this.logger.error(`Error stopping chaos experiment ${experiment.id}:`, error);
    }
  }

  private async executeNetworkChaos(experiment: ChaosExperiment): Promise<void> {
    // Simulate network latency, packet loss, etc.
    this.logger.debug(`Executing network chaos: ${experiment.name}`);
  }

  private async executeCpuChaos(experiment: ChaosExperiment): Promise<void> {
    // Simulate high CPU usage
    this.logger.debug(`Executing CPU chaos: ${experiment.name}`);
  }

  private async executeMemoryChaos(experiment: ChaosExperiment): Promise<void> {
    // Simulate memory pressure
    this.logger.debug(`Executing memory chaos: ${experiment.name}`);
  }

  private async executeDiskChaos(experiment: ChaosExperiment): Promise<void> {
    // Simulate disk I/O issues
    this.logger.debug(`Executing disk chaos: ${experiment.name}`);
  }

  private async executeServiceChaos(experiment: ChaosExperiment): Promise<void> {
    // Simulate service failures
    this.logger.debug(`Executing service chaos: ${experiment.name}`);
  }

  private async executeDatabaseChaos(experiment: ChaosExperiment): Promise<void> {
    // Simulate database issues
    this.logger.debug(`Executing database chaos: ${experiment.name}`);
  }

  async getChaosMetrics(): Promise<any> {
    try {
      const activeCount = this.activeExperiments.size;
      const totalExperiments = this.experimentHistory.length + activeCount;
      const successfulExperiments = this.experimentHistory.filter(exp => exp.status === 'completed').length;
      const failedExperiments = this.experimentHistory.filter(exp => exp.status === 'failed').length;

      return {
        activeExperiments: activeCount,
        totalExperiments,
        successfulExperiments,
        failedExperiments,
        successRate: totalExperiments > 0 ? (successfulExperiments / totalExperiments) * 100 : 0,
        experimentsByType: this.getExperimentsByType(),
        experimentsBySeverity: this.getExperimentsBySeverity(),
      };
    } catch (error) {
      this.logger.error('Error getting chaos metrics:', error);
      return null;
    }
  }

  private getExperimentsByType(): Record<string, number> {
    const typeCounts: Record<string, number> = {};
    
    for (const experiment of this.experimentHistory) {
      typeCounts[experiment.type] = (typeCounts[experiment.type] || 0) + 1;
    }
    
    return typeCounts;
  }

  private getExperimentsBySeverity(): Record<string, number> {
    const severityCounts: Record<string, number> = {};
    
    for (const experiment of this.experimentHistory) {
      severityCounts[experiment.severity] = (severityCounts[experiment.severity] || 0) + 1;
    }
    
    return severityCounts;
  }
}