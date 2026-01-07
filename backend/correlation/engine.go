// Package correlation provides root cause analysis and incident correlation logic
package correlation

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/sarikasharma2428-web/reliability-studio/clients"
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
	Correlations []Correlation
}

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
		if errorRate > 1.0 {
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
		}
	}
	return nil
}

func (e *CorrelationEngine) analyzeRootCause(ctx context.Context, ic *IncidentContext) error {
	// 1. Check for infrastructure issues (Pods not running)
	for _, pod := range ic.AffectedPods {
		if pod.Status != "Running" {
			ic.RootCauses = append([]string{fmt.Sprintf("PRIMARY: Pod %s is %s", pod.Name, pod.Status)}, ic.RootCauses...)
			ic.Severity = "critical"

			ic.Correlations = append(ic.Correlations, Correlation{
				Type:            "infrastructure",
				SourceType:      "kubernetes",
				SourceID:        pod.Name,
				ConfidenceScore: 0.95,
				Details:         map[string]interface{}{"status": pod.Status, "reason": "Pod unhealthy"},
			})
			return nil
		}
	}

	// 2. Link log patterns with metric spikes
	if ic.Metrics["error_rate"] > 5.0 {
		for pattern, count := range ic.LogPatterns {
			if count > 10 {
				ic.RootCauses = append([]string{fmt.Sprintf("PRIMARY: Log pattern correlated with error spike: %s", pattern)}, ic.RootCauses...)
				ic.Severity = "high"

				// Increase confidence for these correlations
				for i := range ic.Correlations {
					if ic.Correlations[i].Type == "log_pattern" && ic.Correlations[i].Details["pattern"] == pattern {
						ic.Correlations[i].ConfidenceScore = 0.9
					}
				}
				return nil
			}
		}
	}

	ic.Severity = "medium"
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
