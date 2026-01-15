package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"github.com/gorilla/mux"
	"github.com/sarika-03/Reliability-Studio/services"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

var (
	intelligenceService *services.IntelligenceService
	remediationService  *services.RemediationService
	handlerLogger      *zap.Logger
)

// InitIntelligenceHandlers initializes handlers for intelligence and remediation
func InitIntelligenceHandlers(is *services.IntelligenceService, rs *services.RemediationService, logger *zap.Logger) {
	intelligenceService = is
	remediationService = rs
	handlerLogger = logger
}

// GetIncidentIntelligence returns automated insights for an incident
func GetIncidentIntelligence(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	insight, err := intelligenceService.AnalyzeIncident(r.Context(), incidentID)
	if err != nil {
		handlerLogger.Error("Failed to analyze incident", zap.String("id", incidentID), zap.Error(err))
		http.Error(w, "Failed to analyze incident", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(insight)
}

// ExecuteRemediationHandler triggers a remediation action
func ExecuteRemediationHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	var req struct {
		ActionType string `json:"action_type"`
		Target     string `json:"target"`
		Namespace  string `json:"namespace"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	incidentUUID, _ := uuid.Parse(incidentID)
	action := services.RemediationAction{
		ID:         uuid.New(),
		IncidentID: incidentUUID,
		ActionType: req.ActionType,
		Target:     req.Target,
		Namespace:  req.Namespace,
		ExecutedBy: "system-auto", // Or get from session
		CreatedAt:  time.Now(),
	}

	err := remediationService.ExecuteRemediation(r.Context(), action)
	if err != nil {
		handlerLogger.Error("Remediation failed", zap.Error(err))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted) // Still return 202 if accepted but failed execution
		json.NewEncoder(w).Encode(map[string]string{"status": "failed", "error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
