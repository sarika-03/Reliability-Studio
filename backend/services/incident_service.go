// Package services provides business logic for SLO, incidents, and other reliability features
package services

import (
	"context"
	"database/sql"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/sarikasharma2428-web/reliability-studio/models"
	"go.uber.org/zap"
	"time"
)

type IncidentService struct {
	db     *sqlx.DB
	logger *zap.Logger
}

func NewIncidentService(db *sql.DB, logger *zap.Logger) *IncidentService {
	return &IncidentService{
		db:     sqlx.NewDb(db, "postgres"),
		logger: logger,
	}
}

// GetIncidents retrieves incidents with optional filters
func (s *IncidentService) GetIncidents(ctx context.Context, status, severity string) ([]models.Incident, error) {
	query := `
        SELECT id, title, description, severity, status, commander_user_id,
               started_at, detected_at, mitigated_at, resolved_at, mttr_seconds,
               root_cause, created_at, updated_at
        FROM incidents
        WHERE 1=1
    `
	args := []interface{}{}
	argNum := 1

	if status != "" {
		query += " AND status = $" + string(rune(argNum+'0'))
		args = append(args, status)
		argNum++
	}

	if severity != "" {
		query += " AND severity = $" + string(rune(argNum+'0'))
		args = append(args, severity)
	}

	query += " ORDER BY started_at DESC"

	var incidents []models.Incident
	err := s.db.SelectContext(ctx, &incidents, query, args...)
	if err != nil {
		s.logger.Error("Failed to get incidents", zap.Error(err))
		return nil, err
	}

	// Load services for each incident
	for i := range incidents {
		services, err := s.getIncidentServices(ctx, incidents[i].ID)
		if err != nil {
			s.logger.Warn("Failed to load services for incident",
				zap.String("incident_id", incidents[i].ID.String()),
				zap.Error(err))
		}
		incidents[i].Services = services
	}

	return incidents, nil
}

