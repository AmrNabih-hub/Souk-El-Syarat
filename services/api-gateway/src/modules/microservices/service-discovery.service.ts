import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  version: string;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastHeartbeat: Date;
  metadata: Record<string, any>;
}

export interface ServiceRegistry {
  name: string;
  instances: ServiceInstance[];
  loadBalancingStrategy: 'round_robin' | 'least_connections' | 'weighted' | 'random';
  circuitBreakerEnabled: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

@Injectable()
export class ServiceDiscoveryService {
  private readonly logger = new Logger(ServiceDiscoveryService.name);
  private readonly serviceRegistry = new Map<string, ServiceRegistry>();
  private readonly healthCheckInterval = 30000; // 30 seconds
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {
    this.startHealthChecks();
  }

  async registerService(service: ServiceRegistry): Promise<void> {
    try {
      this.serviceRegistry.set(service.name, service);
      this.logger.log(`Service registered: ${service.name} with ${service.instances.length} instances`);
    } catch (error) {
      this.logger.error(`Error registering service ${service.name}:`, error);
      throw error;
    }
  }

  async unregisterService(serviceName: string): Promise<void> {
    try {
      this.serviceRegistry.delete(serviceName);
      this.logger.log(`Service unregistered: ${serviceName}`);
    } catch (error) {
      this.logger.error(`Error unregistering service ${serviceName}:`, error);
      throw error;
    }
  }

  async registerInstance(serviceName: string, instance: ServiceInstance): Promise<void> {
    try {
      const service = this.serviceRegistry.get(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      // Check if instance already exists
      const existingIndex = service.instances.findIndex(inst => inst.id === instance.id);
      if (existingIndex >= 0) {
        service.instances[existingIndex] = instance;
      } else {
        service.instances.push(instance);
      }

      this.logger.debug(`Instance registered: ${instance.id} for service ${serviceName}`);
    } catch (error) {
      this.logger.error(`Error registering instance ${instance.id}:`, error);
      throw error;
    }
  }

  async unregisterInstance(serviceName: string, instanceId: string): Promise<void> {
    try {
      const service = this.serviceRegistry.get(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      service.instances = service.instances.filter(inst => inst.id !== instanceId);
      this.logger.debug(`Instance unregistered: ${instanceId} from service ${serviceName}`);
    } catch (error) {
      this.logger.error(`Error unregistering instance ${instanceId}:`, error);
      throw error;
    }
  }

  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    try {
      const service = this.serviceRegistry.get(serviceName);
      if (!service) {
        this.logger.warn(`Service not found: ${serviceName}`);
        return [];
      }

      // Filter healthy instances
      const healthyInstances = service.instances.filter(inst => inst.health === 'healthy');
      
      if (healthyInstances.length === 0) {
        this.logger.warn(`No healthy instances found for service: ${serviceName}`);
        return [];
      }

      return healthyInstances;
    } catch (error) {
      this.logger.error(`Error discovering service ${serviceName}:`, error);
      return [];
    }
  }

  async getServiceInstance(serviceName: string, loadBalancingStrategy?: string): Promise<ServiceInstance | null> {
    try {
      const instances = await this.discoverService(serviceName);
      if (instances.length === 0) {
        return null;
      }

      const service = this.serviceRegistry.get(serviceName);
      const strategy = loadBalancingStrategy || service?.loadBalancingStrategy || 'round_robin';

      switch (strategy) {
        case 'round_robin':
          return this.roundRobinSelection(instances);
        case 'least_connections':
          return this.leastConnectionsSelection(instances);
        case 'weighted':
          return this.weightedSelection(instances);
        case 'random':
          return this.randomSelection(instances);
        default:
          return instances[0];
      }
    } catch (error) {
      this.logger.error(`Error getting service instance for ${serviceName}:`, error);
      return null;
    }
  }

  async updateInstanceHealth(serviceName: string, instanceId: string, health: 'healthy' | 'unhealthy'): Promise<void> {
    try {
      const service = this.serviceRegistry.get(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      const instance = service.instances.find(inst => inst.id === instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      instance.health = health;
      instance.lastHeartbeat = new Date();

      this.logger.debug(`Instance health updated: ${instanceId} -> ${health}`);
    } catch (error) {
      this.logger.error(`Error updating instance health ${instanceId}:`, error);
      throw error;
    }
  }

  async getServiceRegistry(): Promise<Map<string, ServiceRegistry>> {
    return new Map(this.serviceRegistry);
  }

  async getServiceStats(): Promise<any> {
    try {
      const stats = {
        totalServices: this.serviceRegistry.size,
        totalInstances: 0,
        healthyInstances: 0,
        unhealthyInstances: 0,
        services: [] as any[],
      };

      for (const [name, service] of this.serviceRegistry) {
        const serviceStats = {
          name,
          totalInstances: service.instances.length,
          healthyInstances: service.instances.filter(inst => inst.health === 'healthy').length,
          unhealthyInstances: service.instances.filter(inst => inst.health === 'unhealthy').length,
          loadBalancingStrategy: service.loadBalancingStrategy,
          circuitBreakerEnabled: service.circuitBreakerEnabled,
        };

        stats.totalInstances += serviceStats.totalInstances;
        stats.healthyInstances += serviceStats.healthyInstances;
        stats.unhealthyInstances += serviceStats.unhealthyInstances;
        stats.services.push(serviceStats);
      }

      return stats;
    } catch (error) {
      this.logger.error('Error getting service stats:', error);
      return null;
    }
  }

  private roundRobinSelection(instances: ServiceInstance[]): ServiceInstance {
    // Simple round-robin implementation
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance {
    // In a real implementation, you would track connection counts
    return instances[0];
  }

  private weightedSelection(instances: ServiceInstance[]): ServiceInstance {
    // In a real implementation, you would use instance weights
    return instances[0];
  }

  private randomSelection(instances: ServiceInstance[]): ServiceInstance {
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    try {
      for (const [serviceName, service] of this.serviceRegistry) {
        for (const instance of service.instances) {
          try {
            // Perform health check
            const isHealthy = await this.checkInstanceHealth(instance);
            await this.updateInstanceHealth(serviceName, instance.id, isHealthy ? 'healthy' : 'unhealthy');
          } catch (error) {
            await this.updateInstanceHealth(serviceName, instance.id, 'unhealthy');
          }
        }
      }
    } catch (error) {
      this.logger.error('Error performing health checks:', error);
    }
  }

  private async checkInstanceHealth(instance: ServiceInstance): Promise<boolean> {
    try {
      // Simple health check - in production, you would make an actual HTTP request
      const now = new Date();
      const timeSinceLastHeartbeat = now.getTime() - instance.lastHeartbeat.getTime();
      
      // Consider instance unhealthy if no heartbeat for 2 minutes
      return timeSinceLastHeartbeat < 120000;
    } catch (error) {
      return false;
    }
  }
}