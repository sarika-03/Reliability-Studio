package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/sarika-03/Reliability-Studio/stability"
)

// HealthCheckHandler handles /api/health endpoint
func HandleHealthCheck(healthChecker *stability.HealthChecker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Perform health check with context from request
		health := healthChecker.Check(r.Context())

		// Set status code based on health
		statusCode := http.StatusOK
		if health.Status == stability.StatusDegraded {
			statusCode = http.StatusServiceUnavailable
		} else if health.Status == stability.StatusUnhealthy {
			statusCode = http.StatusServiceUnavailable
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(health)
	}
}

// HealthCheckResponse is returned by health endpoint
type HealthCheckResponse struct {
	Status     string                            `json:"status"`
	Timestamp  int64                             `json:"timestamp"`
	Components map[string]map[string]interface{} `json:"components"`
}
