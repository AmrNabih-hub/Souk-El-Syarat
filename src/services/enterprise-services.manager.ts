/**
 * 🏢 Enterprise Services Manager
 * Centralized management of all enterprise services
 */

import { enterpriseDbService } from './enterprise-database.service';
import { realTimeEngine } from './real-time-engine.service';
import { globalDeployment } from './global-deployment.service';

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastCheck: string;
  details?: any;
}

class EnterpriseServicesManager {
  private services: Map<string, any> = new Map();
  private serviceStatus: Map<string, ServiceStatus> = new Map();

  constructor() {
    this.registerServices();
    this.startHealthChecks();
  }

  private registerServices(): void {
    // Register all enterprise services
    this.services.set('database', enterpriseDbService);
    this.services.set('realtime', realTimeEngine);
    this.services.set('deployment', globalDeployment);

    console.log('✅ Enterprise services registered');
  }

  private startHealthChecks(): void {
    // Check service health every 30 seconds
    setInterval(() => {
      this.checkServicesHealth();
    }, 30000);

    // Initial health check
    this.checkServicesHealth();
  }

  private async checkServicesHealth(): Promise<void> {
    for (const [name, service] of this.services) {
      try {
        let status: ServiceStatus = {
          name,
          status: 'running',
          lastCheck: new Date().toISOString()
        };

        // Check specific service health
        if (name === 'database' && service.testConnection) {
          const isHealthy = await service.testConnection();
          status.status = isHealthy ? 'running' : 'error';
        } else if (name === 'realtime' && service.getConnectionStatus) {
          const connectionStatus = service.getConnectionStatus();
          status.status = connectionStatus === 'connected' ? 'running' : 'error';
          status.details = { connectionStatus };
        } else if (name === 'deployment' && service.getHealthStatus) {
          const healthStatus = await service.getHealthStatus();
          status.status = healthStatus.status === 'healthy' ? 'running' : 'error';
          status.details = healthStatus;
        }

        this.serviceStatus.set(name, status);

      } catch (error) {
        this.serviceStatus.set(name, {
          name,
          status: 'error',
          lastCheck: new Date().toISOString(),
          details: { error: error.message }
        });
      }
    }
  }

  public getServiceStatus(serviceName?: string): ServiceStatus | ServiceStatus[] {
    if (serviceName) {
      return this.serviceStatus.get(serviceName) || {
        name: serviceName,
        status: 'error',
        lastCheck: new Date().toISOString(),
        details: { error: 'Service not found' }
      };
    }

    return Array.from(this.serviceStatus.values());
  }

  public getService(serviceName: string): any {
    return this.services.get(serviceName);
  }

  public async restartService(serviceName: string): Promise<boolean> {
    try {
      const service = this.services.get(serviceName);
      if (service && service.restart) {
        await service.restart();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to restart service ${serviceName}:`, error);
      return false;
    }
  }

  public getOverallHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceStatus[];
    summary: string;
  } {
    const statuses = Array.from(this.serviceStatus.values());
    const runningCount = statuses.filter(s => s.status === 'running').length;
    const totalCount = statuses.length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let summary: string;

    if (runningCount === totalCount) {
      status = 'healthy';
      summary = 'All services running normally';
    } else if (runningCount > totalCount / 2) {
      status = 'degraded';
      summary = `${runningCount}/${totalCount} services running`;
    } else {
      status = 'unhealthy';
      summary = `Only ${runningCount}/${totalCount} services running`;
    }

    return {
      status,
      services: statuses,
      summary
    };
  }

  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down enterprise services...');

    for (const [name, service] of this.services) {
      try {
        if (service.destroy) {
          await service.destroy();
          console.log(`✅ ${name} service shut down`);
        }
      } catch (error) {
        console.error(`❌ Error shutting down ${name} service:`, error);
      }
    }

    console.log('✅ Enterprise services shutdown complete');
  }
}

// Export singleton instance
export const enterpriseServicesManager = new EnterpriseServicesManager();
export default enterpriseServicesManager;