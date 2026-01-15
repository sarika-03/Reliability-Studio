package middleware

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sarika-03/Reliability-Studio/clients"
)

// TelemetryMiddleware tracks HTTP requests, errors, and latency
// Push metrics to Prometheus and logs to Loki
type TelemetryMiddleware struct {
	promClient *clients.PrometheusClient
	lokiClient *clients.LokiClient
	serviceName string
}

// NewTelemetryMiddleware creates a new telemetry middleware
func NewTelemetryMiddleware(promClient *clients.PrometheusClient, lokiClient *clients.LokiClient, serviceName string) *TelemetryMiddleware {
	return &TelemetryMiddleware{
		promClient:  promClient,
		lokiClient:  lokiClient,
		serviceName: serviceName,
	}
}

// Middleware returns the telemetry middleware as an http.Handler wrapper
func (tm *TelemetryMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Generate trace ID for request correlation
		traceID := uuid.New().String()
		ctx := context.WithValue(r.Context(), "trace-id", traceID)
		r = r.WithContext(ctx)

		// Wrap response writer to capture status code and bytes written
		wrapped := &responseWriterWrapper{ResponseWriter: w, statusCode: http.StatusOK}

		// Record start time for latency calculation
		startTime := time.Now()

		// Call next handler
		next.ServeHTTP(wrapped, r)

		// Calculate latency
		duration := time.Since(startTime)

		// Skip health check and internal endpoints from telemetry
		if tm.shouldSkipTelemetry(r.URL.Path) {
			return
		}

		// Push metrics to Prometheus asynchronously
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			tm.recordMetrics(ctx, r, wrapped, duration, traceID)
		}()

		// Push logs to Loki asynchronously
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			tm.recordLogs(ctx, r, wrapped, duration, traceID)
		}()
	})
}

// recordMetrics records request metrics to Prometheus
func (tm *TelemetryMiddleware) recordMetrics(ctx context.Context, r *http.Request, w *responseWriterWrapper, duration time.Duration, traceID string) {
	if tm.promClient == nil {
		return
	}

	// Get method and path
	method := r.Method
	path := r.URL.Path
	status := fmt.Sprintf("%d", w.statusCode)

	// Common labels for all metrics
	labels := map[string]string{
		"service":     tm.serviceName,
		"method":      method,
		"endpoint":    path,
		"status_code": status,
		"trace_id":    traceID,
	}

	// Push request count metric
	if err := tm.promClient.PushCounter(ctx, "http_requests_total", 1, labels); err != nil {
		log.Printf("⚠️  Failed to push request metric: %v", err)
	}

	// Push latency metric (convert to seconds for Prometheus)
	latencySeconds := duration.Seconds()
	histogramLabels := make(map[string]string)
	for k, v := range labels {
		histogramLabels[k] = v
	}
	histogramLabels["le"] = fmt.Sprintf("%.3f", latencySeconds)
	
	if err := tm.promClient.PushHistogram(ctx, "http_request_duration_seconds", latencySeconds, histogramLabels); err != nil {
		log.Printf("⚠️  Failed to push latency metric: %v", err)
	}

	// Push error metric if status >= 400
	if w.statusCode >= 400 {
		errorLabels := make(map[string]string)
		for k, v := range labels {
			errorLabels[k] = v
		}
		if err := tm.promClient.PushCounter(ctx, "http_requests_error_total", 1, errorLabels); err != nil {
			log.Printf("⚠️  Failed to push error metric: %v", err)
		}
	}

	// Log metrics push
	log.Printf("📊 Metrics: %s %s -> %d in %dms (trace: %s)", method, path, w.statusCode, duration.Milliseconds(), traceID)
}

// recordLogs records request logs to Loki
func (tm *TelemetryMiddleware) recordLogs(ctx context.Context, r *http.Request, w *responseWriterWrapper, duration time.Duration, traceID string) {
	if tm.lokiClient == nil {
		return
	}

	// Determine log level based on status code
	level := "info"
	if w.statusCode >= 500 {
		level = "error"
	} else if w.statusCode >= 400 {
		level = "warn"
	}

	// Build log message
	message := fmt.Sprintf(
		"%s %s %d %dms",
		r.Method,
		r.URL.Path,
		w.statusCode,
		duration.Milliseconds(),
	)

	// Log labels
	labels := map[string]string{
		"service":    tm.serviceName,
		"method":     r.Method,
		"status":     fmt.Sprintf("%d", w.statusCode),
		"trace_id":   traceID,
		"user_agent": r.Header.Get("User-Agent"),
	}

	// Extract IP address
	if clientIP := r.Header.Get("X-Forwarded-For"); clientIP != "" {
		labels["client_ip"] = strings.Split(clientIP, ",")[0]
	} else {
		labels["client_ip"] = r.RemoteAddr
	}

	// Push log to Loki
	if err := tm.lokiClient.PushLog(ctx, tm.serviceName, level, message, labels); err != nil {
		log.Printf("⚠️  Failed to push log to Loki: %v", err)
	}

	// Log to stdout as well
	log.Printf("📝 [%s] %s %s -> %d in %dms (trace: %s)", level, r.Method, r.URL.Path, w.statusCode, duration.Milliseconds(), traceID)
}

// shouldSkipTelemetry determines if a path should skip telemetry recording
func (tm *TelemetryMiddleware) shouldSkipTelemetry(path string) bool {
	// Skip health checks and metrics endpoints
	skipPaths := []string{
		"/health",
		"/api/health",
		"/metrics",
		"/ready",
		"/-/",  // Prometheus internal endpoints
		"/api/realtime",
	}

	for _, skip := range skipPaths {
		if strings.HasPrefix(path, skip) || strings.Contains(path, skip) {
			return true
		}
	}

	return false
}

// extractServiceFromPath extracts service name from API path
func (tm *TelemetryMiddleware) extractServiceFromPath(path string) string {
	// Example: /api/incidents -> incidents
	parts := strings.Split(strings.TrimPrefix(path, "/api/"), "/")
	if len(parts) > 0 && parts[0] != "" {
		return parts[0]
	}
	return "unknown"
}

// responseWriterWrapper wraps http.ResponseWriter to capture status code
type responseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
	written    bool
}

// WriteHeader captures the status code
func (rw *responseWriterWrapper) WriteHeader(code int) {
	if !rw.written {
		rw.statusCode = code
		rw.written = true
		rw.ResponseWriter.WriteHeader(code)
	}
}

// Write marks that data was written
func (rw *responseWriterWrapper) Write(data []byte) (int, error) {
	if !rw.written {
		rw.written = true
	}
	return rw.ResponseWriter.Write(data)
}

// Hijack implements the http.Hijacker interface
func (rw *responseWriterWrapper) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := rw.ResponseWriter.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.ResponseWriter does not support hijacking")
}
