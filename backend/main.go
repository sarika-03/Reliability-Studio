package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	_ "net/http/pprof"
	"go.uber.org/zap"
	

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/sarika-03/Reliability-Studio/clients"
	"github.com/sarika-03/Reliability-Studio/correlation"
	"github.com/sarika-03/Reliability-Studio/database"
	"github.com/sarika-03/Reliability-Studio/detection"
	"github.com/sarika-03/Reliability-Studio/handlers"
	"github.com/sarika-03/Reliability-Studio/middleware"
	"github.com/sarika-03/Reliability-Studio/services"
	"github.com/sarika-03/Reliability-Studio/stability"
	"github.com/sarika-03/Reliability-Studio/utils"
	"github.com/sarika-03/Reliability-Studio/websocket"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

type Server struct {
	db                 *sql.DB
	promClient         *clients.PrometheusClient
	k8sClient          *clients.KubernetesClient
	lokiClient         *clients.LokiClient
	sloService         *services.SLOService
	timelineService    *services.TimelineService
	correlationEngine  *correlation.CorrelationEngine
	incidentDetector   *detection.IncidentDetector
	healthChecker      *stability.HealthChecker
	circuitBreaker     *stability.CircuitBreakerManager
	logger             *utils.StructuredLogger
	realtimeServer     *websocket.RealtimeServer
}

func initTracer() {
	ctx := context.Background()

	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint("tempo:4317"),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		log.Fatal(err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("reliability-backend"),
		)),
	)

	otel.SetTracerProvider(tp)
}

