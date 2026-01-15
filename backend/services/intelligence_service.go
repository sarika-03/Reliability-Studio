package services

import (
	"context"
	"fmt"
	"time"
	"strings"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/sarika-03/Reliability-Studio/clients"
	"go.uber.org/zap"
)

// IntelligenceInsight represents an AI-generated insight for an incident
type IntelligenceInsight struct {
	ID              uuid.UUID              `json:"id" db:"id"`
	IncidentID      uuid.UUID              `json:"incident_id" db:"incident_id"`
	Summary         string                 `json:"summary" db:"summary"`
	RootCauseHint   string                 `json:"root_cause_hint" db:"root_cause_hint"`
	Confidence      float64                `json:"confidence" db:"confidence"`
	Evidence        map[string]interface{} `json:"evidence" db:"evidence"`
	SuggestedFixes  []string               `json:"suggested_fixes" db:"suggested_fixes"`
	CreatedAt       time.Time              `json:"created_at" db:"created_at"`
}

// IntelligenceService handles automated analysis and insights
type IntelligenceService struct {
	db         *sqlx.DB
	promClient *clients.PrometheusClient
	lokiClient *LokiClient
	logger     *zap.Logger
}

// NewIntelligenceService creates a new intelligence service
func NewIntelligenceService(db *sqlx.DB, prom *clients.PrometheusClient, loki *LokiClient, logger *zap.Logger) *IntelligenceService {
	return &IntelligenceService{
		db:         db,
		promClient: prom,
		lokiClient: loki,
		logger:     logger,
	}
}

// AnalyzeIncident performs automated RCA and generates insights
func (s *IntelligenceService) AnalyzeIncident(ctx context.Context, incidentID string) (*IntelligenceInsight, error) {
	s.logger.Info("Starting intelligence analysis", zap.String("incident_id", incidentID))

	// 1. Fetch incident details
	var incident struct {
		ID        uuid.UUID `db:"id"`
		Title     string    `db:"title"`
		ServiceID *uuid.UUID `db:"service_id"`
		StartedAt time.Time `db:"started_at"`
	}
	err := s.db.GetContext(ctx, &incident, "SELECT id, title, service_id, started_at FROM incidents WHERE id = $1", incidentID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch incident: %w", err)
	}

	// 2. Fetch service name if available
	serviceName := "unknown"
	if incident.ServiceID != nil {
		_ = s.db.GetContext(ctx, &serviceName, "SELECT name FROM services WHERE id = $1", incident.ServiceID)
	}

	// 3. Gather evidence (Logs & Metrics)
	duration := time.Since(incident.StartedAt)
	if duration < 5*time.Minute {
		duration = 5 * time.Minute
	}

	// Use existing Loki root cause analysis
	lokiRCA, err := s.lokiClient.FindRootCause(ctx, serviceName, duration)
	if err != nil {
		s.logger.Warn("Loki RCA failed", zap.Error(err))
		lokiRCA = "Log analysis unavailable"
	}

	// 4. Generate Insight
	insight := &IntelligenceInsight{
		ID:            uuid.New(),
		IncidentID:    incident.ID,
		Summary:       fmt.Sprintf("Intelligent analysis for incident in %s", serviceName),
		Confidence:    0.80,
		CreatedAt:     time.Now(),
		Evidence:      make(map[string]interface{}),
		SuggestedFixes: []string{},
	}

	insight.RootCauseHint = lokiRCA
	insight.Evidence["loki_rca"] = lokiRCA

	// Logic for suggested fixes based on RCA string
	rcaLower := strings.ToLower(lokiRCA)
	if strings.Contains(rcaLower, "memory") || strings.Contains(rcaLower, "oom") {
		insight.SuggestedFixes = append(insight.SuggestedFixes, "Increase memory limits", "Restart PODs to clear memory leak")
	} else if strings.Contains(rcaLower, "timeout") || strings.Contains(rcaLower, "connection") {
		insight.SuggestedFixes = append(insight.SuggestedFixes, "Check upstream service health", "Increase connection pool size")
	} else if strings.Contains(rcaLower, "database") {
		insight.SuggestedFixes = append(insight.SuggestedFixes, "Check DB locks", "Scaling database reader instances")
	}

	// Fallback/Generic fixes
	if len(insight.SuggestedFixes) == 0 {
		insight.SuggestedFixes = append(insight.SuggestedFixes, "Rollback last deployment", "Scale service pods (HPA)")
	}

	return insight, nil
}