// Create creates a new incident
func (s *IncidentService) Create(ctx context.Context, req models.CreateIncidentRequest) (*models.Incident, error) {
	incident := &models.Incident{
		ID:          uuid.New(),
		Title:       req.Title,
		Description: req.Description,
		Severity:    req.Severity,
		Status:      "open",
		StartedAt:   time.Now(),
		DetectedAt:  timePtr(time.Now()),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Insert incident
	query := `
        INSERT INTO incidents (id, title, description, severity, status, started_at, detected_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
	_, err = tx.ExecContext(ctx, query,
		incident.ID, incident.Title, incident.Description, incident.Severity,
		incident.Status, incident.StartedAt, incident.DetectedAt, incident.CreatedAt, incident.UpdatedAt,
	)
	if err != nil {
		s.logger.Error("Failed to create incident", zap.Error(err))
		return nil, err
	}

	// Link services
	for _, serviceID := range req.ServiceIDs {
		svcUUID, err := uuid.Parse(serviceID)
		if err != nil {
			s.logger.Warn("Invalid service ID", zap.String("service_id", serviceID))
			continue
		}

		_, err = tx.ExecContext(ctx, `
            INSERT INTO incident_services (incident_id, service_id, impact_level)
            VALUES ($1, $2, $3)
        `, incident.ID, svcUUID, "primary")
		if err != nil {
			s.logger.Warn("Failed to link service to incident", zap.Error(err))
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	s.logger.Info("Created incident", zap.String("id", incident.ID.String()))
	return incident, nil
}

// GetByID retrieves a single incident by ID
func (s *IncidentService) GetByID(ctx context.Context, id string) (*models.Incident, error) {
	incidentUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	var incident models.Incident
	query := `
        SELECT id, title, description, severity, status, commander_user_id,
               started_at, detected_at, mitigated_at, resolved_at, mttr_seconds,
               root_cause, created_at, updated_at
        FROM incidents
        WHERE id = $1
    `
	err = s.db.GetContext(ctx, &incident, query, incidentUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		s.logger.Error("Failed to get incident", zap.Error(err))
		return nil, err
	}

	// Load related data
	incident.Services, _ = s.getIncidentServices(ctx, incident.ID)
	incident.Timeline, _ = s.GetTimeline(ctx, id)

	return &incident, nil
}

// Update updates an incident
func (s *IncidentService) Update(ctx context.Context, id string, req models.UpdateIncidentRequest) (*models.Incident, error) {
	incidentUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	updates := []string{}
	args := []interface{}{}
	argNum := 1

	if req.Status != nil {
		updates = append(updates, "status = $"+string(rune(argNum+'0')))
		args = append(args, *req.Status)
		argNum++

		// Auto-set timestamps based on status
		if *req.Status == "mitigated" {
			updates = append(updates, "mitigated_at = $"+string(rune(argNum+'0')))
			args = append(args, time.Now())
			argNum++
		} else if *req.Status == "resolved" {
			updates = append(updates, "resolved_at = $"+string(rune(argNum+'0')))
			args = append(args, time.Now())
			argNum++
		}
	}

	if req.CommanderID != nil {
		updates = append(updates, "commander_user_id = $"+string(rune(argNum+'0')))
		args = append(args, *req.CommanderID)
		argNum++
	}

	if req.RootCause != nil {
		updates = append(updates, "root_cause = $"+string(rune(argNum+'0')))
		args = append(args, *req.RootCause)
		argNum++
	}

	updates = append(updates, "updated_at = $"+string(rune(argNum+'0')))
	args = append(args, time.Now())
	argNum++

	args = append(args, incidentUUID)

	query := "UPDATE incidents SET " + joinStrings(updates, ", ") + " WHERE id = $" + string(rune(argNum+'0'))

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		s.logger.Error("Failed to update incident", zap.Error(err))
		return nil, err
	}

	return s.GetByID(ctx, id)
}

// AddTimelineEvent adds an event to incident timeline
func (s *IncidentService) AddTimelineEvent(ctx context.Context, incidentID string, event models.TimelineEvent) error {
	incidentUUID, err := uuid.Parse(incidentID)
	if err != nil {
		return err
	}

	query := `
        INSERT INTO timeline_events (id, incident_id, event_type, timestamp, source, title, description, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
	_, err = s.db.ExecContext(ctx, query,
		uuid.New(), incidentUUID, event.Type, time.Now(), event.Source,
		event.Title, event.Description, event.Metadata, time.Now(),
	)

	if err != nil {
		s.logger.Error("Failed to add timeline event", zap.Error(err))
	}
	return err
}

// GetTimeline retrieves timeline events for an incident
func (s *IncidentService) GetTimeline(ctx context.Context, incidentID string) ([]models.TimelineEvent, error) {
	incidentUUID, err := uuid.Parse(incidentID)
	if err != nil {
		return nil, err
	}

	var events []models.TimelineEvent
	query := `
        SELECT id, incident_id, event_type, timestamp, source, title, description, metadata, created_at
        FROM timeline_events
        WHERE incident_id = $1
        ORDER BY timestamp ASC
    `
	err = s.db.SelectContext(ctx, &events, query, incidentUUID)
	if err != nil {
		s.logger.Error("Failed to get timeline", zap.Error(err))
		return nil, err
	}

	return events, nil
}

// Helper functions
func (s *IncidentService) getIncidentServices(ctx context.Context, incidentID uuid.UUID) ([]models.Service, error) {
	var services []models.Service
	query := `
        SELECT s.id, s.name, s.team, s.repository_url
        FROM services s
        INNER JOIN incident_services isc ON s.id = isc.service_id
        WHERE isc.incident_id = $1
    `
	err := s.db.SelectContext(ctx, &services, query, incidentID)
	return services, err
}

func timePtr(t time.Time) *time.Time {
	return &t
}

func joinStrings(arr []string, sep string) string {
	if len(arr) == 0 {
		return ""
	}
	result := arr[0]
	for i := 1; i < len(arr); i++ {
		result += sep + arr[i]
	}
	return result
}
