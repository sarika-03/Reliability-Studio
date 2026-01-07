// Package services provides business logic for SLO, incidents, and other reliability features
package services

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/sarikasharma2428-web/reliability-studio/clients"
	"strings"
	"time"
)

type SLOService struct {
	db         *sql.DB
	promClient PrometheusQueryClient
}

type PrometheusQueryClient interface {
	Query(ctx context.Context, query string, timestamp time.Time) (*clients.PrometheusResponse, error)
	QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*clients.PrometheusResponse, error)
}

type SLO struct {
	ID                   string    `json:"id"`
	ServiceID            string    `json:"service_id"`
	ServiceName          string    `json:"service_name"`
	Name                 string    `json:"name"`
	Description          string    `json:"description"`
	TargetPercentage     float64   `json:"target_percentage"`
	WindowDays           int       `json:"window_days"`
	SLIType              string    `json:"sli_type"`
	Query                string    `json:"query"`
	CurrentPercentage    float64   `json:"current_percentage"`
	ErrorBudgetRemaining float64   `json:"error_budget_remaining"`
	Status               string    `json:"status"`
	LastCalculatedAt     time.Time `json:"last_calculated_at"`
	CreatedAt            time.Time `json:"created_at"`
}

type SLOBurnRate struct {
	WindowSize string  `json:"window"`
	BurnRate   float64 `json:"burn_rate"`
	Threshold  float64 `json:"threshold"`
	Breached   bool    `json:"breached"`
}

// NewSLOService creates a new SLO service
func NewSLOService(db *sql.DB, promClient PrometheusQueryClient) *SLOService {
	return &SLOService{
		db:         db,
		promClient: promClient,
	}
}

// CalculateSLO calculates current SLO compliance
func (s *SLOService) CalculateSLO(ctx context.Context, sloID string) (*SLO, error) {
	// Get SLO configuration
	slo, err := s.GetSLO(ctx, sloID)
	if err != nil {
		return nil, fmt.Errorf("failed to get SLO: %w", err)
	}

	// Calculate time window
	end := time.Now()

	// FIXED: Replace ${WINDOW} placeholder with the SLO window (e.g. 30d)
	// This ensures the query respects the WindowDays set in the database.
	window := fmt.Sprintf("%dd", slo.WindowDays)
	query := strings.ReplaceAll(slo.Query, "${WINDOW}", window)

	// Execute Prometheus query
	result, err := s.promClient.Query(ctx, query, end)
	if err != nil {
		return nil, fmt.Errorf("failed to execute SLO query: %w", err)
	}

	// Parse result
	if len(result.Data.Result) == 0 {
		return nil, fmt.Errorf("no data returned from SLO query")
	}

	valueStr, ok := result.Data.Result[0].Value[1].(string)
	if !ok {
		return nil, fmt.Errorf("invalid value type in result")
	}

	var currentPercentage float64
	if _, err := fmt.Sscanf(valueStr, "%f", &currentPercentage); err != nil {
		return nil, fmt.Errorf("failed to parse SLO value: %w", err)
	}

	// Calculate error budget - FIXED: Robust calculation with overspend tracking
	errorBudgetAllowed := 100.0 - slo.TargetPercentage
	errorsObserved := 100.0 - currentPercentage

	var errorBudgetRemaining float64
	if errorBudgetAllowed <= 0 {
		errorBudgetRemaining = 0 // Target is 100%, no room for error
	} else {
		// Can be negative if overspent (e.g. -400% for 99.5% vs 99.9% target)
		errorBudgetRemaining = ((errorBudgetAllowed - errorsObserved) / errorBudgetAllowed) * 100
	}

	// Determine status based on remaining budget
	status := "healthy"
	if errorBudgetRemaining < 25 {
		status = "critical"
	} else if errorBudgetRemaining < 50 {
		status = "warning"
	}

	// Update SLO in database
	_, err = s.db.ExecContext(ctx, `
		UPDATE slos 
		SET current_percentage = $1,
		    error_budget_remaining = $2,
		    status = $3,
		    last_calculated_at = $4,
		    updated_at = $4
		WHERE id = $5
	`, currentPercentage, errorBudgetRemaining, status, time.Now(), sloID)

	if err != nil {
		return nil, fmt.Errorf("failed to update SLO: %w", err)
	}

	// Return updated SLO
	slo.CurrentPercentage = currentPercentage
	slo.ErrorBudgetRemaining = errorBudgetRemaining
	slo.Status = status
	slo.LastCalculatedAt = time.Now()

	return slo, nil
}

