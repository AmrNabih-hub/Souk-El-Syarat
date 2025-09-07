import { Injectable, Logger } from '@nestjs/common';
import { ServiceDiscoveryService, ServiceInstance } from './service-discovery.service';

export interface LoadBalancingStrategy {
  name: string;
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null;
}

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private readonly strategies = new Map<string, LoadBalancingStrategy>();
  private readonly roundRobinCounters = new Map<string, number>();

  constructor(private readonly serviceDiscoveryService: ServiceDiscoveryService) {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Round Robin Strategy
    this.strategies.set('round_robin', {
      name: 'round_robin',
      selectInstance: (instances) => this.roundRobinSelection(instances),
    });

    // Least Connections Strategy
    this.strategies.set('least_connections', {
      name: 'least_connections',
      selectInstance: (instances) => this.leastConnectionsSelection(instances),
    });

    // Weighted Round Robin Strategy
    this.strategies.set('weighted_round_robin', {
      name: 'weighted_round_robin',
      selectInstance: (instances) => this.weightedRoundRobinSelection(instances),
    });

    // Random Strategy
    this.strategies.set('random', {
      name: 'random',
      selectInstance: (instances) => this.randomSelection(instances),
    });

    // IP Hash Strategy
    this.strategies.set('ip_hash', {
      name: 'ip_hash',
      selectInstance: (instances) => this.ipHashSelection(instances),
    });

    this.logger.log('Load balancing strategies initialized');
  }

  async selectInstance(
    serviceName: string,
    strategy?: string,
    clientIp?: string
  ): Promise<ServiceInstance | null> {
    try {
      const instances = await this.serviceDiscoveryService.discoverService(serviceName);
      
      if (instances.length === 0) {
        this.logger.warn(`No healthy instances found for service: ${serviceName}`);
        return null;
      }

      const selectedStrategy = strategy || 'round_robin';
      const strategyImpl = this.strategies.get(selectedStrategy);
      
      if (!strategyImpl) {
        this.logger.warn(`Unknown load balancing strategy: ${selectedStrategy}, using round_robin`);
        return this.strategies.get('round_robin')!.selectInstance(instances);
      }

      const selectedInstance = strategyImpl.selectInstance(instances);
      
      if (selectedInstance) {
        this.logger.debug(`Selected instance ${selectedInstance.id} for service ${serviceName} using ${selectedStrategy}`);
      }

      return selectedInstance;
    } catch (error) {
      this.logger.error(`Error selecting instance for service ${serviceName}:`, error);
      return null;
    }
  }

  private roundRobinSelection(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;

    const serviceName = instances[0].name;
    const currentIndex = this.roundRobinCounters.get(serviceName) || 0;
    const selectedInstance = instances[currentIndex % instances.length];
    
    this.roundRobinCounters.set(serviceName, currentIndex + 1);
    
    return selectedInstance;
  }

  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;

    // In a real implementation, you would track actual connection counts
    // For now, we'll use a simple random selection among healthy instances
    const healthyInstances = instances.filter(inst => inst.health === 'healthy');
    if (healthyInstances.length === 0) return instances[0];

    return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
  }

  private weightedRoundRobinSelection(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;

    // In a real implementation, you would use actual weights from instance metadata
    // For now, we'll use equal weights
    const totalWeight = instances.length;
    const randomWeight = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const instance of instances) {
      currentWeight += 1; // Equal weight for all instances
      if (randomWeight <= currentWeight) {
        return instance;
      }
    }

    return instances[instances.length - 1];
  }

  private randomSelection(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  private ipHashSelection(instances: ServiceInstance[], clientIp?: string): ServiceInstance | null {
    if (instances.length === 0) return null;

    if (!clientIp) {
      // Fallback to random selection if no client IP
      return this.randomSelection(instances);
    }

    // Simple hash function for IP
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      const char = clientIp.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const index = Math.abs(hash) % instances.length;
    return instances[index];
  }

  addStrategy(name: string, strategy: LoadBalancingStrategy): void {
    this.strategies.set(name, strategy);
    this.logger.log(`Load balancing strategy added: ${name}`);
  }

  removeStrategy(name: string): boolean {
    const removed = this.strategies.delete(name);
    if (removed) {
      this.logger.log(`Load balancing strategy removed: ${name}`);
    }
    return removed;
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  getStrategy(name: string): LoadBalancingStrategy | null {
    return this.strategies.get(name) || null;
  }

  resetCounters(): void {
    this.roundRobinCounters.clear();
    this.logger.debug('Load balancer counters reset');
  }

  getStats(): any {
    return {
      availableStrategies: this.getAvailableStrategies(),
      roundRobinCounters: Object.fromEntries(this.roundRobinCounters),
      totalStrategies: this.strategies.size,
    };
  }
}