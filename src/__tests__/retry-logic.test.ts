import { retry, retrySync, isRetryableError, RetryConfig } from '../../src/utils/retry-logic';
import { circuitBreakerManager } from '../../src/utils/circuit-breaker';

describe('isRetryableError', () => {
  it('should identify network errors as retryable', () => {
    const networkError = new TypeError('Failed to fetch');
    expect(isRetryableError(networkError)).toBe(true);
  });

  it('should identify timeout errors as retryable', () => {
    const timeoutError = new Error('Request timeout');
    expect(isRetryableError(timeoutError)).toBe(true);
  });

  it('should identify connection errors as retryable', () => {
    const connError = new Error('ECONNREFUSED');
    expect(isRetryableError(connError)).toBe(true);
  });

  it('should not identify non-network errors as retryable', () => {
    const appError = new Error('Invalid input');
    expect(isRetryableError(appError)).toBe(false);
  });

  it('should handle non-Error values', () => {
    expect(isRetryableError('string error')).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe('retry', () => {
  beforeEach(() => {
    circuitBreakerManager.resetAll();
  });

  it('should succeed on first attempt if no error', async () => {
    const fn = jest.fn(async () => 'success');
    const result = await retry(fn, 'test-service');

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient failures', async () => {
    let attempts = 0;
    const fn = jest.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new TypeError('Failed to fetch');
      }
      return 'success';
    });

    const result = await retry(fn, 'test-service', { maxAttempts: 3 });

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail immediately on non-retryable errors', async () => {
    const fn = jest.fn(async () => {
      throw new Error('Invalid input');
    });

    const result = await retry(fn, 'test-service', { maxAttempts: 3 });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should respect max attempts limit', async () => {
    const fn = jest.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await retry(fn, 'test-service', { maxAttempts: 3 });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should implement exponential backoff', async () => {
    const timings: number[] = [];
    let attempts = 0;

    const fn = jest.fn(async () => {
      timings.push(Date.now());
      attempts++;
      if (attempts < 3) {
        throw new TypeError('Failed to fetch');
      }
      return 'success';
    });

    await retry(fn, 'test-service', {
      maxAttempts: 3,
      initialDelay: 10,
      maxDelay: 100,
      backoffMultiplier: 2,
      jitter: false,
    });

    // Timing differences should roughly match exponential backoff
    if (timings.length >= 2) {
      const delay1 = timings[1] - timings[0];
      expect(delay1).toBeGreaterThanOrEqual(10); // ~10ms
    }
  });

  it('should handle circuit breaker', async () => {
    circuitBreakerManager.recordFailure('test-service');
    circuitBreakerManager.recordFailure('test-service');
    circuitBreakerManager.recordFailure('test-service');
    circuitBreakerManager.recordFailure('test-service');
    circuitBreakerManager.recordFailure('test-service');

    const fn = jest.fn(async () => 'success');
    const result = await retry(fn, 'test-service');

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Circuit breaker open');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should return total duration', async () => {
    const fn = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'success';
    });

    const result = await retry(fn, 'test-service');

    expect(result.totalDuration).toBeGreaterThanOrEqual(10);
  });
});

describe('retrySync', () => {
  beforeEach(() => {
    circuitBreakerManager.resetAll();
  });

  it('should succeed on first attempt if no error', () => {
    const fn = jest.fn(() => 'success');
    const result = retrySync(fn, 'test-service');

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
  });

  it('should not retry on transient failures (sync)', () => {
    let attempts = 0;
    const fn = jest.fn(() => {
      attempts++;
      if (attempts < 3) {
        throw new TypeError('Failed to fetch');
      }
      return 'success';
    });

    const result = retrySync(fn, 'test-service', { maxAttempts: 3 });

    // Sync retry doesn't actually sleep, so it only tries once
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
  });

  it('should fail immediately on non-retryable errors', () => {
    const fn = jest.fn(() => {
      throw new Error('Invalid input');
    });

    const result = retrySync(fn, 'test-service', { maxAttempts: 3 });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
  });
});