func main() {
	initTracer()
	log.Println("🚀 Starting Reliability Studio Backend...")

	// Load configuration
	dbConfig := database.LoadConfigFromEnv()
	promURL := getEnv("PROMETHEUS_URL", "http://prometheus:9090")
	lokiURL := getEnv("LOKI_URL", "http://loki:3100")

	// Initialize database
	log.Println("Connecting to database...")
	db, err := database.Connect(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize schema
	if err := database.InitSchema(db); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}

	// Seed default data
	if err := database.SeedDefaultData(db); err != nil {
		log.Printf("Warning: Failed to seed data: %v", err)
	}

	// Initialize clients
	log.Println("🔌 Initializing clients...")
	promClient := clients.NewPrometheusClient(promURL)
	lokiClient := clients.NewLokiClient(lokiURL)

	// Initialize K8s client - FIXED: Handle typed-nil issue for interfaces
	var k8sInterface correlation.KubernetesClient
	k8sClient, err := clients.NewKubernetesClient()
	if err != nil {
		log.Printf("Warning: Failed to initialize K8s client: %v", err)
		k8sClient = nil // Pointer is nil
	} else {
		k8sInterface = k8sClient // Interface is populated
	}

	// Initialize structured logger first (needed by services)
	log.Println("📝 Initializing structured logger...")
	structuredLogger := utils.NewStructuredLogger(lokiClient, "reliability-studio")

	// Initialize zap logger for services that require it
	zapLogger, err := zap.NewProduction()
	if err != nil {
		log.Printf("Warning: Failed to initialize zap logger: %v, using standard logger", err)
		zapLogger = zap.NewNop() // No-op logger as fallback
	}
	defer zapLogger.Sync()

	// Initialize services
	log.Println("⚙️  Initializing services...")
	sloService := services.NewSLOService(db, promClient)
	timelineService := services.NewTimelineService(db)
	investigationService := services.NewInvestigationService(db, zapLogger)
	correlationEngine := correlation.NewCorrelationEngine(db, promClient, k8sInterface, lokiClient)

	// Initialize stability systems
	log.Println("🛡️  Initializing stability systems...")
	circuitBreaker := stability.NewCircuitBreakerManager()
	healthChecker := stability.NewHealthChecker(
		db,
		promURL,
		lokiURL,
		func() bool { return correlationEngine != nil }, // Simple readiness check
	)

	// Create server
	server := &Server{
		db:                db,
		promClient:        promClient,
		k8sClient:         k8sClient,
		lokiClient:        lokiClient,
		sloService:        sloService,
		timelineService:   timelineService,
		correlationEngine: correlationEngine,
		healthChecker:     healthChecker,
		logger:            structuredLogger,
		circuitBreaker:    circuitBreaker,
	}

	// Initialize WebSocket server for real-time updates
	log.Println("🔌 Initializing WebSocket server...")
	realtimeServer := websocket.NewRealtimeServer()
	realtimeServer.Start()
	server.realtimeServer = realtimeServer

	// Initialize incident detector
	log.Println("🔍 Initializing incident detector...")
	detector := detection.NewIncidentDetector(db, promClient, lokiClient, k8sClient)
	server.incidentDetector = detector

	// Set timeline callback for real-time updates
	detector.SetTimelineCallback(func(event interface{}) {
		realtimeServer.BroadcastTimelineEvent(event)
	})

	// Set correlation callback to trigger correlation when incidents are detected
	detector.SetCorrelationCallback(func(ctx context.Context, incidentID, service string, timestamp time.Time) {
		log.Printf("🔗 Triggering correlation for incident %s (service: %s)", incidentID, service)
		
		// Wait a moment for DB consistency, then fetch incident data for WebSocket broadcast
		time.Sleep(100 * time.Millisecond)
		var id, title, severity, status, serviceName string
		var startedAt time.Time
		err := db.QueryRow(`
			SELECT i.id, i.title, i.severity, i.status, COALESCE(s.name, 'unknown') as service, i.started_at
			FROM incidents i
			LEFT JOIN services s ON i.service_id = s.id
			WHERE i.id = $1
		`, incidentID).Scan(&id, &title, &severity, &status, &serviceName, &startedAt)
		if err == nil {
			incidentData := map[string]interface{}{
				"id":         id,
				"title":      title,
				"severity":   severity,
				"status":     status,
				"service":    serviceName,
				"started_at": startedAt,
			}
			log.Printf("📡 Broadcasting incident created: id=%s, title=%s", id, title)
			realtimeServer.BroadcastIncidentCreated(incidentData)
		} else {
			log.Printf("⚠️  Failed to fetch incident for broadcast: %v", err)
		}
		
		// Run correlation
		ic, err := correlationEngine.CorrelateIncident(ctx, incidentID, service, "default", timestamp)
		if err != nil {
			log.Printf("Warning: Correlation failed for incident %s: %v", incidentID, err)
		} else {
			log.Printf("✅ Correlation completed for incident %s: %d correlations found", incidentID, len(ic.Correlations))
			// Broadcast correlation results
			if len(ic.Correlations) > 0 {
				realtimeServer.BroadcastCorrelationFound(map[string]interface{}{
					"incident_id": incidentID,
					"correlations": ic.Correlations,
				})
			}
		}
	})

	// Start incident detection (run every 30 seconds for faster response)
	log.Println("⚡ Starting continuous incident detection...")
	ctx, cancel := context.WithCancel(context.Background())
	detector.Start(ctx, 30*time.Second)

	// Setup router
	router := mux.NewRouter()

	// Setup middleware - Security first
	router.Use(middleware.Recovery)
	router.Use(middleware.Logging)
	router.Use(middleware.SecurityHeadersMiddleware)
	router.Use(middleware.RateLimitingMiddleware)
	
	// Initialize detection handlers
	handlers.InitDetectionHandlers(detector)
	handlers.InitInvestigationHandlers(investigationService)

	// Add telemetry middleware to capture all metrics and logs
	telemetryMiddleware := middleware.NewTelemetryMiddleware(promClient, lokiClient, "reliability-studio")
	router.Use(telemetryMiddleware.Middleware)

	// Public routes
	router.HandleFunc("/health", server.healthHandler).Methods("GET")
	router.HandleFunc("/api/health", handlers.HandleHealthCheck(healthChecker)).Methods("GET")
	// Prometheus metrics endpoint (public, no auth required)
	router.Handle("/metrics", promhttp.Handler())
	router.HandleFunc("/api/auth/login", middleware.LoginHandler(db)).Methods("POST")
	router.HandleFunc("/api/auth/register", middleware.RegisterHandler(db)).Methods("POST")
	router.HandleFunc("/api/auth/refresh", middleware.RefreshTokenHandler()).Methods("POST")
	
	// WebSocket route (public for now, can add auth later)
	router.HandleFunc("/api/realtime", realtimeServer.HandleWebSocket)

	// Protected routes
	api := router.PathPrefix("/api").Subrouter()
	api.Use(middleware.Auth)

	// Incidents routes
	api.HandleFunc("/incidents", server.getIncidentsHandler).Methods("GET")
	api.HandleFunc("/incidents/active", server.getActiveIncidentsHandler).Methods("GET")
	api.HandleFunc("/incidents", server.createIncidentHandler).Methods("POST")
	api.HandleFunc("/incidents/{id}", server.getIncidentHandler).Methods("GET")
	api.HandleFunc("/incidents/{id}", server.updateIncidentHandler).Methods("PATCH")
	api.HandleFunc("/incidents/{id}/timeline", server.getIncidentTimelineHandler).Methods("GET")
	api.HandleFunc("/incidents/{id}/correlations", server.getIncidentCorrelationsHandler).Methods("GET")
	api.HandleFunc("/incidents/{id}/analysis", server.getIncidentAnalysisHandler).Methods("GET")

	// Investigation routes (guided RCA workflows)
	api.HandleFunc("/incidents/{id}/investigation/hypotheses", handlers.GetInvestigationHypotheses).Methods("GET")
	api.HandleFunc("/incidents/{id}/investigation/hypotheses", handlers.CreateInvestigationHypothesis).Methods("POST")
	api.HandleFunc("/incidents/{id}/investigation/steps", handlers.GetInvestigationSteps).Methods("GET")
	api.HandleFunc("/incidents/{id}/investigation/steps", handlers.CreateInvestigationStep).Methods("POST")
	api.HandleFunc("/incidents/{id}/investigation/rca", handlers.GetRootCauseAnalysis).Methods("GET")
	api.HandleFunc("/incidents/{id}/investigation/recommended-actions", handlers.GetRecommendedActions).Methods("GET")

	// Detection rules and alerts
	api.HandleFunc("/detection/rules", handlers.GetDetectionRules).Methods("GET")
	api.HandleFunc("/detection/status", handlers.GetDetectionStatus).Methods("GET")

	// SLO routes
	api.HandleFunc("/slos", server.getSLOsHandler).Methods("GET")
	api.HandleFunc("/slos", server.createSLOHandler).Methods("POST")
	api.HandleFunc("/slos/{id}", server.getSLOHandler).Methods("GET")
	api.HandleFunc("/slos/{id}", server.updateSLOHandler).Methods("PATCH")
	api.HandleFunc("/slos/{id}", server.deleteSLOHandler).Methods("DELETE")
	api.HandleFunc("/slos/{id}/calculate", server.calculateSLOHandler).Methods("POST")
	api.HandleFunc("/slos/{id}/history", server.getSLOHistoryHandler).Methods("GET")

	// Metrics routes
	api.HandleFunc("/metrics/availability/{service}", server.getServiceAvailabilityHandler).Methods("GET")
	api.HandleFunc("/metrics/error-rate/{service}", server.getServiceErrorRateHandler).Methods("GET")
	api.HandleFunc("/metrics/latency/{service}", server.getServiceLatencyHandler).Methods("GET")

	// Kubernetes routes
	if k8sClient != nil {
		api.HandleFunc("/kubernetes/pods/{namespace}/{service}", server.getPodsHandler).Methods("GET")
		api.HandleFunc("/kubernetes/deployments/{namespace}/{service}", server.getDeploymentsHandler).Methods("GET")
		api.HandleFunc("/kubernetes/events/{namespace}/{service}", server.getK8sEventsHandler).Methods("GET")
	}

	// Logs routes
	api.HandleFunc("/logs/{service}/errors", server.getErrorLogsHandler).Methods("GET")
	api.HandleFunc("/logs/{service}/search", server.searchLogsHandler).Methods("GET")

	// Services route (public for service selector)
	api.HandleFunc("/services", server.getServicesHandler).Methods("GET")

	// Admin routes
	admin := api.PathPrefix("/admin").Subrouter()
	admin.Use(middleware.RequireRole("admin"))
	admin.HandleFunc("/users", server.getUsersHandler).Methods("GET")
	admin.HandleFunc("/services", server.getServicesHandler).Methods("GET")

	// Test endpoints - for chaos engineering and verification
	// Note: These are public endpoints for testing purposes
	test := router.PathPrefix("/api/test").Subrouter()
	test.HandleFunc("/load", handlers.HandleTestLoad).Methods("POST")
	test.HandleFunc("/fail", handlers.HandleTestFail).Methods("POST")
	test.HandleFunc("/log", handlers.HandleTestLog).Methods("POST")

	// Initialize test handlers with dependencies
	// Using nil for logger - handlers will use standard logging
	handlers.InitTestHandlers(promClient, lokiClient, nil, sloService, nil)

	// CORS configuration - HARDENED: Strict origins, no wildcards
	allowedOrigins := strings.Split(getEnvStrict("CORS_ALLOWED_ORIGINS"), ",")
	if len(allowedOrigins) == 0 || allowedOrigins[0] == "" {
		log.Fatal("🔴 CORS_ALLOWED_ORIGINS environment variable not set! Set to comma-separated list of allowed origins, e.g., 'https://example.com,https://app.example.com'")
	}

	log.Printf("✅ CORS configured for origins: %v", allowedOrigins)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-CSRF-Token"},
		ExposedHeaders:   []string{"X-Total-Count"},
		AllowCredentials: true,
		MaxAge:           300,
	})

	// Optional: PProf for performance debugging
	if os.Getenv("ENABLE_PPROF") == "true" {
		go func() {
			log.Println("🩺 Starting pprof on :6060")
			if err := http.ListenAndServe(":6060", nil); err != nil {
				log.Printf("PProf failed: %v", err)
			}
		}()
	}

	// Start background jobs with context
	ctx, cancelBackgroundJobs := context.WithCancel(context.Background())
	go server.startBackgroundJobs(ctx)

	// Start server
	port := getEnv("PORT", "9000")
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      corsHandler.Handler(router),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
		<-sigint

		log.Println("🛑 Shutting down server...")

		// Stop incident detector
		if detector != nil {
			log.Println("⛔ Stopping incident detector...")
			detector.Stop()
		}

		// Cancel background jobs
		cancelBackgroundJobs()
		cancel() // Cancel the detector context

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("✅ Server started on port %s", port)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}

