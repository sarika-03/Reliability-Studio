// services/slo_service.go - Enhanced error handling
package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

// SLOService handles SLO calculations and management
type SLOService struct {
	db     *sqlx.DB
	logger *zap.Logger
}

// NewSLOService creates a new SLOService instance
func NewSLOService(db *sql.DB, logger *zap.Logger) *SLOService {
	return &SLOService{
		db:     sqlx.NewDb(db, "postgres"),
		logger: logger,
	}
}

// SLO represents a local SLO type with all required fields
type SLO struct {
	ID              string     `db:"id"`
	Name            string     `db:"name"`
	Description     string     `db:"description"`
	Service         string     `db:"service"`
	Type            string     `db:"type"`
	Target          float64    `db:"target"`
	Window          int        `db:"window"`
	Current         *float64   `db:"current"`
	Status          string     `db:"status"`
	LastCalculated  *time.Time `db:"last_calculated"`
}

// SLOError represents a detailed SLO calculation error
type SLOError struct {
	Type        string   `json:"type"`
	Message     string   `json:"message"`
	Details     string   `json:"details,omitempty"`
	Suggestions []string `json:"suggestions,omitempty"`
}

// SLOAnalysis includes error information
type SLOAnalysis struct {
	SLOID        string     `json:"slo_id"`
	Value        *float64   `json:"value"` // Pointer to distinguish between 0 and null
	Target       float64    `json:"target"`
	ErrorBudget  *float64   `json:"error_budget,omitempty"`
	Status       string     `json:"status"`
	CalculatedAt time.Time  `json:"calculated_at"`
	Error        *SLOError  `json:"error,omitempty"`
	Service      string     `json:"service"`
	MetricType   string     `json:"metric_type"`
}

// GetSLO retrieves an SLO by ID
func (s *SLOService) GetSLO(ctx context.Context, sloID string) (*SLO, error) {
	query := `
		SELECT id, name, description, service, type, target, window, 
		       COALESCE(current_value, NULL) as current, status
		FROM slos
		WHERE id = $1
	`
	
	var slo SLO
	err := s.db.GetContext(ctx, &slo, query, sloID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("SLO not found: %s", sloID)
		}
		return nil, fmt.Errorf("failed to fetch SLO: %w", err)
	}
	
	return &slo, nil
}

// CalculateSLO with enhanced error handling
func (s *SLOService) CalculateSLO(ctx context.Context, sloID string) (*SLOAnalysis, error) {
	// Fetch SLO configuration
	slo, err := s.GetSLO(ctx, sloID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch SLO: %w", err)
	}

	analysis := &SLOAnalysis{
		SLOID:        sloID,
		Target:       slo.Target,
		Service:      slo.Service,
		MetricType:   slo.Type,
		CalculatedAt: time.Now(),
	}

	// Validate SLO configuration
	if err := s.validateSLOConfig(slo); err != nil {
		analysis.Status = "error"
		analysis.Error = &SLOError{
			Type:    "invalid_config",
			Message: "SLO configuration is invalid",
			Details: err.Error(),
			Suggestions: []string{
				"Check that the SLO target is between 0 and 100",
				"Verify the metric type is supported",
				"Ensure the time window is valid",
			},
		}
		return analysis, nil
	}

	// For now, return a placeholder analysis
	// TODO: Integrate with Prometheus for actual metric queries
	analysis.Status = "no_data"
	analysis.Error = &SLOError{
		Type:    "prometheus_not_configured",
		Message: "Prometheus integration not yet configured",
		Details: "SLO calculation requires Prometheus integration",
		Suggestions: []string{
			"Configure Prometheus connection in the backend",
			"Ensure Prometheus is running and accessible",
			"Verify metrics are being scraped for this service",
		},
	}

	// Save to database
	if err := s.saveSLOAnalysis(ctx, analysis); err != nil {
		// Log but don't fail the request
		fmt.Printf("Warning: failed to save SLO analysis: %v\n", err)
	}

	return analysis, nil
}

// validateSLOConfig ensures SLO configuration is valid
func (s *SLOService) validateSLOConfig(slo *SLO) error {
	if slo.Target < 0 || slo.Target > 100 {
		return fmt.Errorf("target must be between 0 and 100, got %.2f", slo.Target)
	}

	if slo.Service == "" {
		return fmt.Errorf("service name is required")
	}

	validTypes := map[string]bool{
		"availability": true,
		"latency":      true,
		"error_rate":   true,
	}

	if !validTypes[slo.Type] {
		return fmt.Errorf("invalid metric type '%s', must be one of: availability, latency, error_rate", slo.Type)
	}

	return nil
}

