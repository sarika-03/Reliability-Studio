package services

import (
	"context"
	"fmt"
	"time"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

// RemediationAction represents an automated fix
type RemediationAction struct {
	ID          uuid.UUID `json:"id" db:"id"`
	IncidentID  uuid.UUID `json:"incident_id" db:"incident_id"`
	ActionType  string    `json:"action_type" db:"action_type"` // k8s_restart, k8s_scale, rollback
	Target      string    `json:"target" db:"target"`        // service/deployment name
	Namespace   string    `json:"namespace" db:"namespace"`
	Status      string    `json:"status" db:"status"`       // pending, success, failed
	Result      string    `json:"result" db:"result"`
	ExecutedBy  string    `json:"executed_by" db:"executed_by"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// RemediationService manages automated incident fixes
type RemediationService struct {
	db        *sqlx.DB
	k8sClient *K8sClient
	logger    *zap.Logger
}

// NewRemediationService creates a new remediation service
func NewRemediationService(db *sqlx.DB, k8s *K8sClient, logger *zap.Logger) *RemediationService {
	return &RemediationService{
		db:        db,
		k8sClient: k8s,
		logger:    logger,
	}
}

// ExecuteRemediation triggers a specific fix
func (s *RemediationService) ExecuteRemediation(ctx context.Context, action RemediationAction) error {
	s.logger.Info("Executing remediation", 
		zap.String("action", action.ActionType),
		zap.String("target", action.Target),
		zap.String("namespace", action.Namespace))

	var err error
	switch action.ActionType {
	case "k8s_restart":
		err = s.k8sClient.RestartDeployment(ctx, action.Namespace, action.Target)
	case "k8s_scale":
		// Example: scaling to 3 replicas for recovery
		err = s.k8sClient.ScaleDeployment(ctx, action.Namespace, action.Target, 3)
	default:
		return fmt.Errorf("unsupported action type: %s", action.ActionType)
	}

	status := "success"
	result := "Action executed successfully"
	if err != nil {
		status = "failed"
		result = err.Error()
		s.logger.Error("Remediation execution failed", zap.Error(err))
	}

	now := time.Now()
	_, dbErr := s.db.ExecContext(ctx, `
		INSERT INTO remediation_actions (id, incident_id, action_type, target, namespace, status, result, executed_by, created_at, completed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, action.ID, action.IncidentID, action.ActionType, action.Target, action.Namespace, status, result, action.ExecutedBy, action.CreatedAt, &now)

	if dbErr != nil {
		s.logger.Error("Failed to log remediation action", zap.Error(dbErr))
	}

	return err
}
