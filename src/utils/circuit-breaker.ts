/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when a service is unavailable
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold?: number; // Number of failures before opening (default: 5)
  timeout?: number; // Milliseconds to wait before half-open (default: 60000)
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private failureThreshold: number;
  private timeout: number;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.timeout = config.timeout || 60000; // 60 seconds
  }

  /**
   * Check if the circuit allows execution
   */
  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if timeout has elapsed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
        this.successCount = 0;
        console.log('[CircuitBreaker] Transitioning to half-open state');
        return true;
      }
      return false;
    }

    // Half-open state
    return true;
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      // Allow 2 successful calls in half-open before closing
      if (this.successCount >= 2) {
        this.state = 'closed';
        console.log('[CircuitBreaker] Circuit closed - service recovered');
      }
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Immediately reopen on first failure in half-open
      this.state = 'open';
      console.log('[CircuitBreaker] Half-open failure - reopening circuit');
      return;
    }

    if (this.failureCount >= this.failureThreshold && this.state === 'closed') {
      this.state = 'open';
      console.log(
        `[CircuitBreaker] Failure threshold reached (${this.failureCount}/${this.failureThreshold}) - opening circuit`
      );
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Reset circuit to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Circuit Breaker Manager for handling multiple circuits
 * One circuit per data source (Prometheus, Loki, Database, etc)
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = config;
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(this.config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Check if a service can be called
   */
  canExecute(serviceName: string): boolean {
    return this.getBreaker(serviceName).canExecute();
  }

  /**
   * Record success for a service
   */
  recordSuccess(serviceName: string): void {
    this.getBreaker(serviceName).recordSuccess();
  }

  /**
   * Record failure for a service
   */
  recordFailure(serviceName: string): void {
    this.getBreaker(serviceName).recordFailure();
  }

  /**
   * Get all breaker states
   */
  getAllStates(): Record<string, CircuitState> {
    const states: Record<string, CircuitState> = {};
    this.breakers.forEach((breaker, name) => {
      states[name] = breaker.getState();
    });
    return states;
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => {
      breaker.reset();
    });
  }

  /**
   * Reset a specific service's circuit
   */
  reset(serviceName: string): void {
    this.breakers.get(serviceName)?.reset();
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager({
  failureThreshold: 5,
  timeout: 60000, // 60 seconds
});
