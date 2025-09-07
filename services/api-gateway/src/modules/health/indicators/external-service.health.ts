import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ExternalServiceHealthIndicator {
  private readonly logger = new Logger(ExternalServiceHealthIndicator.name);
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'Souk-El-Syarat-Health-Check/1.0.0',
      },
    });
  }

  async check() {
    const startTime = Date.now();
    
    try {
      // Define services to check
      const services = [
        { name: 'user-service', url: 'http://user-service:3001/health' },
        { name: 'product-service', url: 'http://product-service:3002/health' },
        { name: 'order-service', url: 'http://order-service:3003/health' },
        { name: 'payment-service', url: 'http://payment-service:3004/health' },
        { name: 'notification-service', url: 'http://notification-service:3005/health' },
        { name: 'analytics-service', url: 'http://analytics-service:3006/health' },
      ];

      // Check all services in parallel
      const serviceChecks = await Promise.allSettled(
        services.map(service => this.checkService(service.name, service.url))
      );

      // Process results
      const results = serviceChecks.map((result, index) => {
        const service = services[index];
        
        if (result.status === 'fulfilled') {
          return {
            name: service.name,
            status: 'up',
            responseTime: result.value.responseTime,
            details: result.value.details,
          };
        } else {
          return {
            name: service.name,
            status: 'down',
            responseTime: 0,
            error: result.reason.message,
            details: {
              error: result.reason.message,
              code: result.reason.code,
            },
          };
        }
      });

      const responseTime = Date.now() - startTime;
      const healthyServices = results.filter(r => r.status === 'up').length;
      const totalServices = results.length;
      const overallStatus = healthyServices === totalServices ? 'up' : 'degraded';

      this.logger.debug(`External services health check completed in ${responseTime}ms: ${healthyServices}/${totalServices} healthy`);

      return {
        status: overallStatus,
        responseTime,
        details: {
          total: totalServices,
          healthy: healthyServices,
          unhealthy: totalServices - healthyServices,
          services: results,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error(`External services health check failed: ${error.message}`, error.stack);
      
      return {
        status: 'down',
        responseTime,
        error: error.message,
        details: {
          error: error.message,
          services: [],
        },
      };
    }
  }

  private async checkService(name: string, url: string) {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.get(url);
      const responseTime = Date.now() - startTime;
      
      return {
        responseTime,
        details: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.warn(`Service ${name} health check failed: ${error.message}`);
      
      throw {
        message: error.message,
        code: error.code,
        responseTime,
        service: name,
        url,
      };
    }
  }
}