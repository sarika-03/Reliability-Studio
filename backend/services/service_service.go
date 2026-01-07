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

type ServiceService struct {
	db     *sqlx.DB
	logger *zap.Logger
}

func NewServiceService(db *sql.DB, logger *zap.Logger) *ServiceService {
	return &ServiceService{
		db:     sqlx.NewDb(db, "postgres"),
		logger: logger,
	}
}

type CreateServiceRequest struct {
	Name             string `json:"name" validate:"required"`
	Description      string `json:"description"`
	Team             string `json:"team"`
	OnCallSchedule   string `json:"on_call_schedule"`
	RepositoryURL    string `json:"repository_url"`
	DocumentationURL string `json:"documentation_url"`
}

type UpdateServiceRequest struct {
	Description      *string `json:"description,omitempty"`
	Team             *string `json:"team,omitempty"`
	OnCallSchedule   *string `json:"on_call_schedule,omitempty"`
	RepositoryURL    *string `json:"repository_url,omitempty"`
	DocumentationURL *string `json:"documentation_url,omitempty"`
}

// GetAll retrieves all services
func (s *ServiceService) GetAll(ctx context.Context) ([]models.Service, error) {
	var services []models.Service
	query := `
        SELECT id, name, description, team, on_call_schedule, 
               repository_url, documentation_url, created_at, updated_at
        FROM services
        ORDER BY name ASC
    `
	err := s.db.SelectContext(ctx, &services, query)
	if err != nil {
		s.logger.Error("Failed to get services", zap.Error(err))
		return nil, err
	}
	return services, nil
}

// Create creates a new service
func (s *ServiceService) Create(ctx context.Context, req CreateServiceRequest) (*models.Service, error) {
	service := &models.Service{
		ID:               uuid.New(),
		Name:             req.Name,
		Description:      req.Description,
		Team:             req.Team,
		OnCallSchedule:   req.OnCallSchedule,
		RepositoryURL:    req.RepositoryURL,
		DocumentationURL: req.DocumentationURL,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	query := `
        INSERT INTO services (id, name, description, team, on_call_schedule, 
                            repository_url, documentation_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
	_, err := s.db.ExecContext(ctx, query,
		service.ID, service.Name, service.Description, service.Team,
		service.OnCallSchedule, service.RepositoryURL, service.DocumentationURL,
		service.CreatedAt, service.UpdatedAt,
	)
	if err != nil {
		s.logger.Error("Failed to create service", zap.Error(err))
		return nil, err
	}

	s.logger.Info("Created service", zap.String("id", service.ID.String()), zap.String("name", service.Name))
	return service, nil
}

// GetByID retrieves a single service by ID
func (s *ServiceService) GetByID(ctx context.Context, id string) (*models.Service, error) {
	serviceUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	var service models.Service
	query := `
        SELECT id, name, description, team, on_call_schedule,
               repository_url, documentation_url, created_at, updated_at
        FROM services
        WHERE id = $1
    `
	err = s.db.GetContext(ctx, &service, query, serviceUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		s.logger.Error("Failed to get service", zap.Error(err))
		return nil, err
	}

	return &service, nil
}

// Update updates a service
func (s *ServiceService) Update(ctx context.Context, id string, req UpdateServiceRequest) (*models.Service, error) {
	serviceUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	updates := []string{}
	args := []interface{}{}
	argNum := 1

	if req.Description != nil {
		updates = append(updates, "description = $"+string(rune(argNum+'0')))
		args = append(args, *req.Description)
		argNum++
	}

	if req.Team != nil {
		updates = append(updates, "team = $"+string(rune(argNum+'0')))
		args = append(args, *req.Team)
		argNum++
	}

	if req.OnCallSchedule != nil {
		updates = append(updates, "on_call_schedule = $"+string(rune(argNum+'0')))
		args = append(args, *req.OnCallSchedule)
		argNum++
	}

	if req.RepositoryURL != nil {
		updates = append(updates, "repository_url = $"+string(rune(argNum+'0')))
		args = append(args, *req.RepositoryURL)
		argNum++
	}

	if req.DocumentationURL != nil {
		updates = append(updates, "documentation_url = $"+string(rune(argNum+'0')))
		args = append(args, *req.DocumentationURL)
		argNum++
	}

	if len(updates) == 0 {
		return s.GetByID(ctx, id)
	}

	updates = append(updates, "updated_at = $"+string(rune(argNum+'0')))
	args = append(args, time.Now())
	argNum++

	args = append(args, serviceUUID)

	query := "UPDATE services SET " + joinStrings(updates, ", ") + " WHERE id = $" + string(rune(argNum+'0'))

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		s.logger.Error("Failed to update service", zap.Error(err))
		return nil, err
	}

	return s.GetByID(ctx, id)
}

// GetIncidents retrieves incidents for a service
func (s *ServiceService) GetIncidents(ctx context.Context, serviceID string) ([]models.Incident, error) {
	serviceUUID, err := uuid.Parse(serviceID)
	if err != nil {
		return nil, err
	}

	var incidents []models.Incident
	query := `
        SELECT i.id, i.title, i.description, i.severity, i.status,
               i.started_at, i.detected_at, i.mitigated_at, i.resolved_at,
               i.mttr_seconds, i.root_cause, i.created_at, i.updated_at
        FROM incidents i
        INNER JOIN incident_services isc ON i.id = isc.incident_id
        WHERE isc.service_id = $1
        ORDER BY i.started_at DESC
    `
	err = s.db.SelectContext(ctx, &incidents, query, serviceUUID)
	if err != nil {
		s.logger.Error("Failed to get service incidents", zap.Error(err))
		return nil, err
	}

	return incidents, nil
}
