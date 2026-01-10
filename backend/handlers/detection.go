package handlers

import (
	"encoding/json"
	"github.com/sarika-03/Reliability-Studio/detection"
	"net/http"
)

var detectionService *detection.IncidentDetector

// InitDetectionHandlers initializes detection-related handlers
func InitDetectionHandlers(detector *detection.IncidentDetector) {
	detectionService = detector
}

// GetDetectionRules returns all active detection alerts
func GetDetectionRules(w http.ResponseWriter, r *http.Request) {
	if detectionService == nil {
		http.Error(w, "Detection service not initialized", http.StatusServiceUnavailable)
		return
	}

	activeAlerts := detectionService.GetActiveAlerts()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"active_alerts": activeAlerts,
		"count":         len(activeAlerts),
	})
}

// GetDetectionStatus returns current detection system status
func GetDetectionStatus(w http.ResponseWriter, r *http.Request) {
	if detectionService == nil {
		http.Error(w, "Detection service not initialized", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "running",
		"alerts": detectionService.GetActiveAlerts(),
	})
}
