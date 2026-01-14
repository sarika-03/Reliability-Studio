package models

import (
	"encoding/json"
	"github.com/google/uuid"
	"time"
)

// Service represents a microservice in the catalog
type Service struct {
	ID               uuid.UUID `json:"id" db:"id"`
	Name             string    `json:"name" db:"name"`
	Description      string    `json:"description,omitempty" db:"description"`
	Team             string    `json:"team,omitempty" db:"team"`
	OnCallSchedule   string    `json:"on_call_schedule,omitempty" db:"on_call_schedule"`
	RepositoryURL    string    `json:"repository_url,omitempty" db:"repository_url"`
	DocumentationURL string    `json:"documentation_url,omitempty" db:"documentation_url"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// SLO represents a Service Level Objective
type SLO struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	ServiceID            uuid.UUID `json:"service_id" db:"service_id"`
	Name                 string    `json:"name" db:"name"`
	Objective            float64   `json:"objective" db:"objective"`
	WindowDays           int       `json:"window_days" db:"window_days"`
	ErrorBudgetRemaining float64   `json:"error_budget_remaining,omitempty" db:"error_budget_remaining"`
	Status               string    `json:"status,omitempty" db:"status"` // healthy, warning, critical
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// Incident represents a service incident
type Incident struct {
	ID              uuid.UUID          `json:"id" db:"id"`
	Title           string             `json:"title" db:"title"`
	Description     string             `json:"description" db:"description"`
	Severity        string             `json:"severity" db:"severity"` // critical, high, medium, low
	Status          string             `json:"status" db:"status"`     // open, investigating, mitigated, resolved
	CommanderID     *int               `json:"commander_id,omitempty" db:"commander_user_id"`
	StartedAt       time.Time          `json:"started_at" db:"started_at"`
	DetectedAt      *time.Time         `json:"detected_at,omitempty" db:"detected_at"`
	MitigatedAt     *time.Time         `json:"mitigated_at,omitempty" db:"mitigated_at"`
	ResolvedAt      *time.Time         `json:"resolved_at,omitempty" db:"resolved_at"`
	MTTRSeconds     *int               `json:"mttr_seconds,omitempty" db:"mttr_seconds"`
	RootCause       string             `json:"root_cause,omitempty" db:"root_cause"`
	Services        []Service          `json:"services,omitempty"`
	Timeline        []TimelineEvent    `json:"timeline,omitempty"`
	Tasks           []Task             `json:"tasks,omitempty"`
	Pods            []PodIncidentData  `json:"pods,omitempty"`
	Logs            []LogIncidentData  `json:"logs,omitempty"`
	Traces          []TraceIncidentData `json:"traces,omitempty"`
	RecoveryActions []RecoveryAction   `json:"recovery_actions,omitempty"`
	CreatedAt       time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at" db:"updated_at"`
}

// PodIncidentData represents pod data related to an incident
type PodIncidentData struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	IncidentID      uuid.UUID  `json:"incident_id" db:"incident_id"`
	PodName         string     `json:"pod_name" db:"pod_name"`
	Namespace       string     `json:"namespace" db:"namespace"`
	Status          string     `json:"status" db:"status"` // Running, CrashLoopBackOff, Failed, etc.
	Restarts        int        `json:"restarts" db:"restarts"`
	LastRestartTime *time.Time `json:"last_restart_time,omitempty" db:"last_restart_time"`
	ConfidenceScore float64    `json:"confidence_score" db:"confidence_score"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
}

// LogIncidentData represents log data related to an incident
type LogIncidentData struct {
	ID              uuid.UUID       `json:"id" db:"id"`
	IncidentID      uuid.UUID       `json:"incident_id" db:"incident_id"`
	Pattern         string          `json:"pattern" db:"pattern"` // e.g., "OutOfMemory", "connection timeout"
	Count           int             `json:"count" db:"count"`
	FirstSeen       time.Time       `json:"first_seen" db:"first_seen"`
	LastSeen        time.Time       `json:"last_seen" db:"last_seen"`
	SampleLogs      []string        `json:"sample_logs,omitempty"`
	ConfidenceScore float64         `json:"confidence_score" db:"confidence_score"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
}

