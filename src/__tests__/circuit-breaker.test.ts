import { CircuitBreaker, CircuitBreakerManager } from '../../src/utils/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, timeout: 1000 });
  });

  describe('Initial State', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('should return zero failure count', () => {
      expect(breaker.getFailureCount()).toBe(0);
    });

    it('should allow execution', () => {
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe('Closed State', () => {
    it('should allow executions', () => {
      expect(breaker.canExecute()).toBe(true);
    });

    it('should record success', () => {
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('closed');
    });

    it('should increment failure count on failure', () => {
      breaker.recordFailure();
      expect(breaker.getFailureCount()).toBe(1);
    });

    it('should transition to open after threshold failures', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
    });

    it('should reset failure count on success', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      expect(breaker.getFailureCount()).toBe(0);
    });
  });

  describe('Open State', () => {
    beforeEach(() => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
    });

    it('should be in open state', () => {
      expect(breaker.getState()).toBe('open');
    });

    it('should not allow execution', () => {
      expect(breaker.canExecute()).toBe(false);
    });

    it('should transition to half-open after timeout', (done) => {
      setTimeout(() => {
        expect(breaker.canExecute()).toBe(true);
        expect(breaker.getState()).toBe('half-open');
        done();
      }, 1100);
    });
  });

  describe('Half-Open State', () => {
    beforeEach((done) => {
      // Open the circuit
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      // Wait for timeout
      setTimeout(() => {
        breaker.canExecute();
        done();
      }, 1100);
    });

    it('should be in half-open state', () => {
      expect(breaker.getState()).toBe('half-open');
    });

    it('should allow execution', () => {
      expect(breaker.canExecute()).toBe(true);
    });

    it('should close on successful executions', () => {
      breaker.recordSuccess();
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('closed');
    });

    it('should reopen on failure', () => {
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('Reset', () => {
    it('should reset to closed state', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');

      breaker.reset();
      expect(breaker.getState()).toBe('closed');
      expect(breaker.getFailureCount()).toBe(0);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager({ failureThreshold: 2, timeout: 1000 });
  });

  it('should manage multiple circuits', () => {
    expect(manager.canExecute('service1')).toBe(true);
    expect(manager.canExecute('service2')).toBe(true);
  });

  it('should record failures per service', () => {
    manager.recordFailure('service1');
    manager.recordFailure('service1');
    manager.recordFailure('service2');

    expect(manager.canExecute('service1')).toBe(false);
    expect(manager.canExecute('service2')).toBe(true);
  });

  it('should record successes per service', () => {
    manager.recordFailure('service1');
    manager.recordSuccess('service1');

    expect(manager.getBreaker('service1').getFailureCount()).toBe(0);
  });

  it('should get all states', () => {
    manager.recordFailure('service1');
    manager.recordFailure('service1');

    const states = manager.getAllStates();
    expect(states['service1']).toBe('open');
  });

  it('should reset all circuits', () => {
    manager.recordFailure('service1');
    manager.recordFailure('service1');
    manager.recordFailure('service2');

    manager.resetAll();

    expect(manager.canExecute('service1')).toBe(true);
    expect(manager.canExecute('service2')).toBe(true);
  });

  it('should reset specific circuit', () => {
    manager.recordFailure('service1');
    manager.recordFailure('service1');
    manager.recordFailure('service2');
    manager.recordFailure('service2');

    manager.reset('service1');

    expect(manager.canExecute('service1')).toBe(true);
    expect(manager.canExecute('service2')).toBe(false);
  });
});
