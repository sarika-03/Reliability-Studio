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
	ID          uuid.UUID       `json:"id" db:"id"`
	Title       string          `json:"title" db:"title"`
	Description string          `json:"description" db:"description"`
	Severity    string          `json:"severity" db:"severity"` // critical, high, medium, low
	Status      string          `json:"status" db:"status"`     // open, investigating, mitigated, resolved
	CommanderID *int            `json:"commander_id,omitempty" db:"commander_user_id"`
	StartedAt   time.Time       `json:"started_at" db:"started_at"`
	DetectedAt  *time.Time      `json:"detected_at,omitempty" db:"detected_at"`
	MitigatedAt *time.Time      `json:"mitigated_at,omitempty" db:"mitigated_at"`
	ResolvedAt  *time.Time      `json:"resolved_at,omitempty" db:"resolved_at"`
	MTTRSeconds *int            `json:"mttr_seconds,omitempty" db:"mttr_seconds"`
	RootCause   string          `json:"root_cause,omitempty" db:"root_cause"`
	Services    []Service       `json:"services,omitempty"`
	Timeline    []TimelineEvent `json:"timeline,omitempty"`
	Tasks       []Task          `json:"tasks,omitempty"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
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
