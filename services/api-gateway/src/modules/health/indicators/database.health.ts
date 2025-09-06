import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection, Connection } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);
  private connection: Connection | null = null;

  constructor(private readonly configService: ConfigService) {}

  async check() {
    const startTime = Date.now();
    
    try {
      // Get database configuration
      const host = this.configService.get<string>('DATABASE_HOST', 'localhost');
      const port = this.configService.get<number>('DATABASE_PORT', 5432);
      const username = this.configService.get<string>('DATABASE_USERNAME', 'postgres');
      const password = this.configService.get<string>('DATABASE_PASSWORD', 'postgres');
      const database = this.configService.get<string>('DATABASE_NAME', 'souk_el_syarat');

      // Create connection if not exists
      if (!this.connection) {
        this.connection = await createConnection({
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          synchronize: false,
          logging: false,
        });
      }

      // Test the connection
      await this.connection.query('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      this.logger.debug(`Database health check passed in ${responseTime}ms`);
      
      return {
        status: 'up',
        responseTime,
        details: {
          host,
          port,
          database,
          connectionId: this.connection?.isConnected ? 'connected' : 'disconnected',
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error(`Database health check failed: ${error.message}`, error.stack);
      
      return {
        status: 'down',
        responseTime,
        error: error.message,
        details: {
          error: error.message,
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
        },
      };
    }
  }

  async onModuleDestroy() {
    if (this.connection && this.connection.isConnected) {
      await this.connection.close();
      this.logger.log('Database connection closed');
    }
  }
}