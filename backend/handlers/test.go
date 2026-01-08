package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/sarika-03/Reliability-Studio/clients"
	"github.com/sarika-03/Reliability-Studio/models"
	"github.com/sarika-03/Reliability-Studio/services"
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"
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
func HandleTestFail(w http.ResponseWriter, r *http.Request) {
	if testDeps == nil {
		http.Error(w, "Test endpoints not initialized", http.StatusInternalServerError)
		return
	}

	var req TestFailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	if req.ErrorRate < 0 || req.ErrorRate > 1 {
		http.Error(w, "error_rate must be between 0 and 1", http.StatusBadRequest)
		return
	}

	// Calculate number of errors
	totalRequests := int(math.Ceil(1.0 / req.ErrorRate * float64(req.DurationSeconds*10))) // Assume ~10 requests per second
	errorsGenerated := int(math.Ceil(float64(totalRequests) * req.ErrorRate))

	log.Printf("❌ Injecting failures: service=%s, error_rate=%.1f%%, errors=%d", req.Service, req.ErrorRate*100, errorsGenerated)

	// Push failed request metrics
	failureLabels := map[string]string{
		"service":     req.Service,
		"environment": "test",
		"status":      "500",
	}
	if err := testDeps.promClient.PushCounter(ctx, "http_requests_failed_total", float64(errorsGenerated), failureLabels); err != nil {
		log.Printf("⚠️  Failed to push failure metric to Prometheus: %v", err)
	}

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
		logEntry := map[string]interface{}{
			"timestamp": time.Now().UnixNano(),
			"message":   errorMsg,
			"level":     "error",
			"service":   req.Service,
			"trace_id":  uuid.New().String(),
		}

		if err := testDeps.lokiClient.PushLog(ctx, req.Service, "error", errorMsg, map[string]string{"service": req.Service}); err != nil {
			log.Printf("⚠️  Failed to push log to Loki: %v", err)
		}

		_ = logEntry // Silence unused warning
	}

	// Create incident if error_rate exceeds threshold
	if req.ErrorRate >= 0.25 {
		incident := models.CreateIncidentRequest{
			Title:       fmt.Sprintf("High error rate in %s (%d%% failures)", req.Service, int(req.ErrorRate*100)),
			Description: fmt.Sprintf("Test failure injection detected: %.1f%% error rate over %d seconds", req.ErrorRate*100, req.DurationSeconds),
			Severity:    "high",
			ServiceIDs:  []string{}, // Could query service ID from catalog
		}

		if testDeps.incidentService != nil {
			if _, err := testDeps.incidentService.Create(context.Background(), incident); err != nil {
				log.Printf("⚠️  Failed to create incident: %v", err)
			} else {
				log.Printf("🚨 Incident created: service=%s, error_rate=%.1f%%", req.Service, req.ErrorRate*100)
			}
		}
	}

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