// categorizePrometheusError provides detailed error categorization
func categorizePrometheusError(err error, service string) *SLOError {
	errStr := err.Error()

	if contains(errStr, "connection refused") || contains(errStr, "timeout") {
		return &SLOError{
			Type:    "prometheus_unavailable",
			Message: "Cannot connect to Prometheus",
			Details: "Prometheus server is not responding or is unreachable.",
			Suggestions: []string{
				"Check if Prometheus is running",
				"Verify Prometheus URL configuration",
				"Check network connectivity to Prometheus",
				"Review Prometheus logs for errors",
			},
		}
	}

	if contains(errStr, "parse error") || contains(errStr, "bad_data") {
		return &SLOError{
			Type:    "invalid_query",
			Message: "Prometheus query syntax error",
			Details: errStr,
			Suggestions: []string{
				"Review the PromQL query syntax",
				"Test the query directly in Prometheus UI",
				"Check for typos in metric names or labels",
			},
		}
	}

	if contains(errStr, "not found") || contains(errStr, "unknown") {
		return &SLOError{
			Type:    "metric_not_found",
			Message: fmt.Sprintf("Metrics not found for service '%s'", service),
			Details: "The requested metric does not exist in Prometheus.",
			Suggestions: []string{
				fmt.Sprintf("Verify '%s' is exporting metrics", service),
				"Check metric name spelling and labels",
				"Ensure Prometheus scrape config includes this service",
				"Review Prometheus targets for scrape status",
			},
		}
	}

	return &SLOError{
		Type:    "query_failed",
		Message: "Prometheus query execution failed",
		Details: errStr,
		Suggestions: []string{
			"Check Prometheus server logs",
			"Verify query syntax and metric availability",
			"Ensure sufficient resources for query execution",
		},
	}
}

// buildPrometheusQuery creates the appropriate query based on SLO type
func (s *SLOService) buildPrometheusQuery(slo *SLO) (string, error) {
	timeWindow := fmt.Sprintf("%dm", slo.Window)
	if slo.Window <= 0 {
		timeWindow = "5m"
	}

	switch slo.Type {
	case "availability":
		return fmt.Sprintf(
			`(sum(rate(http_requests_total{service="%s",status_code!~"5.."}[%s])) / sum(rate(http_requests_total{service="%s"}[%s]))) * 100`,
			slo.Service, timeWindow, slo.Service, timeWindow,
		), nil

	case "latency":
		return fmt.Sprintf(
			`histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="%s"}[%s])) by (le)) * 1000`,
			slo.Service, timeWindow,
		), nil

	case "error_rate":
		return fmt.Sprintf(
			`(sum(rate(http_requests_total{service="%s",status_code=~"5.."}[%s])) / sum(rate(http_requests_total{service="%s"}[%s]))) * 100`,
			slo.Service, timeWindow, slo.Service, timeWindow,
		), nil

	default:
		return "", fmt.Errorf("unsupported SLO type: %s", slo.Type)
	}
}

// parseMetricValue extracts numeric value from Prometheus result
func parseMetricValue(result interface{}) (float64, error) {
	// Implementation depends on your Prometheus client library
	// This is a placeholder - adjust based on actual result format
	
	switch v := result.(type) {
	case float64:
		return v, nil
	case []interface{}:
		if len(v) > 0 {
			if val, ok := v[0].(float64); ok {
				return val, nil
			}
		}
		return 0, fmt.Errorf("empty result set")
	default:
		return 0, fmt.Errorf("unexpected result type: %T", result)
	}
}

