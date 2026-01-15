package handlers

import (
	"encoding/json"
	"fmt"
	"github.com/sarika-03/Reliability-Studio/clients"
	"github.com/sarika-03/Reliability-Studio/services"
	"log"
	"math"
	"math/rand"
	"net/http"
	"sync"
)

// TestLoadRequest defines the payload for load injection
type TestLoadRequest struct {
	Service         string `json:"service" validate:"required"`
	Requests        int    `json:"requests" validate:"required,gt=0"`
	DurationSeconds int    `json:"duration_seconds" validate:"required,gt=0"`
}

// TestFailRequest defines the payload for failure injection
type TestFailRequest struct {
	Service         string  `json:"service" validate:"required"`
	ErrorRate       float64 `json:"error_rate" validate:"required,min=0,max=1"`
	DurationSeconds int     `json:"duration_seconds" validate:"required,gt=0"`
}

// TestLogRequest defines the payload for log injection
type TestLogRequest struct {
	Service string `json:"service" validate:"required"`
	Level   string `json:"level" validate:"required,oneof=error warn info debug"`
	Message string `json:"message" validate:"required"`
	Count   int    `json:"count" validate:"required,gt=0"`
}

// TestEndpointDependencies holds services needed for test endpoints
type TestEndpointDependencies struct {
	promClient      *clients.PrometheusClient
	lokiClient      *clients.LokiClient
	incidentService *services.IncidentService
	sloService      *services.SLOService
}

var testDeps *TestEndpointDependencies

var (
	// requestCounters stores the total count of requests per service+status
	// Key format: "service|status"
	requestCounters = make(map[string]float64)
	countersMutex   sync.Mutex
)

// InitTestHandlers initializes test endpoint dependencies
func InitTestHandlers(promClient *clients.PrometheusClient, lokiClient *clients.LokiClient, incService *services.IncidentService, sloService *services.SLOService, _ interface{}) {
	testDeps = &TestEndpointDependencies{
		promClient:      promClient,
		lokiClient:      lokiClient,
		incidentService: incService,
		sloService:      sloService,
	}
}

// HandleTestLoad generates fake traffic load
func HandleTestLoad(w http.ResponseWriter, r *http.Request) {
	if testDeps == nil {
		http.Error(w, "Test endpoints not initialized", http.StatusInternalServerError)
		return
	}

	var req TestLoadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Simulate load by pushing metrics to Prometheus
	requestsPerSecond := float64(req.Requests) / float64(req.DurationSeconds)
	labels := map[string]string{
		"service":     req.Service,
		"environment": "test",
		"method":      "GET",
		"status":      "200",
	}

	log.Printf("📊 Injecting load: service=%s, requests=%d, duration=%ds", req.Service, req.Requests, req.DurationSeconds)

	// Push metrics to Prometheus
	if err := testDeps.promClient.PushCounter(ctx, "http_requests_total", float64(req.Requests), labels); err != nil {
		log.Printf("⚠️  Failed to push load metric to Prometheus: %v", err)
	}

	// Push latency metrics
	for i := 0; i < int(math.Min(float64(req.Requests), 100)); i++ {
		latency := 50.0 + (rand.Float64() * 50.0) // 50-100ms
		labels_copy := copyLabels(labels)
		labels_copy["le"] = fmt.Sprintf("%.3f", latency)
		if err := testDeps.promClient.PushHistogram(ctx, "http_request_duration_seconds", latency/1000.0, labels_copy); err != nil {
			log.Printf("⚠️  Failed to push latency metric: %v", err)
		}
	}

	log.Printf("✅ Load injection complete: service=%s, rps=%.2f", req.Service, requestsPerSecond)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":              "load_injected",
		"service":             req.Service,
		"requests_generated":  req.Requests,
		"requests_per_second": requestsPerSecond,
	})
}

