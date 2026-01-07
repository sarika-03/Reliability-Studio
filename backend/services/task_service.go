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

type TaskService struct {
	db     *sqlx.DB
	logger *zap.Logger
}

func NewTaskService(db *sql.DB, logger *zap.Logger) *TaskService {
	return &TaskService{
		db:     sqlx.NewDb(db, "postgres"),
		logger: logger,
	}
}

type CreateTaskRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	AssignedTo  *int   `json:"assigned_to,omitempty"`
	CreatedBy   *int   `json:"created_by,omitempty"`
}

type UpdateTaskRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Status      *string `json:"status,omitempty" validate:"omitempty,oneof=open in_progress done"`
	AssignedTo  *int    `json:"assigned_to,omitempty"`
}

// GetByIncidentID retrieves all tasks for an incident
func (s *TaskService) GetByIncidentID(ctx context.Context, incidentID string) ([]models.Task, error) {
	incidentUUID, err := uuid.Parse(incidentID)
	if err != nil {
		return nil, err
	}

	var tasks []models.Task
	query := `
        SELECT id, incident_id, title, description, status, 
               assigned_to, created_by, created_at, completed_at
        FROM incident_tasks
        WHERE incident_id = $1
        ORDER BY created_at ASC
    `
	err = s.db.SelectContext(ctx, &tasks, query, incidentUUID)
	if err != nil {
		s.logger.Error("Failed to get tasks", zap.Error(err))
		return nil, err
	}

	return tasks, nil
}

// Create creates a new task
func (s *TaskService) Create(ctx context.Context, incidentID string, req CreateTaskRequest) (*models.Task, error) {
	incidentUUID, err := uuid.Parse(incidentID)
	if err != nil {
		return nil, err
	}

	task := &models.Task{
		ID:          uuid.New(),
		IncidentID:  incidentUUID,
		Title:       req.Title,
		Description: req.Description,
		Status:      "open",
		AssignedTo:  req.AssignedTo,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   time.Now(),
	}

	query := `
        INSERT INTO incident_tasks (id, incident_id, title, description, status, 
                                   assigned_to, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
	_, err = s.db.ExecContext(ctx, query,
		task.ID, task.IncidentID, task.Title, task.Description,
		task.Status, task.AssignedTo, task.CreatedBy, task.CreatedAt,
	)
	if err != nil {
		s.logger.Error("Failed to create task", zap.Error(err))
		return nil, err
	}

	s.logger.Info("Created task",
		zap.String("id", task.ID.String()),
		zap.String("incident_id", incidentID))
	return task, nil
}

// Update updates a task
func (s *TaskService) Update(ctx context.Context, taskID string, req UpdateTaskRequest) (*models.Task, error) {
	taskUUID, err := uuid.Parse(taskID)
	if err != nil {
		return nil, err
	}

	updates := []string{}
	args := []interface{}{}
	argNum := 1

	if req.Title != nil {
		updates = append(updates, "title = $"+string(rune(argNum+'0')))
		args = append(args, *req.Title)
		argNum++
	}

	if req.Description != nil {
		updates = append(updates, "description = $"+string(rune(argNum+'0')))
		args = append(args, *req.Description)
		argNum++
	}

	if req.Status != nil {
		updates = append(updates, "status = $"+string(rune(argNum+'0')))
		args = append(args, *req.Status)
		argNum++

		// Auto-set completion time if marked as done
		if *req.Status == "done" {
			updates = append(updates, "completed_at = $"+string(rune(argNum+'0')))
			args = append(args, time.Now())
			argNum++
		}
	}

	if req.AssignedTo != nil {
		updates = append(updates, "assigned_to = $"+string(rune(argNum+'0')))
		args = append(args, *req.AssignedTo)
		argNum++
	}

	if len(updates) == 0 {
		return s.GetByID(ctx, taskID)
	}

	args = append(args, taskUUID)
	query := "UPDATE incident_tasks SET " + joinStrings(updates, ", ") + " WHERE id = $" + string(rune(argNum+'0'))

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		s.logger.Error("Failed to update task", zap.Error(err))
		return nil, err
	}

	return s.GetByID(ctx, taskID)
}

// GetByID retrieves a single task
func (s *TaskService) GetByID(ctx context.Context, taskID string) (*models.Task, error) {
	taskUUID, err := uuid.Parse(taskID)
	if err != nil {
		return nil, err
	}

	var task models.Task
	query := `
        SELECT id, incident_id, title, description, status,
               assigned_to, created_by, created_at, completed_at
        FROM incident_tasks
        WHERE id = $1
    `
	err = s.db.GetContext(ctx, &task, query, taskUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		s.logger.Error("Failed to get task", zap.Error(err))
		return nil, err
	}

	return &task, nil
}

// Delete deletes a task
func (s *TaskService) Delete(ctx context.Context, taskID string) error {
	taskUUID, err := uuid.Parse(taskID)
	if err != nil {
		return err
	}

	query := "DELETE FROM incident_tasks WHERE id = $1"
	_, err = s.db.ExecContext(ctx, query, taskUUID)
	if err != nil {
		s.logger.Error("Failed to delete task", zap.Error(err))
		return err
	}

	s.logger.Info("Deleted task", zap.String("id", taskID))
	return nil
}
