package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type TimelineService struct {
	db *sql.DB
}

type TimelineEvent struct {
	ID          string                 `json:"id"`
	IncidentID  string                 `json:"incident_id"`
	EventType   string                 `json:"event_type"`
	Source      string                 `json:"source"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Severity    string                 `json:"severity"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedBy   string                 `json:"created_by"`
	CreatedAt   time.Time              `json:"created_at"`
}

// NewTimelineService creates a new timeline service
func NewTimelineService(db *sql.DB) *TimelineService {
	return &TimelineService{db: db}
}

// AddEvent adds a new timeline event
func (ts *TimelineService) AddEvent(ctx context.Context, event *TimelineEvent) error {
	query := `
		INSERT INTO timeline_events (incident_id, event_type, source, title, description, severity, metadata, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`

	metadataJSON := "{}"
	if event.Metadata != nil {
		// Simple JSON marshaling (in production, use proper JSON handling)
		metadataJSON = fmt.Sprintf("%v", event.Metadata)
	}

	err := ts.db.QueryRowContext(ctx, query,
		event.IncidentID, event.EventType, event.Source, event.Title,
		event.Description, event.Severity, metadataJSON, event.CreatedBy,
	).Scan(&event.ID, &event.CreatedAt)

	return err
}

// GetTimeline retrieves timeline for an incident
func (ts *TimelineService) GetTimeline(ctx context.Context, incidentID string) ([]TimelineEvent, error) {
	query := `
		SELECT id, incident_id, event_type, source, title, description, 
		       COALESCE(severity, ''), metadata, COALESCE(created_by, ''), created_at
		FROM timeline_events
		WHERE incident_id = $1
		ORDER BY created_at DESC
	`

	rows, err := ts.db.QueryContext(ctx, query, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []TimelineEvent
	for rows.Next() {
		var event TimelineEvent
		var metadataJSON string

		err := rows.Scan(
			&event.ID, &event.IncidentID, &event.EventType, &event.Source,
			&event.Title, &event.Description, &event.Severity,
			&metadataJSON, &event.CreatedBy, &event.CreatedAt,
		)
		if err != nil {
			continue
		}

		// Parse metadata (simplified)
		event.Metadata = make(map[string]interface{})
		event.Metadata["raw"] = metadataJSON

		events = append(events, event)
	}

	return events, nil
}

// AddIncidentStatusChange adds a status change event
func (ts *TimelineService) AddIncidentStatusChange(ctx context.Context, incidentID, oldStatus, newStatus, userID string) error {
	event := &TimelineEvent{
		IncidentID:  incidentID,
		EventType:   "status_change",
		Source:      "manual",
		Title:       fmt.Sprintf("Status changed from %s to %s", oldStatus, newStatus),
		Description: fmt.Sprintf("Incident status updated: %s → %s", oldStatus, newStatus),
		CreatedBy:   userID,
	}

	return ts.AddEvent(ctx, event)
}

// AddIncidentComment adds a comment to the timeline
func (ts *TimelineService) AddIncidentComment(ctx context.Context, incidentID, comment, userID string) error {
	event := &TimelineEvent{
		IncidentID:  incidentID,
		EventType:   "comment",
		Source:      "manual",
		Title:       "Comment added",
		Description: comment,
		CreatedBy:   userID,
	}

	return ts.AddEvent(ctx, event)
}

// AddMetricAnomaly adds a metric anomaly event
func (ts *TimelineService) AddMetricAnomaly(ctx context.Context, incidentID, metric, description string, severity string) error {
	event := &TimelineEvent{
		IncidentID:  incidentID,
		EventType:   "metric_anomaly",
		Source:      "prometheus",
		Title:       fmt.Sprintf("Metric anomaly detected: %s", metric),
		Description: description,
		Severity:    severity,
	}

	return ts.AddEvent(ctx, event)
}

// AddK8sEvent adds a Kubernetes event to the timeline
func (ts *TimelineService) AddK8sEvent(ctx context.Context, incidentID, eventType, reason, message string) error {
	event := &TimelineEvent{
		IncidentID:  incidentID,
		EventType:   "kubernetes_event",
		Source:      "kubernetes",
		Title:       fmt.Sprintf("K8s %s: %s", eventType, reason),
		Description: message,
		Severity:    eventType, // Warning or Normal
	}

	return ts.AddEvent(ctx, event)
}

// AddLogError adds a log error to the timeline
func (ts *TimelineService) AddLogError(ctx context.Context, incidentID, errorMessage string, count int) error {
	event := &TimelineEvent{
		IncidentID:  incidentID,
		EventType:   "log_error",
		Source:      "loki",
		Title:       fmt.Sprintf("Error pattern detected (%d occurrences)", count),
		Description: errorMessage,
		Severity:    "error",
	}

	return ts.AddEvent(ctx, event)
}