// Background jobs - FIXED: Now accepts context for graceful shutdown
func (s *Server) startBackgroundJobs(ctx context.Context) {
	// Calculate SLOs every 5 minutes
	sloTicker := time.NewTicker(5 * time.Minute)
	defer sloTicker.Stop()

	// Generate sample telemetry every 30 seconds for local development
	telemetryTicker := time.NewTicker(30 * time.Second)
	defer telemetryTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Background jobs shutting down...")
			return
		case <-sloTicker.C:
			jobCtx := context.Background()
			log.Println("⏰ Running SLO calculations...")
			if err := s.sloService.CalculateAllSLOs(jobCtx); err != nil {
				log.Printf("Error calculating SLOs: %v", err)
			}
		case <-telemetryTicker.C:
			// Generate sample telemetry for development
			go s.generateSampleTelemetry(ctx)
		}
	}
}

// generateSampleTelemetry generates sample metrics and logs for development/testing
func (s *Server) generateSampleTelemetry(ctx context.Context) {
	if s.promClient == nil || s.lokiClient == nil {
		return
	}

	// Simulate requests to different services
	services := []string{"api-gateway", "user-service", "payment-service", "notification-service"}
	
	for _, serviceName := range services {
		// Generate request metric
		labels := map[string]string{
			"service":     serviceName,
			"method":      "GET",
			"endpoint":    "/api/v1/data",
			"status_code": "200",
		}

		// Random latency between 10-200ms
		latency := float64(10 + (len(serviceName) % 190))
		if err := s.promClient.PushHistogram(ctx, "http_request_duration_seconds", latency/1000.0, labels); err != nil {
			log.Printf("⚠️  Failed to push sample telemetry: %v", err)
		}

		// Push counter
		if err := s.promClient.PushCounter(ctx, "http_requests_total", 1, labels); err != nil {
			log.Printf("⚠️  Failed to push sample counter: %v", err)
		}

		// Generate sample log
		logMessage := fmt.Sprintf("Request processed: GET /api/v1/data -> 200 OK (%.1fms)", latency)
		logLabels := map[string]string{
			"service": serviceName,
			"level":   "info",
		}
		if err := s.lokiClient.PushLog(ctx, serviceName, "info", logMessage, logLabels); err != nil {
			log.Printf("⚠️  Failed to push sample log: %v", err)
		}
	}

	// Occasionally generate an error for one service
	if time.Now().Unix()%10 == 0 { // Every ~10 seconds
		errorLabels := map[string]string{
			"service":     "user-service",
			"method":      "POST",
			"endpoint":    "/api/v1/users",
			"status_code": "500",
		}
		if err := s.promClient.PushCounter(ctx, "http_requests_error_total", 1, errorLabels); err != nil {
			log.Printf("⚠️  Failed to push error metric: %v", err)
		}

		// Push error log
		errorLogLabels := map[string]string{
			"service": "user-service",
			"level":   "error",
		}
		if err := s.lokiClient.PushLog(ctx, "user-service", "error", "Database connection timeout", errorLogLabels); err != nil {
			log.Printf("⚠️  Failed to push error log: %v", err)
		}
	}

	log.Println("📊 Sample telemetry generated")
}

