import { Injectable, Logger } from '@nestjs/common';

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  successCount: number;
  nextAttemptTime?: Date;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  timeout: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly configs = new Map<string, CircuitBreakerConfig>();

  constructor() {
    // Default configuration
    this.configs.set('default', {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      successThreshold: 3,
      timeout: 5000, // 5 seconds
    });
  }

  setConfig(name: string, config: CircuitBreakerConfig): void {
    this.configs.set(name, config);
    this.logger.debug(`Circuit breaker config set for ${name}:`, config);
  }

  getConfig(name: string): CircuitBreakerConfig {
    return this.configs.get(name) || this.configs.get('default')!;
  }

  getState(name: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuitBreakers.get(name)!;
  }

  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const state = this.getState(name);
    const config = this.getConfig(name);

    // Check if circuit is open and should remain open
    if (state.state === 'OPEN') {
      if (state.nextAttemptTime && new Date() < state.nextAttemptTime) {
        this.logger.warn(`Circuit breaker ${name} is OPEN, using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker ${name} is OPEN`);
      } else {
        // Move to HALF_OPEN state
        state.state = 'HALF_OPEN';
        state.successCount = 0;
        this.logger.debug(`Circuit breaker ${name} moved to HALF_OPEN state`);
      }
    }

    try {
      // Execute the operation with timeout
      const result = await this.executeWithTimeout(operation, config.timeout);
      
      // Operation succeeded
      this.onSuccess(name);
      return result;
    } catch (error) {
      // Operation failed
      this.onFailure(name);
      this.logger.error(`Circuit breaker ${name} operation failed:`, error);
      
      if (fallback) {
        this.logger.debug(`Circuit breaker ${name} using fallback`);
        return await fallback();
      }
      
      throw error;
    }
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Operation timeout'));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private onSuccess(name: string): void {
    const state = this.getState(name);
    const config = this.getConfig(name);

    if (state.state === 'HALF_OPEN') {
      state.successCount++;
      if (state.successCount >= config.successThreshold) {
        state.state = 'CLOSED';
        state.failureCount = 0;
        state.successCount = 0;
        this.logger.debug(`Circuit breaker ${name} moved to CLOSED state`);
      }
    } else if (state.state === 'CLOSED') {
      state.failureCount = 0;
    }
  }

  private onFailure(name: string): void {
    const state = this.getState(name);
    const config = this.getConfig(name);

    state.failureCount++;
    state.lastFailureTime = new Date();

    if (state.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN state moves back to OPEN
      state.state = 'OPEN';
      state.nextAttemptTime = new Date(Date.now() + config.recoveryTimeout);
      this.logger.warn(`Circuit breaker ${name} moved back to OPEN state`);
    } else if (state.state === 'CLOSED' && state.failureCount >= config.failureThreshold) {
      // Move to OPEN state
      state.state = 'OPEN';
      state.nextAttemptTime = new Date(Date.now() + config.recoveryTimeout);
      this.logger.warn(`Circuit breaker ${name} moved to OPEN state`);
    }
  }

  reset(name: string): void {
    this.circuitBreakers.set(name, {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
    });
    this.logger.debug(`Circuit breaker ${name} reset`);
  }

  getStats(): any {
    const stats = {
      totalCircuitBreakers: this.circuitBreakers.size,
      states: {
        CLOSED: 0,
        OPEN: 0,
        HALF_OPEN: 0,
      },
      circuitBreakers: [] as any[],
    };

    for (const [name, state] of this.circuitBreakers) {
      stats.states[state.state]++;
      stats.circuitBreakers.push({
        name,
        state: state.state,
        failureCount: state.failureCount,
        successCount: state.successCount,
        lastFailureTime: state.lastFailureTime,
        nextAttemptTime: state.nextAttemptTime,
      });
    }

    return stats;
  }
}