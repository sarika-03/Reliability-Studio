package services

import (
	"context"
	"fmt"
	"strings"
	"time"
	"github.com/sarika-03/Reliability-Studio/clients"
	"github.com/sarika-03/Reliability-Studio/websocket"
	"go.uber.org/zap"
)

// ARAOrchestrator is the brain for autonomous investigations
type ARAOrchestrator struct {
	investigationService *InvestigationService
	promClient          *clients.PrometheusClient
	lokiClient          *LokiClient
	k8sClient           *K8sClient
	wsServer            *websocket.RealtimeServer
	logger              *zap.Logger
}

func NewARAOrchestrator(is *InvestigationService, prom *clients.PrometheusClient, loki *LokiClient, k8s *K8sClient, ws *websocket.RealtimeServer, logger *zap.Logger) *ARAOrchestrator {
	return &ARAOrchestrator{
		investigationService: is,
		promClient:          prom,
		lokiClient:          loki,
		k8sClient:           k8s,
		wsServer:            ws,
		logger:              logger,
	}
}

func (a *ARAOrchestrator) logAndBroadcast(ctx context.Context, incidentID string, message string, metadata map[string]interface{}) {
	_ = a.investigationService.CreateInvestigationLog(ctx, incidentID, message, metadata)
	if a.wsServer != nil {
		a.wsServer.BroadcastARALog(map[string]interface{}{
			"incident_id": incidentID,
			"message":     message,
			"metadata":    metadata,
			"created_at":  time.Now(),
		})
	}
}

// StartInvestigation begins an autonomous investigation workflow
func (a *ARAOrchestrator) StartInvestigation(ctx context.Context, incidentID string, serviceName string) {
	a.logger.Info("🤖 ARA: Starting investigation", zap.String("incident_id", incidentID), zap.String("service", serviceName))
	
	a.logAndBroadcast(ctx, incidentID, "🤖 Autonomous Agent (ARA) initialized for service: "+serviceName, nil)
	
	// Phase 1: Scanning Telemetry
	go a.runWorkflow(incidentID, serviceName)
}

func (a *ARAOrchestrator) runWorkflow(incidentID string, serviceName string) {
	ctx := context.Background()
	
	// Phase 1: Metric Analysis
	a.logAndBroadcast(ctx, incidentID, "📈 Phase 1: Analyzing metrics from Prometheus...", nil)
	
	// Check for error rate spikes
	errorQuery := fmt.Sprintf(`sum(rate(http_requests_total{service="%s",status=~"5.."}[5m])) / sum(rate(http_requests_total{service="%s"}[5m]))`, serviceName, serviceName)
	resp, err := a.promClient.Query(ctx, errorQuery, time.Now())
	
	errorRate := 0.0
	if err == nil && len(resp.Data.Result) > 0 && len(resp.Data.Result[0].Value) >= 2 {
		val, ok := resp.Data.Result[0].Value[1].(string)
		if ok {
			fmt.Sscanf(val, "%f", &errorRate)
		}
	}
	if errorRate > 0.05 {
		a.logAndBroadcast(ctx, incidentID, fmt.Sprintf("⚠️  Confirmed high error rate: %.1f%%", errorRate*100), map[string]interface{}{"error_rate": errorRate})
	}
	
	// Phase 2: Log Analysis
	a.logAndBroadcast(ctx, incidentID, "🔎 Phase 2: Scanning Loki logs for patterns...", nil)
	
	rca, err := a.lokiClient.FindRootCause(ctx, serviceName, 15*time.Minute)
	if err != nil {
		a.logger.Warn("Failed to fetch log patterns", zap.Error(err))
		rca = "Unable to determine pattern from logs"
	}
	
	a.logAndBroadcast(ctx, incidentID, "📋 Log analysis completed: "+rca, nil)
	
	// Phase 3: Infrastucture Analysis
	a.logAndBroadcast(ctx, incidentID, "☸️  Phase 3: Checking Kubernetes state...", nil)
	
	k8sEvidence := ""
	if a.k8sClient != nil {
		status, err := a.k8sClient.GetClusterStatus(ctx)
		if err == nil {
			for _, pod := range status.Pods {
				// Simple heuristic: if pod name contains service name and has restarts
				if (serviceName == "all" || strings.Contains(pod.Name, serviceName)) && pod.Restarts > 0 {
					k8sEvidence += fmt.Sprintf("Pod %s in namespace %s has %d restarts. ", pod.Name, pod.Namespace, pod.Restarts)
				}
			}
		}
	}
	
	if k8sEvidence != "" {
		a.logAndBroadcast(ctx, incidentID, "🚨 Infrastructure issue found: "+k8sEvidence, nil)
	} else {
		a.logAndBroadcast(ctx, incidentID, "✅ No immediate infrastructure issues (pod restarts) found.", nil)
	}
	
	// Phase 4: Hypothesis Generation
	a.logAndBroadcast(ctx, incidentID, "🧠 Phase 4: Synthesizing findings into hypotheses...", nil)
	
	confidence := 0.70
	hypothesisTitle := "Service degradation due to application errors"
	if errorRate > 0.2 {
		confidence = 0.90
		hypothesisTitle = "Critical failure: Service " + serviceName + " is returning high volume of errors"
	}
	
	if strings.Contains(rca, "Database") {
		hypothesisTitle = "Potential Database Connectivity Issue"
		confidence = 0.85
	}
	
	hypothesisDesc := fmt.Sprintf("ARA analysis suggests: %s. %s", rca, k8sEvidence)
	
	evidence := map[string]interface{}{
		"error_rate": errorRate,
		"log_rca": rca,
		"k8s_evidence": k8sEvidence,
		"service": serviceName,
	}
	
	_, err = a.investigationService.CreateHypothesis(ctx, incidentID, hypothesisTitle, hypothesisDesc, true, evidence)
	if err != nil {
		a.logger.Error("Failed to create ARA hypothesis", zap.Error(err))
	} else {
		a.logAndBroadcast(ctx, incidentID, fmt.Sprintf("✅ Hypothesis generated with %.0f%% confidence.", confidence*100), nil)
	}
	
	// Phase 5: Recommended Next Steps
	a.logAndBroadcast(ctx, incidentID, "📝 Phase 5: Generating investigation steps...", nil)
	
	if errorRate > 0.01 {
		_, _ = a.investigationService.CreateInvestigationStep(ctx, incidentID, "Check Service Dependences", "Verify if upstream/downstream services are healthy")
		_, _ = a.investigationService.CreateInvestigationStep(ctx, incidentID, "Analyze Log Stacktrace", "Examine full stacktraces in Loki for error pattern: "+rca)
	}
	
	if k8sEvidence != "" {
		_, _ = a.investigationService.CreateInvestigationStep(ctx, incidentID, "Inspect Pod Describe", "Run kubectl describe on affected pods to check for OOM or other exit codes")
	}

	// Always add a manual verification step to ensure UI is never empty
	if errorRate <= 0.01 && k8sEvidence == "" {
		_, _ = a.investigationService.CreateInvestigationStep(ctx, incidentID, "Manual Verification", "Review dashboards and verify system health manually")
	}
	
	a.logAndBroadcast(ctx, incidentID, "🤖 ARA investigation cycle completed. Standing by for human instructions.", nil)
}
