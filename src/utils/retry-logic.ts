/**
 * Exponential Backoff Retry Logic with Circuit Breaker Integration
 * Handles transient failures gracefully
 */

import { circuitBreakerManager } from './circuit-breaker';

export interface RetryConfig {
  maxAttempts?: number; // Default: 3
  initialDelay?: number; // Default: 1000ms
  maxDelay?: number; // Default: 32000ms (cap exponential growth)
  backoffMultiplier?: number; // Default: 2
  jitter?: boolean; // Default: true
}

export interface RetryResult<T> {
  data: T | null;
  error: Error | null;
  attempts: number;
  totalDuration: number;
  success: boolean;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // Network errors
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('refused')
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('ehostunreach') ||
      message.includes('enetunreach')
    );
  }

  return false;
}

/**
 * Calculate exponential backoff delay with optional jitter
 */
function calculateBackoffDelay(
  attempt: number,
  config: Required<RetryConfig>
): number {
  const exponentialDelay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );

  if (!config.jitter) {
    return exponentialDelay;
  }

  // Add random jitter (0-50% of delay)
  const jitterAmount = Math.random() * (exponentialDelay * 0.5);
  return exponentialDelay + jitterAmount;
}

/**
 * Retry an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  serviceName: string = 'unknown',
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const finalConfig: Required<RetryConfig> = {
    maxAttempts: config.maxAttempts || 3,
    initialDelay: config.initialDelay || 1000,
    maxDelay: config.maxDelay || 32000,
    backoffMultiplier: config.backoffMultiplier || 2,
    jitter: config.jitter !== false,
  };

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    // Check circuit breaker before executing
    if (!circuitBreakerManager.canExecute(serviceName)) {
      const error = new Error(`Circuit breaker open for ${serviceName}`);
      console.warn(`[Retry] ${error.message}`);
      return {
        data: null,
        error,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
        success: false,
      };
    }

    try {
      const result = await fn();
      circuitBreakerManager.recordSuccess(serviceName);
      return {
        data: result,
        error: null,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const retryable = isRetryableError(error);
      if (!retryable || attempt === finalConfig.maxAttempts - 1) {
        circuitBreakerManager.recordFailure(serviceName);
        console.error(
          `[Retry] Failed after ${attempt + 1} attempt(s) for ${serviceName}:`,
          lastError.message
        );
        return {
          data: null,
          error: lastError,
          attempts: attempt + 1,
          totalDuration: Date.now() - startTime,
          success: false,
        };
      }

      const delay = calculateBackoffDelay(attempt, finalConfig);
      console.warn(
        `[Retry] Attempt ${attempt + 1} failed for ${serviceName}, retrying in ${Math.round(delay)}ms:`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  circuitBreakerManager.recordFailure(serviceName);
  return {
    data: null,
    error: lastError || new Error('Unknown error'),
    attempts: finalConfig.maxAttempts,
    totalDuration: Date.now() - startTime,
    success: false,
  };
}

/**
 * Synchronous retry with callback
 */
export function retrySync<T>(
  fn: () => T,
  serviceName: string = 'unknown',
  config: RetryConfig = {}
): RetryResult<T> {
  const finalConfig: Required<RetryConfig> = {
    maxAttempts: config.maxAttempts || 3,
    initialDelay: config.initialDelay || 1000,
    maxDelay: config.maxDelay || 32000,
    backoffMultiplier: config.backoffMultiplier || 2,
    jitter: config.jitter !== false,
  };

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    // Check circuit breaker before executing
    if (!circuitBreakerManager.canExecute(serviceName)) {
      const error = new Error(`Circuit breaker open for ${serviceName}`);
      console.warn(`[RetrySync] ${error.message}`);
      return {
        data: null,
        error,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
        success: false,
      };
    }

    try {
      const result = fn();
      circuitBreakerManager.recordSuccess(serviceName);
      return {
        data: result,
        error: null,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const retryable = isRetryableError(error);
      if (!retryable || attempt === finalConfig.maxAttempts - 1) {
        circuitBreakerManager.recordFailure(serviceName);
        console.error(
          `[RetrySync] Failed after ${attempt + 1} attempt(s) for ${serviceName}:`,
          lastError.message
        );
        return {
          data: null,
          error: lastError,
          attempts: attempt + 1,
          totalDuration: Date.now() - startTime,
          success: false,
        };
      }

      // For sync operations, we calculate delay but don't actually sleep
      // (sleeping synchronously would block the entire application)
      const delay = calculateBackoffDelay(attempt, finalConfig);
      console.warn(
        `[RetrySync] Attempt ${attempt + 1} failed for ${serviceName} (would retry in ${Math.round(delay)}ms):`,
        lastError.message
      );
    }
  }

  circuitBreakerManager.recordFailure(serviceName);
  return {
    data: null,
    error: lastError || new Error('Unknown error'),
    attempts: finalConfig.maxAttempts,
    totalDuration: Date.now() - startTime,
    success: false,
  };
}

/**
 * Decorator for retrying async functions
 * Usage: @retryDecorator({ maxAttempts: 3 })
 *        async myFetch() { ... }
 */
export function retryDecorator(config: RetryConfig = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(
        () => originalMethod.apply(this, args),
        `${target.constructor.name}.${propertyKey}`,
        config
      );
    };

    return descriptor;
  };
}