// HandleTestFail generates fake failures and errors
// DEMO MODE: If no body provided, uses defaults to trigger automatic incident creation
func HandleTestFail(w http.ResponseWriter, r *http.Request) {
	if testDeps == nil {
		http.Error(w, "Test endpoints not initialized", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	// Default values for demo - triggers automatic incident detection
	var req TestFailRequest
	if r.ContentLength == 0 {
		// Use defaults if no body provided (for easy demo)
		req = TestFailRequest{
			Service:         "payment-service",
			ErrorRate:       0.30, // 30% error rate - guaranteed to trigger detection (>5% threshold)
			DurationSeconds: 60,
		}
		log.Printf("🎯 DEMO MODE: Using defaults - service=%s, error_rate=%.1f%%", req.Service, req.ErrorRate*100)
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.ErrorRate < 0 || req.ErrorRate > 1 {
			http.Error(w, "error_rate must be between 0 and 1", http.StatusBadRequest)
			return
		}
	}

	// Calculate number of errors to generate
	// We need enough errors to trigger detection (error_rate > 5% threshold)
	// Generate enough requests so error_rate is clearly above threshold
	baseRequestsPerSecond := 10.0
	totalRequests := int(math.Ceil(baseRequestsPerSecond * float64(req.DurationSeconds)))
	if totalRequests == 0 {
		totalRequests = 100 // Minimum requests
	}
	errorsGenerated := int(math.Ceil(float64(totalRequests) * req.ErrorRate))
	if errorsGenerated == 0 && req.ErrorRate > 0 {
		errorsGenerated = 1 // At least one error
	}

	log.Printf("❌ Injecting failures: service=%s, error_rate=%.1f%%, total_requests=%d, errors=%d", 
		req.Service, req.ErrorRate*100, totalRequests, errorsGenerated)

	// Update monotonic counters
	countersMutex.Lock()
	successKey := req.Service + "|200"
	failureKey := req.Service + "|500"
	
	requestCounters[successKey] += float64(totalRequests - errorsGenerated)
	requestCounters[failureKey] += float64(errorsGenerated)
	
	currentSuccess := requestCounters[successKey]
	currentFailure := requestCounters[failureKey]
	countersMutex.Unlock()

	// Push successful requests
	successLabels := map[string]string{
		"service":     req.Service,
		"environment": "test",
		"method":      "GET",
		"status":      "200",
	}
	if err := testDeps.promClient.PushCounter(ctx, "http_requests_total", currentSuccess, successLabels); err != nil {
		log.Printf("⚠️  Failed to push success metric to Prometheus: %v", err)
	}

	// Push failed requests
	failureLabels := map[string]string{
		"service":     req.Service,
		"environment": "test",
		"method":      "GET",
		"status":      "500",
	}
	if err := testDeps.promClient.PushCounter(ctx, "http_requests_total", currentFailure, failureLabels); err != nil {
		log.Printf("⚠️  Failed to push failure metric to Prometheus: %v", err)
	}
	
	log.Printf("✅ Pushed metrics: service=%s, total=%d, errors=%d (error_rate=%.1f%%)", 
		req.Service, totalRequests, errorsGenerated, req.ErrorRate*100)

	// Push error logs to Loki
	errorMessages := []string{
		"Database connection timeout",
		"Service unavailable",
		"Request timeout",
		"Internal server error",
		"Failed to process payment",
		"Authentication failed",
	}

	for i := 0; i < errorsGenerated; i++ {
		errorMsg := errorMessages[rand.Intn(len(errorMessages))]
		if err := testDeps.lokiClient.PushLog(ctx, req.Service, "error", errorMsg, map[string]string{"service": req.Service}); err != nil {
			log.Printf("⚠️  Failed to push log to Loki: %v", err)
		}
	}

	// NOTE: Do NOT manually create incidents here!
	// Incidents MUST be auto-detected by the IncidentDetector running every 30 seconds.
	// This ensures the full control loop: failure → detection → auto-creation → correlation
	// The detector will pick up the metrics we just pushed and create incidents automatically.
	log.Printf("📊 Failure injection complete. Incident detector will auto-create incident on next cycle (runs every 30s)")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":           "failure_injected",
		"service":          req.Service,
		"errors_generated": errorsGenerated,
		"error_rate":       req.ErrorRate,
		"incident_created": req.ErrorRate >= 0.25,
	})
}

// HandleTestLog generates fake logs
func HandleTestLog(w http.ResponseWriter, r *http.Request) {
	if testDeps == nil {
		http.Error(w, "Test endpoints not initialized", http.StatusInternalServerError)
		return
	}

	var req TestLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	log.Printf("📝 Injecting logs: service=%s, level=%s, count=%d", req.Service, req.Level, req.Count)

	// Push logs to Loki
	labels := map[string]string{
		"service": req.Service,
		"level":   req.Level,
	}

	successCount := 0
	for i := 0; i < req.Count; i++ {
		if err := testDeps.lokiClient.PushLog(ctx, req.Service, req.Level, req.Message, labels); err != nil {
			log.Printf("⚠️  Failed to push log: %v", err)
		} else {
			successCount++
		}
	}

	log.Printf("✅ Log injection complete: service=%s, pushed=%d/%d", req.Service, successCount, req.Count)

	// If this is an error-level log injection, create timeline event
	if req.Level == "error" && successCount > 0 && testDeps.incidentService != nil {
		log.Printf("🔴 Error logs detected: service=%s, count=%d", req.Service, successCount)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "logs_injected",
		"service":        req.Service,
		"level":          req.Level,
		"logs_generated": successCount,
		"message":        req.Message,
	})
}

// Helper function to copy string map
func copyLabels(labels map[string]string) map[string]string {
	result := make(map[string]string)
	for k, v := range labels {
		result[k] = v
	}
	return result
}