// TraceIncidentData represents trace data related to an incident
type TraceIncidentData struct {
	ID              uuid.UUID `json:"id" db:"id"`
	IncidentID      uuid.UUID `json:"incident_id" db:"incident_id"`
	FailureCount    int       `json:"failure_count" db:"failure_count"`
	SuccessCount    int       `json:"success_count" db:"success_count"`
	ErrorRate       float64   `json:"error_rate" db:"error_rate"`
	AverageLatency  float64   `json:"average_latency" db:"average_latency"` // in milliseconds
	ConfidenceScore float64   `json:"confidence_score" db:"confidence_score"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// RecoveryAction represents a suggested or executed recovery action
type RecoveryAction struct {
	ID             uuid.UUID              `json:"id" db:"id"`
	IncidentID     uuid.UUID              `json:"incident_id" db:"incident_id"`
	Title          string                 `json:"title" db:"title"` // e.g., "Restart Pod", "Rollback Deployment"
	Description    string                 `json:"description" db:"description"`
	ActionType     string                 `json:"action_type" db:"action_type"` // restart_pod, rollback_deployment, scale_deployment, etc.
	Priority       string                 `json:"priority" db:"priority"`       // critical, high, medium, low
	Status         string                 `json:"status" db:"status"`           // suggested, approved, in_progress, completed, failed
	RootCauseMatch string                 `json:"root_cause_match" db:"root_cause_match"` // Why this action is suggested
	ConfidenceScore float64               `json:"confidence_score" db:"confidence_score"`
	Parameters     map[string]interface{} `json:"parameters,omitempty"`       // K8s action parameters
	ExecutedAt     *time.Time             `json:"executed_at,omitempty" db:"executed_at"`
	ExecutedBy     *string                `json:"executed_by,omitempty" db:"executed_by"`
	Result         string                 `json:"result,omitempty" db:"result"`         // success, failure message
	ApprovedAt     *time.Time             `json:"approved_at,omitempty" db:"approved_at"`
	ApprovedBy     *string                `json:"approved_by,omitempty" db:"approved_by"`
	CreatedAt      time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at" db:"updated_at"`
}

// TimelineEvent represents an event in an incident's timeline
type TimelineEvent struct {
	ID          uuid.UUID       `json:"id" db:"id"`
	IncidentID  uuid.UUID       `json:"incident_id" db:"incident_id"`
	Type        string          `json:"type" db:"event_type"` // alert, log_spike, pod_crash, metric_anomaly, user_action
	Timestamp   time.Time       `json:"timestamp" db:"timestamp"`
	Source      string          `json:"source,omitempty" db:"source"` // prometheus, loki, tempo, kubernetes, manual
	Title       string          `json:"title,omitempty" db:"title"`
	Description string          `json:"description,omitempty" db:"description"`
	Metadata    json.RawMessage `json:"metadata,omitempty" db:"metadata"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
}

// Task represents an action item during incident response
type Task struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	IncidentID  uuid.UUID  `json:"incident_id" db:"incident_id"`
	Title       string     `json:"title" db:"title"`
	Description string     `json:"description,omitempty" db:"description"`
	Status      string     `json:"status" db:"status"` // open, in_progress, done
	AssignedTo  *int       `json:"assigned_to,omitempty" db:"assigned_to"`
	CreatedBy   *int       `json:"created_by,omitempty" db:"created_by"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// Request/Response DTOs

type CreateIncidentRequest struct {
	Title       string   `json:"title" validate:"required"`
	Description string   `json:"description"`
	Severity    string   `json:"severity" validate:"required,oneof=critical high medium low"`
	ServiceIDs  []string `json:"service_ids"`
}

type UpdateIncidentRequest struct {
	Status      *string `json:"status,omitempty" validate:"omitempty,oneof=open investigating mitigated resolved"`
	CommanderID *int    `json:"commander_id,omitempty"`
	RootCause   *string `json:"root_cause,omitempty"`
}

// Impact represents the blast radius of an incident
type Impact struct {
	SLOAffected bool    `json:"slo_affected"`
	ErrorRate   float64 `json:"error_rate"`
	BadPods     int     `json:"bad_pods"`
}
