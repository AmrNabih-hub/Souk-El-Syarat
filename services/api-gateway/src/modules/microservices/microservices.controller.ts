import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ServiceDiscoveryService } from './service-discovery.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { LoadBalancerService } from './load-balancer.service';

@Controller('microservices')
export class MicroservicesController {
  private readonly logger = new Logger(MicroservicesController.name);

  constructor(
    private readonly serviceDiscoveryService: ServiceDiscoveryService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly loadBalancerService: LoadBalancerService,
  ) {}

  @Post('services')
  async registerService(@Body() serviceData: any) {
    try {
      await this.serviceDiscoveryService.registerService(serviceData);
      
      return {
        success: true,
        message: 'Service registered successfully',
        serviceName: serviceData.name,
      };
    } catch (error) {
      this.logger.error('Error registering service:', error);
      return {
        success: false,
        message: 'Failed to register service',
        error: error.message,
      };
    }
  }

  @Post('services/:serviceName/instances')
  async registerInstance(
    @Param('serviceName') serviceName: string,
    @Body() instanceData: any,
  ) {
    try {
      await this.serviceDiscoveryService.registerInstance(serviceName, instanceData);
      
      return {
        success: true,
        message: 'Instance registered successfully',
        instanceId: instanceData.id,
      };
    } catch (error) {
      this.logger.error(`Error registering instance for ${serviceName}:`, error);
      return {
        success: false,
        message: 'Failed to register instance',
        error: error.message,
      };
    }
  }

  @Get('services')
  async getServices() {
    try {
      const registry = await this.serviceDiscoveryService.getServiceRegistry();
      const services = Array.from(registry.values());
      
      return {
        success: true,
        data: services,
        count: services.length,
      };
    } catch (error) {
      this.logger.error('Error getting services:', error);
      return {
        success: false,
        message: 'Failed to get services',
        error: error.message,
      };
    }
  }

  @Get('services/:serviceName')
  async discoverService(@Param('serviceName') serviceName: string) {
    try {
      const instances = await this.serviceDiscoveryService.discoverService(serviceName);
      
      return {
        success: true,
        data: instances,
        count: instances.length,
      };
    } catch (error) {
      this.logger.error(`Error discovering service ${serviceName}:`, error);
      return {
        success: false,
        message: 'Failed to discover service',
        error: error.message,
      };
    }
  }

  @Get('services/:serviceName/instance')
  async getServiceInstance(
    @Param('serviceName') serviceName: string,
    @Query('strategy') strategy?: string,
  ) {
    try {
      const instance = await this.serviceDiscoveryService.getServiceInstance(serviceName, strategy);
      
      if (!instance) {
        return {
          success: false,
          message: 'No healthy instances found',
        };
      }
      
      return {
        success: true,
        data: instance,
      };
    } catch (error) {
      this.logger.error(`Error getting service instance for ${serviceName}:`, error);
      return {
        success: false,
        message: 'Failed to get service instance',
        error: error.message,
      };
    }
  }

  @Put('services/:serviceName/instances/:instanceId/health')
  async updateInstanceHealth(
    @Param('serviceName') serviceName: string,
    @Param('instanceId') instanceId: string,
    @Body() healthData: { health: 'healthy' | 'unhealthy' },
  ) {
    try {
      await this.serviceDiscoveryService.updateInstanceHealth(
        serviceName,
        instanceId,
        healthData.health,
      );
      
      return {
        success: true,
        message: 'Instance health updated successfully',
      };
    } catch (error) {
      this.logger.error(`Error updating instance health:`, error);
      return {
        success: false,
        message: 'Failed to update instance health',
        error: error.message,
      };
    }
  }

  @Delete('services/:serviceName/instances/:instanceId')
  async unregisterInstance(
    @Param('serviceName') serviceName: string,
    @Param('instanceId') instanceId: string,
  ) {
    try {
      await this.serviceDiscoveryService.unregisterInstance(serviceName, instanceId);
      
      return {
        success: true,
        message: 'Instance unregistered successfully',
      };
    } catch (error) {
      this.logger.error(`Error unregistering instance:`, error);
      return {
        success: false,
        message: 'Failed to unregister instance',
        error: error.message,
      };
    }
  }

  @Get('stats')
  async getServiceStats() {
    try {
      const stats = await this.serviceDiscoveryService.getServiceStats();
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error getting service stats:', error);
      return {
        success: false,
        message: 'Failed to get service stats',
        error: error.message,
      };
    }
  }
}