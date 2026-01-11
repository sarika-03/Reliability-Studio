// Package correlation provides root cause analysis and incident correlation logic
package correlation

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/sarika-03/Reliability-Studio/clients"
	"sync"
	"time"
)

// WorkerPoolSize defines the maximum number of concurrent correlation tasks
const WorkerPoolSize = 10

// CorrelationEngine provides root cause analysis with bounded concurrency
type CorrelationEngine struct {
	db              *sql.DB
	promClient      PrometheusClient
	k8sClient       KubernetesClient
	lokiClient      LokiClient
	workerSemaphore chan struct{} // Bounded worker pool
	mu              sync.RWMutex  // Protects correlations slice
}

type PrometheusClient interface {
	GetErrorRate(ctx context.Context, service string) (float64, error)
	GetLatencyP95(ctx context.Context, service string) (float64, error)
	GetRequestRate(ctx context.Context, service string) (float64, error)
}

type KubernetesClient interface {
	GetPods(ctx context.Context, namespace, service string) ([]clients.PodStatus, error)
}

type LokiClient interface {
	GetErrorLogs(ctx context.Context, service string, since time.Time, limit int) ([]clients.LogEntry, error)
	DetectLogPatterns(ctx context.Context, service string, since time.Time) (map[string]int, error)
}

type Correlation struct {
	ID              string                 `json:"id"`
	IncidentID      string                 `json:"incident_id"`
	Type            string                 `json:"type"`
	SourceType      string                 `json:"source_type"`
	SourceID        string                 `json:"source_id"`
	ConfidenceScore float64                `json:"confidence_score"`
	Details         map[string]interface{} `json:"details"`
	CreatedAt       time.Time              `json:"created_at"`
}

type RootCauseSummary struct {
	SignalType string   `json:"signal_type"` // metric, log_pattern, infrastructure, etc.
	Source     string   `json:"source"`      // prometheus, loki, kubernetes
	Reason     string   `json:"reason"`      // human-readable explanation
	Score      float64  `json:"score"`       // internal score before normalization
	Primary    bool     `json:"primary"`     // exactly one primary per incident
	SignalIDs  []string `json:"signal_ids"`  // IDs of contributing signals
}

type IncidentContext struct {
	Service      string
	Namespace    string
	StartTime    time.Time
	Severity     string
	AffectedPods []clients.PodStatus
	LogErrors    []clients.LogEntry
	LogPatterns  map[string]int
	Metrics      map[string]float64
	RootCauses   []string
	// Analysis fields
	IncidentConfidence float64            `json:"incident_confidence"`
	RootCauseSummary   []RootCauseSummary `json:"root_cause_summary"`
	Correlations       []Correlation      `json:"correlations"`
}

const (
	metricWeight = 0.5
	logWeight    = 0.3
	k8sWeight    = 0.2
)

// NewCorrelationEngine creates a new correlation engine with bounded worker pool
func NewCorrelationEngine(db *sql.DB, promClient PrometheusClient, k8sClient KubernetesClient, lokiClient LokiClient) *CorrelationEngine {
	return &CorrelationEngine{
		db:              db,
		promClient:      promClient,
		k8sClient:       k8sClient,
		lokiClient:      lokiClient,
		workerSemaphore: make(chan struct{}, WorkerPoolSize), // Bounded to WorkerPoolSize
	}
}

// CorrelateIncident performs comprehensive correlation for an incident with bounded concurrency
func (e *CorrelationEngine) CorrelateIncident(ctx context.Context, incidentID, service, namespace string, startTime time.Time) (*IncidentContext, error) {
	// Acquire worker slot (blocks if pool is full, enforcing max 10 concurrent correlations)
	e.workerSemaphore <- struct{}{}
	defer func() { <-e.workerSemaphore }()
	ic := &IncidentContext{
		Service:   service,
		Namespace: namespace,
		StartTime: startTime,
	}

	// Run correlations - FIXED: Now logging warnings instead of errors for optional components
	if err := e.correlateK8sState(ctx, ic); err != nil {
		fmt.Printf("Warning: Failed to correlate K8s state: %v\n", err)
	}
	if err := e.correlateMetrics(ctx, ic); err != nil {
		fmt.Printf("Warning: Failed to correlate metrics: %v\n", err)
	}
	if err := e.correlateLogs(ctx, ic); err != nil {
		fmt.Printf("Warning: Failed to correlate logs: %v\n", err)
	}
	if err := e.analyzeRootCause(ctx, ic); err != nil {
		fmt.Printf("Warning: Failed to analyze root cause: %v\n", err)
	}

	// Save correlations to database
	if err := e.saveCorrelations(ctx, incidentID, ic); err != nil {
		return ic, fmt.Errorf("failed to save correlations: %w", err)
	}

	return ic, nil
}