// saveSLOAnalysis persists the analysis to database
func (s *SLOService) saveSLOAnalysis(ctx context.Context, analysis *SLOAnalysis) error {
	query := `
		INSERT INTO slo_history (slo_id, value, target, error_budget, status, calculated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	var value sql.NullFloat64
	if analysis.Value != nil {
		value = sql.NullFloat64{Float64: *analysis.Value, Valid: true}
	}

	var errorBudget sql.NullFloat64
	if analysis.ErrorBudget != nil {
		errorBudget = sql.NullFloat64{Float64: *analysis.ErrorBudget, Valid: true}
	}

	_, err := s.db.ExecContext(ctx, query,
		analysis.SLOID,
		value,
		analysis.Target,
		errorBudget,
		analysis.Status,
		analysis.CalculatedAt,
	)

	return err
}

// GetAllSLOs returns all SLOs with their latest status
func (s *SLOService) GetAllSLOs(ctx context.Context) ([]SLO, error) {
	query := `
		SELECT 
			s.id, s.name, s.description, s.service, s.type, s.target, s.window,
			h.value, h.status, h.calculated_at
		FROM slos s
		LEFT JOIN LATERAL (
			SELECT value, status, calculated_at
			FROM slo_history
			WHERE slo_id = s.id
			ORDER BY calculated_at DESC
			LIMIT 1
		) h ON true
		ORDER BY s.name
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query SLOs: %w", err)
	}
	defer rows.Close()

	var slos []SLO
	for rows.Next() {
		var slo SLO
		var value sql.NullFloat64
		var status sql.NullString
		var calculatedAt sql.NullTime

		err := rows.Scan(
			&slo.ID, &slo.Name, &slo.Description, &slo.Service,
			&slo.Type, &slo.Target, &slo.Window,
			&value, &status, &calculatedAt,
		)
		if err != nil {
			continue
		}

		if value.Valid {
			slo.Current = &value.Float64
		}
		if status.Valid {
			slo.Status = status.String
		} else {
			slo.Status = "no_data"
		}
		if calculatedAt.Valid {
			slo.LastCalculated = &calculatedAt.Time
		}

		slos = append(slos, slo)
	}

	return slos, nil
}

// CreateSLO creates a new SLO
func (s *SLOService) CreateSLO(ctx context.Context, slo *SLO) error {
	query := `
		INSERT INTO slos (id, name, description, service, type, target, window, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
	`
	
	if slo.ID == "" {
		slo.ID = fmt.Sprintf("slo_%d", time.Now().UnixNano())
	}
	
	_, err := s.db.ExecContext(ctx, query,
		slo.ID, slo.Name, slo.Description, slo.Service,
		slo.Type, slo.Target, slo.Window, slo.Status,
	)
	
	return err
}

// UpdateSLO updates an existing SLO
func (s *SLOService) UpdateSLO(ctx context.Context, slo *SLO) error {
	query := `
		UPDATE slos 
		SET name = $1, description = $2, service = $3, type = $4, target = $5, window = $6, status = $7, updated_at = NOW()
		WHERE id = $8
	`
	
	_, err := s.db.ExecContext(ctx, query,
		slo.Name, slo.Description, slo.Service, slo.Type, slo.Target, slo.Window, slo.Status, slo.ID,
	)
	
	return err
}

// CalculateAllSLOs calculates all SLOs
func (s *SLOService) CalculateAllSLOs(ctx context.Context) error {
	slos, err := s.GetAllSLOs(ctx)
	if err != nil {
		return err
	}
	
	for _, slo := range slos {
		_, err := s.CalculateSLO(ctx, slo.ID)
		if err != nil {
			s.logger.Error("Failed to calculate SLO", zap.String("slo_id", slo.ID), zap.Error(err))
		}
	}
	
	return nil
}

// DeleteSLO deletes an SLO
func (s *SLOService) DeleteSLO(ctx context.Context, sloID string) error {
	query := `DELETE FROM slos WHERE id = $1`
	_, err := s.db.ExecContext(ctx, query, sloID)
	return err
}

// GetSLOHistory retrieves the history of an SLO
func (s *SLOService) GetSLOHistory(ctx context.Context, sloID string) ([]SLOAnalysis, error) {
	query := `
		SELECT slo_id, value, target, error_budget, status, calculated_at
		FROM slo_history
		WHERE slo_id = $1
		ORDER BY calculated_at DESC
		LIMIT 100
	`
	
	rows, err := s.db.QueryContext(ctx, query, sloID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var history []SLOAnalysis
	for rows.Next() {
		var analysis SLOAnalysis
		var value, errorBudget sql.NullFloat64
		
		err := rows.Scan(&analysis.SLOID, &value, &analysis.Target, &errorBudget, &analysis.Status, &analysis.CalculatedAt)
		if err != nil {
			continue
		}
		
		if value.Valid {
			analysis.Value = &value.Float64
		}
		if errorBudget.Valid {
			analysis.ErrorBudget = &errorBudget.Float64
		}
		
		history = append(history, analysis)
	}
	
	return history, nil
}

// Helper function
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsMiddle(s, substr)))
}

func containsMiddle(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}