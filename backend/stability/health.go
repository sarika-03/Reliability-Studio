package stability

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// HealthStatus represents the health of a component
type HealthStatus string

const (
	StatusHealthy   HealthStatus = "healthy"
	StatusDegraded  HealthStatus = "degraded"
	StatusUnhealthy HealthStatus = "unhealthy"
	StatusUnknown   HealthStatus = "unknown"
)

// ComponentHealth represents health of a single component
type ComponentHealth struct {
	Name        string        `json:"name"`
	Status      HealthStatus  `json:"status"`
	Message     string        `json:"message"`
	LastChecked time.Time     `json:"last_checked"`
	ResponseTime time.Duration `json:"response_time_ms"`
}

// SystemHealth represents overall system health
type SystemHealth struct {
	Status     HealthStatus             `json:"status"`
	Timestamp  time.Time                `json:"timestamp"`
	Components map[string]ComponentHealth `json:"components"`
	Uptime     time.Duration            `json:"uptime"`
}

// HealthChecker monitors system component health
type HealthChecker struct {
	mu              sync.RWMutex
	db              *sql.DB
	prometheusURL   string
	lokiURL         string
	correlationReady func() bool
	lastCheck       SystemHealth
	startTime       time.Time
	checks          map[string]func(context.Context) ComponentHealth
}

// NewHealthChecker creates a new health checker
func NewHealthChecker(
	db *sql.DB,
	prometheusURL string,
	lokiURL string,
	correlationReady func() bool,
) *HealthChecker {
	hc := &HealthChecker{
		db:              db,
		prometheusURL:   prometheusURL,
		lokiURL:         lokiURL,
		correlationReady: correlationReady,
		startTime:       time.Now(),
		checks: make(map[string]func(context.Context) ComponentHealth),
	}

	// Register default checks
	hc.RegisterCheck("database", hc.checkDatabase)
	hc.RegisterCheck("prometheus", hc.checkPrometheus)
	hc.RegisterCheck("loki", hc.checkLoki)
	hc.RegisterCheck("correlation_engine", hc.checkCorrelationEngine)

	return hc
}

// RegisterCheck registers a custom health check
func (hc *HealthChecker) RegisterCheck(name string, check func(context.Context) ComponentHealth) {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	hc.checks[name] = check
}

// Check performs health check of all components
func (hc *HealthChecker) Check(ctx context.Context) *SystemHealth {
	hc.mu.Lock()
	defer hc.mu.Unlock()

	components := make(map[string]ComponentHealth)
	overallStatus := StatusHealthy

	// Run all checks concurrently
	results := make(chan struct{ name string; health ComponentHealth }, len(hc.checks))
	var wg sync.WaitGroup

	for name, check := range hc.checks {
		wg.Add(1)
		go func(n string, c func(context.Context) ComponentHealth) {
			defer wg.Done()
			health := c(ctx)
			results <- struct{ name string; health ComponentHealth }{n, health}
		}(name, check)
	}

	// Collect results
	go func() {
		wg.Wait()
		close(results)
	}()

	for result := range results {
		components[result.name] = result.health
		if result.health.Status != StatusHealthy && overallStatus == StatusHealthy {
			overallStatus = StatusDegraded
		}
		if result.health.Status == StatusUnhealthy {
			overallStatus = StatusUnhealthy
		}
	}

	// Determine overall status
	unhealthyCount := 0
	for _, c := range components {
		if c.Status == StatusUnhealthy {
			unhealthyCount++
		}
	}

	if unhealthyCount == 0 {
		overallStatus = StatusHealthy
	} else if unhealthyCount == len(components) {
		overallStatus = StatusUnhealthy
	} else {
		overallStatus = StatusDegraded
	}

	systemHealth := &SystemHealth{
		Status:     overallStatus,
		Timestamp:  time.Now(),
		Components: components,
		Uptime:     time.Since(hc.startTime),
	}

	hc.lastCheck = *systemHealth
	return systemHealth
}

// GetLastCheck returns the last health check result
func (hc *HealthChecker) GetLastCheck() *SystemHealth {
	hc.mu.RLock()
	defer hc.mu.RUnlock()
	return &hc.lastCheck
}