func (e *CorrelationEngine) correlateK8sState(ctx context.Context, ic *IncidentContext) error {
	// ✅ FIX: Check if k8sClient is available
	if e.k8sClient == nil {
		fmt.Println("Debug: Kubernetes client is not available, skipping K8s correlation")
		// Add entry to show availability status in UI as per acceptance criteria
		ic.Correlations = append(ic.Correlations, Correlation{
			Type:            "status",
			SourceType:      "kubernetes",
			SourceID:        "client",
			ConfidenceScore: 1.0,
			Details: map[string]interface{}{
				"status":  "not available",
				"message": "Kubernetes integration not configured",
			},
		})
		return nil
	}

	pods, err := e.k8sClient.GetPods(ctx, ic.Namespace, ic.Service)
	if err == nil {
		ic.AffectedPods = pods

		// Add K8s correlations if pods are unhealthy
		for _, pod := range pods {
			if pod.Status != "Running" {
				ic.Correlations = append(ic.Correlations, Correlation{
					Type:            "infrastructure",
					SourceType:      "kubernetes",
					SourceID:        pod.Name,
					ConfidenceScore: 0.95,
					Details: map[string]interface{}{
						"status": pod.Status,
						"reason": "Pod unhealthy",
					},
				})
			}
		}
	}
	return nil
}

func (e *CorrelationEngine) correlateMetrics(ctx context.Context, ic *IncidentContext) error {
	if e.promClient == nil {
		return nil
	}
	ic.Metrics = make(map[string]float64)

	errorRate, err := e.promClient.GetErrorRate(ctx, ic.Service)
	if err == nil {
		ic.Metrics["error_rate"] = errorRate
		// Correlation threshold tuned so the demo failure (30% errors) always
		// appears as a high-confidence metric correlation.
		if errorRate > 5.0 {
			ic.RootCauses = append(ic.RootCauses, fmt.Sprintf("High error rate: %.2f%%", errorRate))
			ic.Correlations = append(ic.Correlations, Correlation{
				Type:            "metric",
				SourceType:      "prometheus",
				SourceID:        "error_rate",
				ConfidenceScore: 0.8,
				Details:         map[string]interface{}{"value": errorRate, "unit": "percent"},
			})
		}
	}

	latency, err := e.promClient.GetLatencyP95(ctx, ic.Service)
	if err == nil {
		ic.Metrics["latency_p95"] = latency
		if latency > 1000 {
			ic.RootCauses = append(ic.RootCauses, fmt.Sprintf("High latency: %.0fms", latency))
			ic.Correlations = append(ic.Correlations, Correlation{
				Type:            "metric",
				SourceType:      "prometheus",
				SourceID:        "latency_p95",
				ConfidenceScore: 0.7,
				Details:         map[string]interface{}{"value": latency, "unit": "ms"},
			})
		}
	}

	reqRate, err := e.promClient.GetRequestRate(ctx, ic.Service)
	if err == nil {
		ic.Metrics["request_rate"] = reqRate
	}

	return nil
}

func (e *CorrelationEngine) correlateLogs(ctx context.Context, ic *IncidentContext) error {
	if e.lokiClient == nil {
		return nil
	}
	// Detect log patterns
	patterns, err := e.lokiClient.DetectLogPatterns(ctx, ic.Service, ic.StartTime.Add(-10*time.Minute))
	if err == nil {
		ic.LogPatterns = patterns
		for pattern, count := range patterns {
			if count > 5 {
				ic.Correlations = append(ic.Correlations, Correlation{
					Type:            "log_pattern",
					SourceType:      "loki",
					SourceID:        "pattern_detected",
					ConfidenceScore: 0.6,
					Details:         map[string]interface{}{"pattern": pattern, "count": count},
				})
			}
		}
	}

	errorLogs, err := e.lokiClient.GetErrorLogs(ctx, ic.Service, ic.StartTime.Add(-5*time.Minute), 100)
	if err == nil {
		ic.LogErrors = errorLogs
		if len(errorLogs) > 0 {
			ic.RootCauses = append(ic.RootCauses, fmt.Sprintf("Detected %d error logs", len(errorLogs)))
			// Always add an explicit log-based correlation when we have errors so
			// the incident view can surface Loki as a first-class signal.
			ic.Correlations = append(ic.Correlations, Correlation{
				Type:            "logs",
				SourceType:      "loki",
				SourceID:        "error_logs",
				ConfidenceScore: 0.8,
				Details:         map[string]interface{}{"error_count": len(errorLogs)},
			})
		}
	}
	return nil
}

