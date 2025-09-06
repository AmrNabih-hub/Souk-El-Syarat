import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

@Injectable()
export class DatabaseHealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);

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

      // Create PostgreSQL client
      const client = new Client({
        host,
        port,
        user: username,
        password,
        database,
        connectionTimeoutMillis: 5000,
      });

      // Connect and test
      await client.connect();
      const result = await client.query('SELECT 1 as test');
      await client.end();
      
      const responseTime = Date.now() - startTime;
      
      this.logger.debug(`Database health check passed in ${responseTime}ms`);
      
      return {
        status: 'up',
        responseTime,
        details: {
          host,
          port,
          database,
          testResult: result.rows[0]?.test,
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
        },
      };
    }
  }
}