// checkDatabase checks PostgreSQL connection
func (hc *HealthChecker) checkDatabase(ctx context.Context) ComponentHealth {
	startTime := time.Now()
	status := StatusHealthy
	message := "Database connection OK"

	// Simple ping with timeout
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := hc.db.PingContext(pingCtx); err != nil {
		status = StatusUnhealthy
		message = fmt.Sprintf("Database ping failed: %v", err)
	}

	return ComponentHealth{
		Name:         "database",
		Status:       status,
		Message:      message,
		LastChecked:  time.Now(),
		ResponseTime: time.Since(startTime),
	}
}

// checkPrometheus checks Prometheus connectivity
func (hc *HealthChecker) checkPrometheus(ctx context.Context) ComponentHealth {
	startTime := time.Now()
	status := StatusHealthy
	message := "Prometheus OK"

	// Try to reach Prometheus health endpoint
	healthURL := fmt.Sprintf("%s/-/healthy", hc.prometheusURL)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Use simple HTTP GET
	req, err := http.NewRequestWithContext(ctx, "GET", healthURL, nil)
	if err != nil {
		status = StatusUnhealthy
		message = fmt.Sprintf("Failed to create request: %v", err)
		return ComponentHealth{
			Name:         "prometheus",
			Status:       status,
			Message:      message,
			LastChecked:  time.Now(),
			ResponseTime: time.Since(startTime),
		}
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		status = StatusUnhealthy
		message = fmt.Sprintf("Prometheus unreachable: %v", err)
	} else if resp.StatusCode != http.StatusOK {
		status = StatusUnhealthy
		message = fmt.Sprintf("Prometheus returned status %d", resp.StatusCode)
		resp.Body.Close()
	} else {
		resp.Body.Close()
		message = "Prometheus OK"
	}

	return ComponentHealth{
		Name:         "prometheus",
		Status:       status,
		Message:      message,
		LastChecked:  time.Now(),
		ResponseTime: time.Since(startTime),
	}
}

// checkLoki checks Loki connectivity
// NOTE: Loki's /ready endpoint may return non-200 during ring initialization.
// We check the metrics endpoint instead to verify Loki is responding.
// Only report unhealthy if Loki is completely unreachable.
func (hc *HealthChecker) checkLoki(ctx context.Context) ComponentHealth {
	startTime := time.Now()
	status := StatusHealthy
	message := "Loki OK"

	// First try /metrics endpoint - more lenient than /ready
	metricsURL := fmt.Sprintf("%s/metrics", hc.lokiURL)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", metricsURL, nil)
	if err != nil {
		status = StatusUnhealthy
		message = fmt.Sprintf("Failed to create request: %v", err)
		return ComponentHealth{
			Name:         "loki",
			Status:       status,
			Message:      message,
			LastChecked:  time.Now(),
			ResponseTime: time.Since(startTime),
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		status = StatusUnhealthy
		message = fmt.Sprintf("Loki unreachable: %v", err)
	} else {
		defer resp.Body.Close()
		// Accept any 2xx or 3xx as "Loki is available"
		// Accept 503 with grace period as it may be starting up
		if resp.StatusCode >= 200 && resp.StatusCode < 400 {
			status = StatusHealthy
			message = "Loki OK"
		} else if resp.StatusCode == http.StatusServiceUnavailable {
			// Loki may be initializing - degrade but don't fail
			status = StatusDegraded
			message = "Loki initializing (ring startup)"
		} else {
			status = StatusUnhealthy
			message = fmt.Sprintf("Loki returned status %d", resp.StatusCode)
		}
	}

	return ComponentHealth{
		Name:         "loki",
		Status:       status,
		Message:      message,
		LastChecked:  time.Now(),
		ResponseTime: time.Since(startTime),
	}
}

// checkCorrelationEngine checks correlation engine status
func (hc *HealthChecker) checkCorrelationEngine(ctx context.Context) ComponentHealth {
	startTime := time.Now()
	status := StatusHealthy
	message := "Correlation engine OK"

	if !hc.correlationReady() {
		status = StatusDegraded
		message = "Correlation engine not ready"
	}

	return ComponentHealth{
		Name:         "correlation_engine",
		Status:       status,
		Message:      message,
		LastChecked:  time.Now(),
		ResponseTime: time.Since(startTime),
	}
}