func (e *CorrelationEngine) analyzeRootCause(ctx context.Context, ic *IncidentContext) error {
	var candidates []RootCauseSummary

	// 1. Infrastructure issues (pods not running)
	for _, pod := range ic.AffectedPods {
		if pod.Status != "Running" {
			candidates = append(candidates, RootCauseSummary{
				SignalType: "infrastructure",
				Source:     "kubernetes",
				Reason:     fmt.Sprintf("Pod %s is %s", pod.Name, pod.Status),
				Score:      k8sWeight * 0.95,
				SignalIDs:  []string{pod.Name},
			})
		}
	}

	// 2. Metrics (high error rate / latency)
	if er, ok := ic.Metrics["error_rate"]; ok && er > 5.0 {
		candidates = append(candidates, RootCauseSummary{
			SignalType: "metric",
			Source:     "prometheus",
			Reason:     fmt.Sprintf("High error rate: %.2f%%", er),
			Score:      metricWeight * 0.9,
			SignalIDs:  []string{"error_rate"},
		})
	}
	if lat, ok := ic.Metrics["latency_p95"]; ok && lat > 1000 {
		candidates = append(candidates, RootCauseSummary{
			SignalType: "metric",
			Source:     "prometheus",
			Reason:     fmt.Sprintf("High latency: %.0fms", lat),
			Score:      metricWeight * 0.7,
			SignalIDs:  []string{"latency_p95"},
		})
	}

	// 3. Log patterns correlated with error spikes
	if ic.Metrics["error_rate"] > 20.0 {
		for pattern, count := range ic.LogPatterns {
			if count > 10 {
				candidates = append(candidates, RootCauseSummary{
					SignalType: "log_pattern",
					Source:     "loki",
					Reason:     fmt.Sprintf("Log pattern spike: %s (%d hits)", pattern, count),
					Score:      logWeight * 0.9,
					SignalIDs:  []string{"log_pattern"},
				})
			}
		}
	}

	// Fallback if no strong candidates
	if len(candidates) == 0 {
		ic.Severity = "medium"
		ic.IncidentConfidence = 0.3
		ic.RootCauseSummary = nil
		return nil
	}

	// Pick primary by highest score, compute incident-level confidence
	var primaryIdx int
	var maxScore float64
	var totalScore float64
	for i, c := range candidates {
		totalScore += c.Score
		if c.Score > maxScore {
			maxScore = c.Score
			primaryIdx = i
		}
	}

	for i := range candidates {
		candidates[i].Primary = (i == primaryIdx)
	}

	ic.RootCauseSummary = candidates
	// Normalize confidence into [0,1]
	if totalScore > 0 {
		ic.IncidentConfidence = maxScore / totalScore
	} else {
		ic.IncidentConfidence = 0.5
	}

	// Set severity based on primary type
	switch candidates[primaryIdx].SignalType {
	case "infrastructure":
		ic.Severity = "critical"
	case "metric":
		ic.Severity = "high"
	case "log_pattern":
		ic.Severity = "high"
	default:
		ic.Severity = "medium"
	}

	// Keep human-readable legacy RootCauses list for backwards compatibility
	ic.RootCauses = nil
	for _, c := range candidates {
		prefix := "CONTRIBUTING"
		if c.Primary {
			prefix = "PRIMARY"
		}
		ic.RootCauses = append(ic.RootCauses, fmt.Sprintf("%s: %s", prefix, c.Reason))
	}

	return nil
}

