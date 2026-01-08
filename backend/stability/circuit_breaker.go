package stability

import (
	"fmt"
	"sync"
	"time"
)

// CircuitState represents the state of a circuit breaker
type CircuitState string

const (
	StateClosed   CircuitState = "closed"   // Normal operation, requests allowed
	StateOpen     CircuitState = "open"     // Failed, requests blocked
	StateHalfOpen CircuitState = "half-open" // Testing if service recovered
)

// CircuitBreaker implements the circuit breaker pattern to prevent cascading failures
type CircuitBreaker struct {
	name              string
	failureThreshold  int           // Number of failures before opening circuit
	successThreshold  int           // Number of successes before closing circuit
	timeout           time.Duration // How long circuit stays open before trying again
	mu                sync.RWMutex
	state             CircuitState
	failureCount      int
	successCount      int
	lastFailureTime   time.Time
	lastStateChange   time.Time
}

// NewCircuitBreaker creates a new circuit breaker with default settings
// failureThreshold: 5 failures opens the circuit
// timeout: 60 seconds before attempting half-open
func NewCircuitBreaker(name string) *CircuitBreaker {
	return &CircuitBreaker{
		name:             name,
		failureThreshold: 5,
		successThreshold: 2,
		timeout:          60 * time.Second,
		state:            StateClosed,
		lastStateChange:  time.Now(),
	}
}

// RecordSuccess records a successful request
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.failureCount = 0

	if cb.state == StateHalfOpen {
		cb.successCount++
		if cb.successCount >= cb.successThreshold {
			cb.transitionToState(StateClosed)
			cb.successCount = 0
		}
	}
}

// RecordFailure records a failed request
func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.failureCount++
	cb.lastFailureTime = time.Now()
	cb.successCount = 0

	if cb.failureCount >= cb.failureThreshold && cb.state == StateClosed {
		cb.transitionToState(StateOpen)
	}
}

// CanExecute returns true if request can be executed
func (cb *CircuitBreaker) CanExecute() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	switch cb.state {
	case StateClosed:
		return true
	case StateOpen:
		// Check if timeout has passed, move to half-open
		if time.Since(cb.lastFailureTime) >= cb.timeout {
			cb.transitionToState(StateHalfOpen)
			cb.successCount = 0
			return true
		}
		return false
	case StateHalfOpen:
		return true
	}
	return false
}

// GetState returns current circuit breaker state
func (cb *CircuitBreaker) GetState() CircuitState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// GetStatus returns human-readable status
func (cb *CircuitBreaker) GetStatus() string {
	cb.mu.RLock()
	defer cb.mu.RUnlock()

	return fmt.Sprintf("state=%s failures=%d successes=%d changed=%v",
		cb.state, cb.failureCount, cb.successCount, cb.lastStateChange)
}

// transitionToState is internal method that changes state and logs it
func (cb *CircuitBreaker) transitionToState(newState CircuitState) {
	if cb.state != newState {
		oldState := cb.state
		cb.state = newState
		cb.lastStateChange = time.Now()
		fmt.Printf("[CircuitBreaker] %s: %s -> %s\n", cb.name, oldState, newState)
	}
}

// CircuitBreakerManager manages multiple circuit breakers for different datasources
type CircuitBreakerManager struct {
	mu          sync.RWMutex
	breakers    map[string]*CircuitBreaker
}

// NewCircuitBreakerManager creates a new manager
func NewCircuitBreakerManager() *CircuitBreakerManager {
	return &CircuitBreakerManager{
		breakers: make(map[string]*CircuitBreaker),
	}
}

// GetOrCreate gets or creates a circuit breaker for a datasource
func (cbm *CircuitBreakerManager) GetOrCreate(datasource string) *CircuitBreaker {
	cbm.mu.Lock()
	defer cbm.mu.Unlock()

	if breaker, exists := cbm.breakers[datasource]; exists {
		return breaker
	}

	breaker := NewCircuitBreaker(datasource)
	cbm.breakers[datasource] = breaker
	return breaker
}

// GetStatus returns status of all circuit breakers
func (cbm *CircuitBreakerManager) GetStatus() map[string]string {
	cbm.mu.RLock()
	defer cbm.mu.RUnlock()

	status := make(map[string]string)
	for name, breaker := range cbm.breakers {
		status[name] = breaker.GetStatus()
	}
	return status
}

// GetHealthStatus returns which datasources are healthy (circuit closed or half-open)
func (cbm *CircuitBreakerManager) GetHealthStatus() map[string]bool {
	cbm.mu.RLock()
	defer cbm.mu.RUnlock()

	health := make(map[string]bool)
	for name, breaker := range cbm.breakers {
		state := breaker.GetState()
		health[name] = state == StateClosed || state == StateHalfOpen
	}
	return health
}