// CalculateAllSLOs calculates all SLOs for all services
func (s *SLOService) CalculateAllSLOs(ctx context.Context) error {
	// Get all SLOs
	rows, err := s.db.QueryContext(ctx, `
		SELECT id FROM slos WHERE status != 'disabled'
	`)
	if err != nil {
		return fmt.Errorf("failed to query SLOs: %w", err)
	}
	defer rows.Close()

	var sloIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		sloIDs = append(sloIDs, id)
	}

	// Calculate each SLO
	for _, id := range sloIDs {
		if _, err := s.CalculateSLO(ctx, id); err != nil {
			fmt.Printf("Error calculating SLO %s: %v\n", id, err)
		}
	}

	return nil
}

// GetSLOHistory returns historical compliance data for an SLO
func (s *SLOService) GetSLOHistory(ctx context.Context, sloID string) ([]map[string]interface{}, error) {
	slo, err := s.GetSLO(ctx, sloID)
	if err != nil {
		return nil, err
	}

	end := time.Now()
	start := end.Add(-24 * time.Hour)
	step := 15 * time.Minute

	result, err := s.promClient.QueryRange(ctx, slo.Query, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query history: %w", err)
	}

	history := make([]map[string]interface{}, 0)
	if len(result.Data.Result) > 0 {
		for _, v := range result.Data.Result[0].Values {
			if len(v) < 2 {
				continue
			}
			ts := v[0].(float64)
			valStr := v[1].(string)
			var val float64
			fmt.Sscanf(valStr, "%f", &val)

			history = append(history, map[string]interface{}{
				"timestamp": time.Unix(int64(ts), 0),
				"value":     val,
			})
		}
	}

	return history, nil
}

// GetSLO retrieves an SLO by ID
func (s *SLOService) GetSLO(ctx context.Context, sloID string) (*SLO, error) {
	var slo SLO

	query := `
		SELECT s.id, s.service_id, sv.name as service_name, s.name, s.description,
		       s.target_percentage, s.window_days, s.sli_type, s.query,
		       s.current_percentage, s.error_budget_remaining, s.status,
		       s.last_calculated_at, s.created_at
		FROM slos s
		JOIN services sv ON s.service_id = sv.id
		WHERE s.id = $1
	`

	err := s.db.QueryRowContext(ctx, query, sloID).Scan(
		&slo.ID, &slo.ServiceID, &slo.ServiceName, &slo.Name, &slo.Description,
		&slo.TargetPercentage, &slo.WindowDays, &slo.SLIType, &slo.Query,
		&slo.CurrentPercentage, &slo.ErrorBudgetRemaining, &slo.Status,
		&slo.LastCalculatedAt, &slo.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("SLO not found")
	} else if err != nil {
		return nil, fmt.Errorf("failed to query SLO: %w", err)
	}

	return &slo, nil
}

// GetSLOsByService retrieves all SLOs for a service
func (s *SLOService) GetSLOsByService(ctx context.Context, serviceID string) ([]SLO, error) {
	query := `
		SELECT s.id, s.service_id, sv.name as service_name, s.name, s.description,
		       s.target_percentage, s.window_days, s.sli_type, s.query,
		       s.current_percentage, s.error_budget_remaining, s.status,
		       s.last_calculated_at, s.created_at
		FROM slos s
		JOIN services sv ON s.service_id = sv.id
		WHERE s.service_id = $1
		ORDER BY s.status DESC, s.name
	`

	rows, err := s.db.QueryContext(ctx, query, serviceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query SLOs: %w", err)
	}
	defer rows.Close()

	var slos []SLO
	for rows.Next() {
		var slo SLO
		err := rows.Scan(
			&slo.ID, &slo.ServiceID, &slo.ServiceName, &slo.Name, &slo.Description,
			&slo.TargetPercentage, &slo.WindowDays, &slo.SLIType, &slo.Query,
			&slo.CurrentPercentage, &slo.ErrorBudgetRemaining, &slo.Status,
			&slo.LastCalculatedAt, &slo.CreatedAt,
		)
		if err != nil {
			continue
		}
		slos = append(slos, slo)
	}

	return slos, nil
}