func (e *CorrelationEngine) saveCorrelations(ctx context.Context, incidentID string, ic *IncidentContext) error {
	// First, clear existing correlations for this incident to avoid duplicates on re-analysis
	_, _ = e.db.ExecContext(ctx, "DELETE FROM correlations WHERE incident_id = $1", incidentID)

	for _, c := range ic.Correlations {
		details, _ := json.Marshal(c.Details)
		_, err := e.db.ExecContext(ctx, `
			INSERT INTO correlations (incident_id, correlation_type, source_type, source_id, confidence_score, details)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, incidentID, c.Type, c.SourceType, c.SourceID, c.ConfidenceScore, details)

		if err != nil {
			fmt.Printf("Error saving correlation: %v\n", err)
		}
	}
	return nil
}

// IncidentAnalysisResult is the high-level analysis contract for an incident.
type IncidentAnalysisResult struct {
	IncidentID           string             `json:"incident_id"`
	Service              string             `json:"service"`
	Namespace            string             `json:"namespace"`
	IncidentConfidence   float64            `json:"incident_confidence"`
	RootCauseSummary     []RootCauseSummary `json:"root_cause_summary"`
	RootCauseSummaryText string             `json:"root_cause_summary_text"`
	Correlations         []Correlation      `json:"correlations"`
}

// GetIncidentAnalysis returns a high-level analysis summary for an incident,
// without triggering a full re-correlation. It relies on the correlations
// previously saved by CorrelateIncident and reconstructs a lightweight
// IncidentContext from the database.
func (e *CorrelationEngine) GetIncidentAnalysis(ctx context.Context, incidentID string) (*IncidentAnalysisResult, error) {
	// Fetch basic incident context (service, started_at). Namespace is left as
	// empty for now and can be wired when we add explicit namespaces.
	var service string
	var namespace sql.NullString
	row := e.db.QueryRowContext(ctx, `
		SELECT COALESCE(s.name, ''), NULL::text
		FROM incidents i
		LEFT JOIN services s ON i.service_id = s.id
		WHERE i.id = $1
	`, incidentID)
	if err := row.Scan(&service, &namespace); err != nil {
		return nil, err
	}

	correlations, err := e.GetCorrelations(ctx, incidentID)
	if err != nil {
		return nil, err
	}

	ic := &IncidentContext{
		Service:      service,
		Namespace:    namespace.String,
		Correlations: correlations,
	}

	// Derive metrics/log/log-pattern state back from correlations for scoring.
	ic.Metrics = make(map[string]float64)
	ic.LogPatterns = make(map[string]int)
	for _, c := range correlations {
		if c.Type == "metric" && c.SourceID == "error_rate" {
			if v, ok := c.Details["value"].(float64); ok {
				ic.Metrics["error_rate"] = v
			}
		}
		if c.Type == "metric" && c.SourceID == "latency_p95" {
			if v, ok := c.Details["value"].(float64); ok {
				ic.Metrics["latency_p95"] = v
			}
		}
		if c.Type == "log_pattern" {
			if p, ok := c.Details["pattern"].(string); ok {
				if count, ok2 := c.Details["count"].(float64); ok2 {
					ic.LogPatterns[p] = int(count)
				}
			}
		}
	}

	// Re-run only the scoring step on this reconstructed context.
	if err := e.analyzeRootCause(ctx, ic); err != nil {
		return nil, err
	}

	// Clamp confidence into [0,1] just in case
	conf := ic.IncidentConfidence
	if conf < 0 {
		conf = 0
	} else if conf > 1 {
		conf = 1
	}

	// Build a short textual summary from the primary root cause, if present
	rootText := ""
	for _, rc := range ic.RootCauseSummary {
		if rc.Primary {
			rootText = rc.Reason
			break
		}
	}

	return &IncidentAnalysisResult{
		IncidentID:           incidentID,
		Service:              service,
		Namespace:            namespace.String,
		IncidentConfidence:   conf,
		RootCauseSummary:     ic.RootCauseSummary,
		RootCauseSummaryText: rootText,
		Correlations:         correlations,
	}, nil
}

func (e *CorrelationEngine) GetCorrelations(ctx context.Context, incidentID string) ([]Correlation, error) {
	rows, err := e.db.QueryContext(ctx, `
		SELECT id, incident_id, correlation_type, source_type, source_id, confidence_score, details, created_at
		FROM correlations
		WHERE incident_id = $1
	`, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var correlations []Correlation
	for rows.Next() {
		var c Correlation
		var detailsJSON string
		if err := rows.Scan(&c.ID, &c.IncidentID, &c.Type, &c.SourceType, &c.SourceID, &c.ConfidenceScore, &detailsJSON, &c.CreatedAt); err == nil {
			correlations = append(correlations, c)
		}
	}
	return correlations, nil
}
