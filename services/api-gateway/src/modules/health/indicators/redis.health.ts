import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisHealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly configService: ConfigService) {}

  async check() {
    const startTime = Date.now();
    let client: RedisClientType | null = null;
    
    try {
      // Get Redis configuration
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD');

      // Create client for this check
      client = createClient({
        socket: {
          host,
          port,
          connectTimeout: 5000,
        },
        password,
      });

      client.on('error', (err) => {
        this.logger.error('Redis client error:', err);
      });

      await client.connect();

      // Test the connection with PING
      const pong = await client.ping();
      
      if (pong !== 'PONG') {
        throw new Error('Redis PING did not return PONG');
      }

      // Get Redis info
      const info = await client.info('server');
      const memory = await client.info('memory');
      
      const responseTime = Date.now() - startTime;
      
      this.logger.debug(`Redis health check passed in ${responseTime}ms`);
      
      return {
        status: 'up',
        responseTime,
        details: {
          host,
          port,
          version: this.extractVersion(info),
          memory: this.extractMemoryInfo(memory),
          connectedClients: this.extractConnectedClients(info),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error(`Redis health check failed: ${error.message}`, error.stack);
      
      return {
        status: 'down',
        responseTime,
        error: error.message,
        details: {
          error: error.message,
          code: error.code,
          errno: error.errno,
        },
      };
    } finally {
      // Always close the client
      if (client && client.isOpen) {
        await client.quit();
      }
    }
  }

  private extractVersion(info: string): string {
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    return versionMatch ? versionMatch[1].trim() : 'unknown';
  }

  private extractMemoryInfo(memory: string): any {
    const usedMemory = memory.match(/used_memory:([^\r\n]+)/);
    const maxMemory = memory.match(/maxmemory:([^\r\n]+)/);
    
    return {
      used: usedMemory ? parseInt(usedMemory[1]) : 0,
      max: maxMemory ? parseInt(maxMemory[1]) : 0,
    };
  }

  private extractConnectedClients(info: string): number {
    const clientsMatch = info.match(/connected_clients:([^\r\n]+)/);
    return clientsMatch ? parseInt(clientsMatch[1]) : 0;
  }
}