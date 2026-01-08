package stability

import (
	"log"
	"math"
	"time"
)

// RetryConfig defines retry behavior
type RetryConfig struct {
	MaxAttempts      int           // Maximum number of retry attempts (default 3)
	InitialDelay     time.Duration // Initial delay before first retry (default 1 second)
	MaxDelay         time.Duration // Maximum delay between retries (default 32 seconds)
	BackoffMultiplier float64       // Multiplier for exponential backoff (default 2.0)
}

// DefaultRetryConfig provides sensible defaults
var DefaultRetryConfig = RetryConfig{
	MaxAttempts:       3,
	InitialDelay:      1 * time.Second,
	MaxDelay:          32 * time.Second,
	BackoffMultiplier: 2.0,
}

// IsRetryableError determines if error should trigger retry
type IsRetryableError func(error) bool

// DefaultIsRetryable considers network timeouts and temporary failures retryable
func DefaultIsRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Retryable errors: network timeouts, temporary failures, 500+ status codes
	errMsg := err.Error()
	retryableKeywords := []string{
		"timeout",
		"connection refused",
		"connection reset",
		"temporary failure",
		"503",
		"504",
		"500",
		"ETIMEDOUT",
		"ECONNREFUSED",
		"ECONNRESET",
	}

	for _, keyword := range retryableKeywords {
		if len(errMsg) > 0 && keyword == errMsg[:min(len(keyword), len(errMsg))] {
			return true
		}
	}
	return false
}

// Retry executes function with exponential backoff retry logic
func Retry(
	name string,
	fn func() error,
	isRetryable IsRetryableError,
	config RetryConfig,
) error {
	var lastErr error

	for attempt := 0; attempt < config.MaxAttempts; attempt++ {
		err := fn()
		if err == nil {
			return nil // Success
		}

		lastErr = err

		// Check if error is retryable
		if !isRetryable(err) {
			log.Printf("[Retry] %s attempt %d/%d: non-retryable error: %v", 
				name, attempt+1, config.MaxAttempts, err)
			return err // Don't retry non-retryable errors
		}

		// Last attempt, don't retry
		if attempt == config.MaxAttempts-1 {
			log.Printf("[Retry] %s attempt %d/%d: max attempts reached, giving up: %v",
				name, attempt+1, config.MaxAttempts, err)
			return err
		}

		// Calculate exponential backoff delay
		delay := calculateBackoffDelay(attempt, config)
		log.Printf("[Retry] %s attempt %d/%d failed: %v, retrying in %v",
			name, attempt+1, config.MaxAttempts, err, delay)

		time.Sleep(delay)
	}

	return lastErr
}

// RetryAsync is like Retry but for async operations returning a channel
func RetryAsync(
	name string,
	fn func() (interface{}, error),
	isRetryable IsRetryableError,
	config RetryConfig,
	resultChan chan interface{},
	errorChan chan error,
) {
	go func() {
		var lastErr error

		for attempt := 0; attempt < config.MaxAttempts; attempt++ {
			result, err := fn()
			if err == nil {
				resultChan <- result
				return
			}

			lastErr = err

			if !isRetryable(err) {
				errorChan <- err
				return
			}

			if attempt == config.MaxAttempts-1 {
				errorChan <- err
				return
			}

			delay := calculateBackoffDelay(attempt, config)
			time.Sleep(delay)
		}

		errorChan <- lastErr
	}()
}

// calculateBackoffDelay computes exponential backoff with jitter
func calculateBackoffDelay(attempt int, config RetryConfig) time.Duration {
	// Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
	exponentialDelay := time.Duration(
		float64(config.InitialDelay) * math.Pow(config.BackoffMultiplier, float64(attempt)),
	)

	// Cap at max delay
	if exponentialDelay > config.MaxDelay {
		exponentialDelay = config.MaxDelay
	}

	// Add jitter: random value between 0-10% of delay
	jitterRange := exponentialDelay / 10
	jitter := time.Duration(int64(float64(jitterRange) * 0.5)) // Simplified jitter

	return exponentialDelay + jitter
}

// RetryResult wraps result and error from retry operation
type RetryResult struct {
	Value interface{}
	Error error
	Attempt int
	Duration time.Duration
}

// RetryWithMetrics executes function with retry and returns detailed metrics
func RetryWithMetrics(
	name string,
	fn func() (interface{}, error),
	isRetryable IsRetryableError,
	config RetryConfig,
) *RetryResult {
	startTime := time.Now()
	var lastErr error

	for attempt := 0; attempt < config.MaxAttempts; attempt++ {
		result, err := fn()
		if err == nil {
			return &RetryResult{
				Value:    result,
				Error:    nil,
				Attempt:  attempt + 1,
				Duration: time.Since(startTime),
			}
		}

		lastErr = err

		if !isRetryable(err) {
			return &RetryResult{
				Value:    nil,
				Error:    err,
				Attempt:  attempt + 1,
				Duration: time.Since(startTime),
			}
		}

		if attempt == config.MaxAttempts-1 {
			return &RetryResult{
				Value:    nil,
				Error:    err,
				Attempt:  attempt + 1,
				Duration: time.Since(startTime),
			}
		}

		delay := calculateBackoffDelay(attempt, config)
		log.Printf("[Retry] %s attempt %d: %v (retrying in %v)", name, attempt+1, err, delay)
		time.Sleep(delay)
	}

	return &RetryResult{
		Value:    nil,
		Error:    lastErr,
		Attempt:  config.MaxAttempts,
		Duration: time.Since(startTime),
	}
}