// Handlers
func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
	}

	// Check database
	if err := database.HealthCheck(s.db); err != nil {
		health["database"] = "unhealthy"
		health["status"] = "degraded"
	} else {
		health["database"] = "healthy"
	}

	// Check Prometheus
	ctx := context.Background()
	if err := s.promClient.Health(ctx); err != nil {
		health["prometheus"] = "unhealthy"
	} else {
		health["prometheus"] = "healthy"
	}

	// Check Loki
	if err := s.lokiClient.Health(ctx); err != nil {
		health["loki"] = "unhealthy"
	} else {
		health["loki"] = "healthy"
	}

	// Check Kubernetes
	if s.k8sClient != nil {
		if err := s.k8sClient.Health(ctx); err != nil {
			health["kubernetes"] = "unhealthy"
		} else {
			health["kubernetes"] = "healthy"
		}
	}

	respondJSON(w, http.StatusOK, health)
}

func (s *Server) getIncidentsHandler(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	limit := 50
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Query incidents from database with pagination and timeout
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, `
		SELECT i.id, i.title, i.severity, i.status, s.name as service, i.started_at
		FROM incidents i
		LEFT JOIN services s ON i.service_id = s.id
		ORDER BY i.started_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to query incidents")
		return
	}
	defer rows.Close()

	var incidents []map[string]interface{}
	for rows.Next() {
		var id, title, severity, status, service string
		var startedAt time.Time

		if err := rows.Scan(&id, &title, &severity, &status, &service, &startedAt); err != nil {
			continue
		}

		incidents = append(incidents, map[string]interface{}{
			"id":         id,
			"title":      title,
			"severity":   severity,
			"status":     status,
			"service":    service,
			"started_at": startedAt,
		})
	}

	if incidents == nil {
		incidents = make([]map[string]interface{}, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Pagination-Limit", fmt.Sprintf("%d", limit))
	w.Header().Set("X-Pagination-Offset", fmt.Sprintf("%d", offset))
	json.NewEncoder(w).Encode(incidents)
}

func (s *Server) getActiveIncidentsHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, `
		SELECT i.id, i.title, i.severity, i.status, s.name as service, i.started_at
		FROM incidents i
		LEFT JOIN services s ON i.service_id = s.id
		WHERE i.status != 'resolved'
		ORDER BY i.started_at DESC
	`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to query incidents: %v", err))
		return
	}
	defer rows.Close()

	var incidents []map[string]interface{}
	for rows.Next() {
		var id, title, severity, status, service string
		var startedAt time.Time

		if err := rows.Scan(&id, &title, &severity, &status, &service, &startedAt); err != nil {
			continue
		}

		incidents = append(incidents, map[string]interface{}{
			"id":         id,
			"title":      title,
			"severity":   severity,
			"status":     status,
			"service":    service,
			"started_at": startedAt,
		})
	}

	if incidents == nil {
		incidents = make([]map[string]interface{}, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incidents)
}

func (s *Server) createIncidentHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Severity    string `json:"severity"`
		Service     string `json:"service"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("Invalid request body: %v", err))
		return
	}

	// Validate required fields
	if req.Title == "" {
		respondError(w, http.StatusBadRequest, "Title is required")
		return
	}
	if req.Severity == "" {
		respondError(w, http.StatusBadRequest, "Severity is required")
		return
	}
	if req.Service == "" {
		respondError(w, http.StatusBadRequest, "Service is required")
		return
	}

	// Get or create service
	var serviceID string
	err := s.db.QueryRow(`
		INSERT INTO services (name, status) VALUES ($1, 'degraded')
		ON CONFLICT (name) DO UPDATE SET status = 'degraded'
		RETURNING id
	`, req.Service).Scan(&serviceID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create service: %v", err))
		return
	}

	// Create incident
	var incidentID string
	err = s.db.QueryRow(`
		INSERT INTO incidents (title, description, severity, status, service_id)
		VALUES ($1, $2, $3, 'open', $4)
		RETURNING id
	`, req.Title, req.Description, req.Severity, serviceID).Scan(&incidentID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create incident: %v", err))
		return
	}

	// Start correlation
	go func() {
		ctx := context.Background()
		_, _ = s.correlationEngine.CorrelateIncident(ctx, incidentID, req.Service, "default", time.Now())
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         incidentID,
		"title":      req.Title,
		"severity":   req.Severity,
		"status":     "open",
		"service":    req.Service,
		"created_at": time.Now(),
	})
}

