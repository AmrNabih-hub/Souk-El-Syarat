import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  async executeOptimizedQuery<T>(query: () => Promise<T>, queryName: string): Promise<T> {
    try {
      const startTime = Date.now();
      
      // Execute the query
      const result = await query();
      
      const executionTime = Date.now() - startTime;
      
      // Log slow queries
      if (executionTime > 1000) {
        this.logger.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }
      
      this.logger.debug(`Query executed: ${queryName} in ${executionTime}ms`);
      
      return result;
    } catch (error) {
      this.logger.error(`Query error for ${queryName}:`, error);
      throw error;
    }
  }
}