// GetAllSLOs retrieves all SLOs
func (s *SLOService) GetAllSLOs(ctx context.Context) ([]SLO, error) {
	query := `
		SELECT s.id, s.service_id, sv.name as service_name, s.name, s.description,
		       s.target_percentage, s.window_days, s.sli_type, s.query,
		       COALESCE(s.current_percentage, 0), COALESCE(s.error_budget_remaining, 100), 
		       s.status, s.last_calculated_at, s.created_at
		FROM slos s
		JOIN services sv ON s.service_id = sv.id
		ORDER BY s.status DESC, sv.name, s.name
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query SLOs: %w", err)
	}
	defer rows.Close()

	var slos []SLO
	for rows.Next() {
		var slo SLO
		err := rows.Scan(
			&slo.ID, &slo.ServiceID, &slo.ServiceName, &slo.Name, &slo.Description,
			&slo.TargetPercentage, &slo.WindowDays, &slo.SLIType, &slo.Query,
			&slo.CurrentPercentage, &slo.ErrorBudgetRemaining, &slo.Status,
			&slo.LastCalculatedAt, &slo.CreatedAt,
		)
		if err != nil {
			continue
		}
		slos = append(slos, slo)
	}

	return slos, nil
}

// CalculateBurnRate calculates error budget burn rate
func (s *SLOService) CalculateBurnRate(ctx context.Context, sloID string) ([]SLOBurnRate, error) {
	slo, err := s.GetSLO(ctx, sloID)
	if err != nil {
		return nil, err
	}

	windows := []struct {
		name      string
		duration  time.Duration
		threshold float64
	}{
		{"1h", time.Hour, 14.4},      // 1 hour window
		{"6h", 6 * time.Hour, 6.0},   // 6 hour window
		{"24h", 24 * time.Hour, 3.0}, // 1 day window
		{"3d", 72 * time.Hour, 1.0},  // 3 day window
	}

	var burnRates []SLOBurnRate
	end := time.Now()

	for _, window := range windows {
		_ = end.Add(-window.duration) // start variable unused

		// Query error budget consumption rate
		query := fmt.Sprintf(`
			(1 - (%s)) / (1 - (%f / 100))
		`, slo.Query, slo.TargetPercentage)

		result, err := s.promClient.Query(ctx, query, end)
		if err != nil {
			continue
		}

		if len(result.Data.Result) == 0 {
			continue
		}

		valueStr, ok := result.Data.Result[0].Value[1].(string)
		if !ok {
			continue
		}

		var burnRate float64
		if _, err := fmt.Sscanf(valueStr, "%f", &burnRate); err != nil {
			continue
		}

		burnRates = append(burnRates, SLOBurnRate{
			WindowSize: window.name,
			BurnRate:   burnRate,
			Threshold:  window.threshold,
			Breached:   burnRate > window.threshold,
		})
	}

	return burnRates, nil
}

// CreateSLO creates a new SLO
func (s *SLOService) CreateSLO(ctx context.Context, slo *SLO) error {
	query := `
		INSERT INTO slos (service_id, name, description, target_percentage, window_days, sli_type, query, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'healthy')
		RETURNING id, created_at
	`

	err := s.db.QueryRowContext(ctx, query,
		slo.ServiceID, slo.Name, slo.Description, slo.TargetPercentage,
		slo.WindowDays, slo.SLIType, slo.Query,
	).Scan(&slo.ID, &slo.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create SLO: %w", err)
	}

	// Calculate initial values
	_, _ = s.CalculateSLO(ctx, slo.ID)

	return nil
}

// UpdateSLO updates an existing SLO
func (s *SLOService) UpdateSLO(ctx context.Context, slo *SLO) error {
	query := `
		UPDATE slos
		SET name = $1, description = $2, target_percentage = $3, 
		    window_days = $4, sli_type = $5, query = $6, updated_at = NOW()
		WHERE id = $7
	`

	result, err := s.db.ExecContext(ctx, query,
		slo.Name, slo.Description, slo.TargetPercentage,
		slo.WindowDays, slo.SLIType, slo.Query, slo.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update SLO: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("SLO not found")
	}

	// Recalculate after update
	_, _ = s.CalculateSLO(ctx, slo.ID)

	return nil
}

// DeleteSLO deletes an SLO
func (s *SLOService) DeleteSLO(ctx context.Context, sloID string) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM slos WHERE id = $1", sloID)
	if err != nil {
		return fmt.Errorf("failed to delete SLO: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("SLO not found")
	}

	return nil
}
