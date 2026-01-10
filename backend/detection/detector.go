// Package detection provides incident detection from telemetry data
package detection

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/sarika-03/Reliability-Studio/clients"
)

// DetectionRule represents a rule for detecting incidents
type DetectionRule struct {
	ID             uuid.UUID              `json:"id" db:"id"`
	Name           string                 `json:"name" db:"name"`
	Description    string                 `json:"description" db:"description"`
	Enabled        bool                   `json:"enabled" db:"enabled"`
	RuleType       string                 `json:"rule_type" db:"rule_type"` // threshold, anomaly, pattern
	Query          string                 `json:"query" db:"query"`
	ThresholdValue float64                `json:"threshold_value" db:"threshold_value"`
	Severity       string                 `json:"severity" db:"severity"`
	ServiceID      *uuid.UUID             `json:"service_id,omitempty" db:"service_id"`
	Metadata       json.RawMessage        `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at" db:"updated_at"`
}

// DetectionEvent represents a detected anomaly
type DetectionEvent struct {
	RuleID     uuid.UUID
	RuleName   string
	ServiceID  string
	Severity   string
	Value      float64
	Timestamp  time.Time
	Metadata   map[string]interface{}
	Evidence   []string
}

// CorrelationCallback is called when a new incident is created
type CorrelationCallback func(ctx context.Context, incidentID, service string, timestamp time.Time)

// IncidentDetector detects incidents from telemetry data
type IncidentDetector struct {
	db                 *sqlx.DB
	promClient         *clients.PrometheusClient
	lokiClient         *clients.LokiClient
	k8sClient          *clients.KubernetesClient
	logger             *log.Logger
	mu                 sync.RWMutex
	activeAlerts        map[string]*DetectionEvent // Track active alerts to avoid duplicates
	stopChan            chan struct{}
	running             bool
	correlationCallback CorrelationCallback // Callback to trigger correlation
}

// NewIncidentDetector creates a new incident detector
func NewIncidentDetector(
	db *sql.DB,
	promClient *clients.PrometheusClient,
	lokiClient *clients.LokiClient,
	k8sClient *clients.KubernetesClient,
) *IncidentDetector {
	return &IncidentDetector{
		db:           sqlx.NewDb(db, "postgres"),
		promClient:   promClient,
		lokiClient:   lokiClient,
		k8sClient:    k8sClient,
		logger:       log.New(log.Writer(), "[IncidentDetector] ", log.LstdFlags),
		activeAlerts: make(map[string]*DetectionEvent),
		stopChan:     make(chan struct{}),
	}
}

// SetCorrelationCallback sets the callback to trigger correlation when incidents are created
func (d *IncidentDetector) SetCorrelationCallback(callback CorrelationCallback) {
	d.correlationCallback = callback
}

// Start begins continuous incident detection
func (d *IncidentDetector) Start(ctx context.Context, interval time.Duration) {
	if d.running {
		d.logger.Println("Detector already running")
		return
	}

	d.running = true
	d.logger.Printf("Starting incident detection with interval %v\n", interval)

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		// Run immediately on start
		d.runDetection(ctx)

		for {
			select {
			case <-ticker.C:
				d.runDetection(ctx)
			case <-d.stopChan:
				d.logger.Println("Stopping incident detection")
				d.running = false
				return
			case <-ctx.Done():
				d.logger.Println("Context cancelled, stopping incident detection")
				d.running = false
				return
			}
		}
	}()
}

// Stop stops the detector
func (d *IncidentDetector) Stop() {
	if d.running {
		close(d.stopChan)
	}
}

// runDetection executes all detection rules and creates incidents for triggered events
func (d *IncidentDetector) runDetection(ctx context.Context) {
	d.logger.Println("Running incident detection cycle...")

	// Load all enabled rules
	rules, err := d.loadEnabledRules(ctx)
	if err != nil {
		d.logger.Printf("Failed to load detection rules: %v\n", err)
		return
	}

	detectedEvents := make([]DetectionEvent, 0)

	// Evaluate each rule
	for _, rule := range rules {
		events, err := d.evaluateRule(ctx, rule)
		if err != nil {
			d.logger.Printf("Failed to evaluate rule %s: %v\n", rule.Name, err)
			continue
		}
		detectedEvents = append(detectedEvents, events...)
	}

	// Process detected events
	for _, event := range detectedEvents {
		if err := d.processDetectionEvent(ctx, event); err != nil {
			d.logger.Printf("Failed to process detection event: %v\n", err)
		}
	}

	d.logger.Printf("Detection cycle complete. Detected %d events\n", len(detectedEvents))
}

