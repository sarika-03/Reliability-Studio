package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sarika-03/Reliability-Studio/models"
	"github.com/sarika-03/Reliability-Studio/services"
	"go.uber.org/zap"
)

var (
	recoveryActionService *services.RecoveryActionService
	recoveryIncidentService *services.IncidentService // Local alias to avoid conflict if handlers.incidentService is used
	recoveryLogger        *zap.Logger
)

// InitRecoveryActionHandlers initializes recovery action handlers
func InitRecoveryActionHandlers(ras *services.RecoveryActionService, is *services.IncidentService, log *zap.Logger) {
	recoveryActionService = ras
	recoveryIncidentService = is
	recoveryLogger = log
}

// GetRecoveryActions returns all recovery actions for an incident
func GetRecoveryActions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	if recoveryActionService == nil {
		http.Error(w, "Recovery action service not initialized", http.StatusServiceUnavailable)
		return
	}

	actions, err := recoveryActionService.GetRecoveryActions(r.Context(), incidentID)
	if err != nil {
		recoveryLogger.Error("Failed to get recovery actions", zap.Error(err))
		http.Error(w, "Failed to retrieve recovery actions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"incident_id": incidentID,
		"actions":     actions,
		"count":       len(actions),
	})
}

// SuggestRecoveryActions generates intelligent recovery action suggestions
func SuggestRecoveryActions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	if recoveryActionService == nil || recoveryIncidentService == nil {
		http.Error(w, "Recovery action service not initialized", http.StatusServiceUnavailable)
		return
	}

	// Get incident to determine root cause
	incident, err := recoveryIncidentService.GetByID(r.Context(), incidentID)
	if err != nil || incident == nil {
		http.Error(w, "Incident not found", http.StatusNotFound)
		return
	}

	// Determine root cause type from incident details
	rootCauseType := determineRootCauseType(incident)

	// Generate recovery action suggestions
	actions, err := recoveryActionService.SuggestRecoveryActions(r.Context(), incidentID, rootCauseType)
	if err != nil {
		recoveryLogger.Error("Failed to suggest recovery actions", zap.Error(err))
		http.Error(w, "Failed to generate recovery actions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"incident_id": incidentID,
		"root_cause_type": rootCauseType,
		"actions": actions,
		"count": len(actions),
	})
}

// ApproveRecoveryAction marks a recovery action as approved
func ApproveRecoveryAction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	actionID := vars["action_id"]

	if recoveryActionService == nil {
		http.Error(w, "Recovery action service not initialized", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		ApprovedBy string `json:"approved_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := recoveryActionService.ApproveRecoveryAction(r.Context(), actionID, req.ApprovedBy)
	if err != nil {
		recoveryLogger.Error("Failed to approve recovery action", zap.Error(err))
		http.Error(w, "Failed to approve action", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"action_id": actionID,
		"status": "approved",
		"message": "Recovery action approved",
	})
}

// ExecuteRecoveryAction executes an approved recovery action
func ExecuteRecoveryAction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	actionID := vars["action_id"]

	if recoveryActionService == nil {
		http.Error(w, "Recovery action service not initialized", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		ExecutedBy string `json:"executed_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := recoveryActionService.ExecuteRecoveryAction(r.Context(), actionID, req.ExecutedBy)
	if err != nil {
		recoveryLogger.Error("Failed to execute recovery action", zap.Error(err))
		http.Error(w, "Failed to execute action: " + err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"action_id": actionID,
		"status": "completed",
		"message": "Recovery action executed successfully",
	})
}

// determineRootCauseType determines root cause type from incident data
func determineRootCauseType(incident *models.Incident) string {
	// Check pods
	if len(incident.Pods) > 0 {
		for _, pod := range incident.Pods {
			if pod.Status != "Running" {
				return "pod_crash"
			}
			if pod.Restarts > 5 {
				return "pod_unhealthy"
			}
		}
	}

	// Check logs
	if len(incident.Logs) > 0 {
		for _, log := range incident.Logs {
			if contains(log.Pattern, "OutOfMemory", "MemoryLeak") {
				return "memory_leak"
			}
			if contains(log.Pattern, "error", "exception", "panic") {
				return "application_error"
			}
		}
	}

	// Check traces
	if len(incident.Traces) > 0 && incident.Traces[0].ErrorRate > 0.1 {
		return "high_error_rate"
	}

	// Check severity as fallback
	switch incident.Severity {
	case "critical":
		return "critical_issue"
	case "high":
		return "metric_anomaly"
	case "medium":
		return "degradation"
	default:
		return "unknown"
	}
}

// contains checks if string contains any of the given substrings
func contains(s string, substrs ...string) bool {
	for _, substr := range substrs {
		if len(s) > 0 && len(substr) > 0 && len(s) >= len(substr) {
			// Simple substring check
			for i := 0; i <= len(s)-len(substr); i++ {
				if s[i:i+len(substr)] == substr {
					return true
				}
			}
		}
	}
	return false
}