func (s *Server) getIncidentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	var incident struct {
		ID          string     `json:"id"`
		Title       string     `json:"title"`
		Description string     `json:"description"`
		Severity    string     `json:"severity"`
		Status      string     `json:"status"`
		Service     string     `json:"service"`
		StartedAt   time.Time  `json:"started_at"`
		ResolvedAt  *time.Time `json:"resolved_at"`
	}

	err := s.db.QueryRow(`
		SELECT i.id, i.title, i.description, i.severity, i.status, s.name as service, i.started_at, i.resolved_at
		FROM incidents i
		LEFT JOIN services s ON i.service_id = s.id
		WHERE i.id = $1
	`, incidentID).Scan(
		&incident.ID, &incident.Title, &incident.Description, &incident.Severity,
		&incident.Status, &incident.Service, &incident.StartedAt, &incident.ResolvedAt,
	)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Incident not found")
		return
	} else if err != nil {
		log.Printf("Error fetching incident: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to fetch incident")
		return
	}

	respondJSON(w, http.StatusOK, incident)
}

func (s *Server) updateIncidentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	var req struct {
		Status   string `json:"status"`
		Severity string `json:"severity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	_, err := s.db.Exec(`
		UPDATE incidents 
		SET status = COALESCE(NULLIF($1, ''), status),
		    severity = COALESCE(NULLIF($2, ''), severity),
		    updated_at = NOW(),
		    resolved_at = CASE WHEN $1 = 'resolved' AND resolved_at IS NULL THEN NOW() ELSE resolved_at END
		WHERE id = $3
	`, req.Status, req.Severity, incidentID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update incident")
		return
	}

	// Fetch updated incident for broadcast
	var id, title, severity, status, serviceName string
	var startedAt time.Time
	var resolvedAt sql.NullTime
	err = s.db.QueryRow(`
		SELECT i.id, i.title, i.severity, i.status, COALESCE(s.name, 'unknown') as service, i.started_at, i.resolved_at
		FROM incidents i
		LEFT JOIN services s ON i.service_id = s.id
		WHERE i.id = $1
	`, incidentID).Scan(&id, &title, &severity, &status, &serviceName, &startedAt, &resolvedAt)
	
	if err == nil && s.realtimeServer != nil {
		incidentData := map[string]interface{}{
			"id":         id,
			"title":      title,
			"severity":   severity,
			"status":     status,
			"service":    serviceName,
			"started_at": startedAt,
		}
		if resolvedAt.Valid {
			incidentData["resolved_at"] = resolvedAt.Time
		}
		log.Printf("📡 Broadcasting incident update: id=%s, status=%s", id, status)
		s.realtimeServer.BroadcastIncidentUpdated(incidentData)
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (s *Server) getIncidentTimelineHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	timeline, err := s.timelineService.GetTimeline(context.Background(), incidentID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get timeline")
		return
	}

	respondJSON(w, http.StatusOK, timeline)
}

func (s *Server) getIncidentCorrelationsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	correlations, err := s.correlationEngine.GetCorrelations(context.Background(), incidentID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get correlations")
		return
	}

	respondJSON(w, http.StatusOK, correlations)
}

// getIncidentAnalysisHandler exposes high-level incident intelligence:
// - root_cause_summary
// - incident_confidence
// - correlation signals already saved by the engine
func (s *Server) getIncidentAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	incidentID := vars["id"]

	analysis, err := s.correlationEngine.GetIncidentAnalysis(context.Background(), incidentID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get incident analysis")
		return
	}

	respondJSON(w, http.StatusOK, analysis)
}

func (s *Server) getSLOsHandler(w http.ResponseWriter, r *http.Request) {
	slos, err := s.sloService.GetAllSLOs(context.Background())
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to retrieve SLOs: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, slos)
}

func (s *Server) createSLOHandler(w http.ResponseWriter, r *http.Request) {
	var slo services.SLO
	if err := json.NewDecoder(r.Body).Decode(&slo); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("Invalid SLO request body: %v", err))
		return
	}

	if err := s.sloService.CreateSLO(context.Background(), &slo); err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create SLO: %v", err))
		return
	}

	respondJSON(w, http.StatusCreated, slo)
}

func (s *Server) getSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	slo, err := s.sloService.GetSLO(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusNotFound, fmt.Sprintf("SLO not found: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, slo)
}

func (s *Server) updateSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	var slo services.SLO
	if err := json.NewDecoder(r.Body).Decode(&slo); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("Invalid SLO request body: %v", err))
		return
	}
	slo.ID = sloID

	if err := s.sloService.UpdateSLO(context.Background(), &slo); err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update SLO: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, slo)
}

func (s *Server) deleteSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	err := s.sloService.DeleteSLO(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete SLO: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) calculateSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	analysis, err := s.sloService.CalculateSLO(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to calculate SLO: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, analysis)
}

func (s *Server) getSLOHistoryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	history, err := s.sloService.GetSLOHistory(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to retrieve SLO history: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, history)
}

func (s *Server) getServiceAvailabilityHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation
	respondJSON(w, http.StatusOK, map[string]interface{}{"availability": 99.9})
}

func (s *Server) getServiceErrorRateHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation
	respondJSON(w, http.StatusOK, map[string]interface{}{"error_rate": 0.5})
}

func (s *Server) getServiceLatencyHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation
	respondJSON(w, http.StatusOK, map[string]interface{}{"latency_p99": 250})
}

func (s *Server) getPodsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	service := vars["service"]

	pods, err := s.k8sClient.GetPods(context.Background(), namespace, service)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get pods")
		return
	}

	respondJSON(w, http.StatusOK, pods)
}

func (s *Server) getDeploymentsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	service := vars["service"]

	deployments, err := s.k8sClient.GetDeployments(context.Background(), namespace, service)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get deployments")
		return
	}

	respondJSON(w, http.StatusOK, deployments)
}

func (s *Server) getK8sEventsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	service := vars["service"]

	events, err := s.k8sClient.GetEvents(context.Background(), namespace, service, time.Now().Add(-1*time.Hour))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get events")
		return
	}

	respondJSON(w, http.StatusOK, events)
}

func (s *Server) getErrorLogsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	service := vars["service"]

	logs, err := s.lokiClient.GetErrorLogs(context.Background(), service, time.Now().Add(-15*time.Minute), 100)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get logs")
		return
	}

	respondJSON(w, http.StatusOK, logs)
}

func (s *Server) searchLogsHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation
	respondJSON(w, http.StatusOK, []map[string]interface{}{})
}

func (s *Server) getUsersHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation
	respondJSON(w, http.StatusOK, []map[string]interface{}{})
}

func (s *Server) getServicesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id, name, status FROM services ORDER BY name`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get services")
		return
	}
	defer rows.Close()

	var services []map[string]interface{}
	for rows.Next() {
		var id, name, status string
		if err := rows.Scan(&id, &name, &status); err != nil {
			continue
		}
		services = append(services, map[string]interface{}{
			"id":     id,
			"name":   name,
			"status": status,
		})
	}

	respondJSON(w, http.StatusOK, services)
}

// Helpers
func respondJSON(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

// respondError writes a standardized error response with timestamp and status code
func respondError(w http.ResponseWriter, code int, message string) {
	respondJSON(w, code, map[string]interface{}{
		"status":    "error",
		"code":      code,
		"error":     message,
		"timestamp": time.Now().UTC(),
	})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvStrict - HARDENED: Requires env variable to be set, fails if missing
func getEnvStrict(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	log.Fatalf("🔴 CRITICAL: Environment variable '%s' is required but not set!", key)
	return "" // unreachable
}