// loadEnabledRules loads all enabled detection rules
func (d *IncidentDetector) loadEnabledRules(ctx context.Context) ([]DetectionRule, error) {
	var rules []DetectionRule
	err := d.db.SelectContext(ctx, &rules, `
		SELECT id, name, description, enabled, rule_type, query, 
		       threshold_value, severity, service_id, metadata, created_at, updated_at
		FROM correlation_rules
		WHERE enabled = true
	`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	return rules, nil
}

// evaluateRule evaluates a single detection rule against telemetry data
func (d *IncidentDetector) evaluateRule(ctx context.Context, rule DetectionRule) ([]DetectionEvent, error) {
	events := make([]DetectionEvent, 0)

	switch rule.RuleType {
	case "threshold":
		evt, err := d.evaluateThresholdRule(ctx, rule)
		if err != nil {
			return nil, err
		}
		if evt != nil {
			events = append(events, *evt)
		}

	case "anomaly":
		evts, err := d.evaluateAnomalyRule(ctx, rule)
		if err != nil {
			return nil, err
		}
		events = append(events, evts...)

	case "pattern":
		evt, err := d.evaluatePatternRule(ctx, rule)
		if err != nil {
			return nil, err
		}
		if evt != nil {
			events = append(events, *evt)
		}
	}

	return events, nil
}

// evaluateThresholdRule checks if metrics exceed configured thresholds
func (d *IncidentDetector) evaluateThresholdRule(ctx context.Context, rule DetectionRule) (*DetectionEvent, error) {
	// For High Error Rate rule, we need to check each service individually
	// because the Prometheus query returns per-service results
	if rule.Name == "High Error Rate" {
		// Query for error rate per service
		query := `rate(http_requests_total{service=~".+",status=~"5.."}[5m]) / rate(http_requests_total{service=~".+"}[5m])`
		resp, err := d.promClient.Query(ctx, query, time.Time{})
		if err != nil {
			d.logger.Printf("Failed to query Prometheus for error rate: %v\n", err)
			return nil, nil // Non-fatal
		}

		if len(resp.Data.Result) == 0 {
			return nil, nil // No errors detected
		}

		// Check each service's error rate
		for _, result := range resp.Data.Result {
			if len(result.Value) < 2 {
				continue
			}

			valueStr, ok := result.Value[1].(string)
			if !ok {
				continue
			}

			var errorRate float64
			if _, err := fmt.Sscanf(valueStr, "%f", &errorRate); err != nil {
				continue
			}

			// Check if error rate exceeds threshold (threshold is already a ratio, not percentage)
			if errorRate > rule.ThresholdValue {
				serviceName := "unknown-service"
				if svc, ok := result.Metric["service"]; ok {
					serviceName = svc
				}

				d.logger.Printf("🚨 DETECTION TRIGGERED: Rule=%s, Service=%s, ErrorRate=%.4f (%.2f%%), Threshold=%.4f (%.2f%%)\n",
					rule.Name, serviceName, errorRate, errorRate*100, rule.ThresholdValue, rule.ThresholdValue*100)

				return &DetectionEvent{
					RuleID:    rule.ID,
					RuleName:  rule.Name,
					ServiceID: serviceName,
					Severity:  rule.Severity,
					Value:     errorRate,
					Timestamp: time.Now(),
					Metadata: map[string]interface{}{
						"threshold":      rule.ThresholdValue,
						"actual":         errorRate,
						"exceeded_by":    errorRate - rule.ThresholdValue,
						"prometheus_tags": result.Metric,
					},
					Evidence: []string{
						fmt.Sprintf("Error rate %.2f%% exceeded threshold %.2f%%", errorRate*100, rule.ThresholdValue*100),
						fmt.Sprintf("Service: %s", serviceName),
						fmt.Sprintf("Prometheus query: %s", query),
					},
				}, nil
			}
		}
		return nil, nil
	}

	// For other rules, use the rule's query directly
	resp, err := d.promClient.Query(ctx, rule.Query, time.Time{})
	if err != nil {
		d.logger.Printf("Failed to query Prometheus for rule %s: %v\n", rule.Name, err)
		return nil, nil // Non-fatal
	}

	if len(resp.Data.Result) == 0 {
		return nil, nil // Condition not triggered
	}

	// Check each result
	for _, result := range resp.Data.Result {
		if len(result.Value) < 2 {
			continue
		}

		valueStr, ok := result.Value[1].(string)
		if !ok {
			continue
		}

		var value float64
		if _, err := fmt.Sscanf(valueStr, "%f", &value); err != nil {
			d.logger.Printf("Failed to parse metric value for rule %s: %v\n", rule.Name, err)
			continue
		}

		// Check if threshold is exceeded
		if value > rule.ThresholdValue {
			serviceName := "unknown-service"
			if svc, ok := result.Metric["service"]; ok {
				serviceName = svc
			}

			d.logger.Printf("🚨 DETECTION TRIGGERED: Rule=%s, Service=%s, Value=%.4f, Threshold=%.4f\n",
				rule.Name, serviceName, value, rule.ThresholdValue)

			return &DetectionEvent{
				RuleID:    rule.ID,
				RuleName:  rule.Name,
				ServiceID: serviceName,
				Severity:  rule.Severity,
				Value:     value,
				Timestamp: time.Now(),
				Metadata: map[string]interface{}{
					"threshold":      rule.ThresholdValue,
					"actual":         value,
					"exceeded_by":    value - rule.ThresholdValue,
					"prometheus_tags": result.Metric,
				},
				Evidence: []string{
					fmt.Sprintf("Rule '%s' triggered: %.4f exceeded threshold %.4f", rule.Name, value, rule.ThresholdValue),
					fmt.Sprintf("Service: %s", serviceName),
					fmt.Sprintf("Query: %s", rule.Query),
				},
			}, nil
		}
	}

	return nil, nil
}

// evaluateAnomalyRule detects statistical anomalies in metrics
func (d *IncidentDetector) evaluateAnomalyRule(ctx context.Context, rule DetectionRule) ([]DetectionEvent, error) {
	// Placeholder for anomaly detection
	// This would use statistical methods like z-score, isolation forest, etc.
	return []DetectionEvent{}, nil
}

// evaluatePatternRule detects specific patterns (e.g., pod crashes, log spikes)
func (d *IncidentDetector) evaluatePatternRule(ctx context.Context, rule DetectionRule) (*DetectionEvent, error) {
	// Check for pod crashes
	if rule.Name == "Pod Crash Loop" {
		crashingPods := 0
		if d.k8sClient != nil {
			pods, err := d.k8sClient.GetPods(ctx, "default", "all")
			if err == nil {
				for _, pod := range pods {
					if pod.Status == "CrashLoopBackOff" {
						crashingPods++
					}
				}
			}
		}

		if crashingPods > 0 {
			return &DetectionEvent{
				RuleID:    rule.ID,
				RuleName:  rule.Name,
				ServiceID: "kubernetes",
				Severity:  rule.Severity,
				Value:     float64(crashingPods),
				Timestamp: time.Now(),
				Metadata: map[string]interface{}{
					"pod_count": crashingPods,
				},
				Evidence: []string{
					fmt.Sprintf("Detected %d pods in CrashLoopBackOff", crashingPods),
				},
			}, nil
		}
	}

	return nil, nil
}

// processDetectionEvent converts a detection event into an incident if needed
func (d *IncidentDetector) processDetectionEvent(ctx context.Context, event DetectionEvent) error {
	// Create a unique key for this alert
	alertKey := fmt.Sprintf("%s:%s", event.RuleName, event.ServiceID)

	d.mu.Lock()
	defer d.mu.Unlock()

	// Check if we already have an active alert for this
	if existing, found := d.activeAlerts[alertKey]; found {
		// Update existing alert's timestamp (alert is still firing)
		existing.Timestamp = event.Timestamp
		d.logger.Printf("Alert %s still active, not creating duplicate incident\n", alertKey)
		return nil
	}

	// Get or create service for this incident
	serviceName := event.ServiceID
	if serviceName == "all" || serviceName == "" {
		serviceName = "unknown-service"
	}
	
	var serviceID string
	err := d.db.QueryRow(`
		INSERT INTO services (name, status) VALUES ($1, 'degraded')
		ON CONFLICT (name) DO UPDATE SET status = 'degraded', updated_at = NOW()
		RETURNING id
	`, serviceName).Scan(&serviceID)
	if err != nil {
		d.logger.Printf("Warning: Failed to get/create service: %v\n", err)
		serviceID = "" // Will insert NULL
	}

	// Create new incident for this detection event
	incidentID := uuid.New()
	
	// Extract threshold from metadata if available
	threshold := 0.0
	if thresh, ok := event.Metadata["threshold"]; ok {
		if t, ok := thresh.(float64); ok {
			threshold = t
		}
	}
	
	incidentTitle := fmt.Sprintf("[%s] %s detected in %s", event.Severity, event.RuleName, serviceName)
	incidentDescription := fmt.Sprintf("🚨 AUTOMATED INCIDENT CREATION\n\n"+
		"Detection Rule: %s\n"+
		"Service: %s\n"+
		"Triggered Value: %.4f (exceeded threshold: %.4f)\n"+
		"Severity: %s\n"+
		"Timestamp: %s\n\n"+
		"Evidence:\n%s",
		event.RuleName, serviceName, event.Value, threshold,
		event.Severity, event.Timestamp.Format(time.RFC3339),
		strings.Join(event.Evidence, "\n"))

	d.logger.Printf("🔨 CREATING INCIDENT: id=%s, title=%s, service=%s, severity=%s, value=%.4f, threshold=%.4f\n",
		incidentID, incidentTitle, serviceName, event.Severity, event.Value, threshold)

	// Insert incident with service_id
	var query string
	var args []interface{}
	if serviceID != "" {
		query = `
			INSERT INTO incidents (id, title, description, severity, status, service_id, started_at, detected_at, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`
		args = []interface{}{
			incidentID, incidentTitle, incidentDescription, event.Severity,
			"open", serviceID, event.Timestamp, event.Timestamp, time.Now(), time.Now(),
		}
	} else {
		query = `
			INSERT INTO incidents (id, title, description, severity, status, started_at, detected_at, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		args = []interface{}{
			incidentID, incidentTitle, incidentDescription, event.Severity,
			"open", event.Timestamp, event.Timestamp, time.Now(), time.Now(),
		}
	}
	
	_, err = d.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to create incident: %w", err)
	}

	// Add timeline event for the detection (FIXED: correct parameter order)
	timelineID := uuid.New()
	eventMetadata, _ := json.Marshal(event.Metadata)
	timelineQuery := `
		INSERT INTO timeline_events (id, incident_id, event_type, timestamp, source, title, description, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err = d.db.ExecContext(ctx, timelineQuery,
		timelineID, incidentID, "metric_anomaly", event.Timestamp, "prometheus",
		fmt.Sprintf("Detected: %s", event.RuleName), fmt.Sprintf("Automated detection triggered: %s (value: %.2f)", event.RuleName, event.Value), eventMetadata,
	)
	if err != nil {
		d.logger.Printf("Warning: Failed to add timeline event: %v\n", err)
	}

	// Track this active alert
	d.activeAlerts[alertKey] = &event

	d.logger.Printf("✅ INCIDENT CREATED: id=%s, rule=%s, service=%s, severity=%s, value=%.4f\n",
		incidentID, event.RuleName, serviceName, event.Severity, event.Value)
	d.logger.Printf("📊 Incident details: title='%s', description_length=%d, evidence_count=%d\n",
		incidentTitle, len(incidentDescription), len(event.Evidence))

	// Trigger correlation if callback is set
	if d.correlationCallback != nil {
		go func() {
			correlationCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			d.correlationCallback(correlationCtx, incidentID.String(), serviceName, event.Timestamp)
		}()
	}

	return nil
}

// ResolveAlert marks an alert as resolved if it's no longer firing
func (d *IncidentDetector) ResolveAlert(ctx context.Context, ruleName, serviceID string) error {
	alertKey := fmt.Sprintf("%s:%s", ruleName, serviceID)

	d.mu.Lock()
	defer d.mu.Unlock()

	if _, found := d.activeAlerts[alertKey]; found {
		delete(d.activeAlerts, alertKey)
		d.logger.Printf("Alert resolved: %s\n", alertKey)
	}

	return nil
}

// GetActiveAlerts returns all currently active alerts
func (d *IncidentDetector) GetActiveAlerts() map[string]*DetectionEvent {
	d.mu.RLock()
	defer d.mu.RUnlock()

	result := make(map[string]*DetectionEvent)
	for k, v := range d.activeAlerts {
		result[k] = v
	}
	return result
}
