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

	"github.com/sarikasharma2428-web/reliability-studio/clients"
	"github.com/sarikasharma2428-web/reliability-studio/correlation"
	"github.com/sarikasharma2428-web/reliability-studio/database"
	"github.com/sarikasharma2428-web/reliability-studio/middleware"
	"github.com/sarikasharma2428-web/reliability-studio/services"
)

type Server struct {
	db                *sql.DB
	promClient        *clients.PrometheusClient
	k8sClient         *clients.KubernetesClient
	lokiClient        *clients.LokiClient
	sloService        *services.SLOService
	timelineService   *services.TimelineService
	correlationEngine *correlation.CorrelationEngine
}

func main() {
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

	// Initialize services
	log.Println("⚙️  Initializing services...")
	sloService := services.NewSLOService(db, promClient)
	timelineService := services.NewTimelineService(db)
	correlationEngine := correlation.NewCorrelationEngine(db, promClient, k8sInterface, lokiClient)

	// Create server
	server := &Server{
		db:                db,
		promClient:        promClient,
		k8sClient:         k8sClient,
		lokiClient:        lokiClient,
		sloService:        sloService,
		timelineService:   timelineService,
		correlationEngine: correlationEngine,
	}

	// Setup router
	router := mux.NewRouter()

	// Setup middleware - Security first
	router.Use(middleware.Recovery)
	router.Use(middleware.Logging)
	router.Use(middleware.SecurityHeadersMiddleware)
	router.Use(middleware.RateLimitingMiddleware)

	// Public routes
	router.HandleFunc("/health", server.healthHandler).Methods("GET")
	router.HandleFunc("/api/auth/login", middleware.LoginHandler(db)).Methods("POST")
	router.HandleFunc("/api/auth/register", middleware.RegisterHandler(db)).Methods("POST")
	router.HandleFunc("/api/auth/refresh", middleware.RefreshTokenHandler()).Methods("POST")

	// Protected routes
	api := router.PathPrefix("/api").Subrouter()
	api.Use(middleware.Auth)

	// Incidents routes
	api.HandleFunc("/incidents", server.getIncidentsHandler).Methods("GET")
	api.HandleFunc("/incidents", server.createIncidentHandler).Methods("POST")
	api.HandleFunc("/incidents/{id}", server.getIncidentHandler).Methods("GET")
	api.HandleFunc("/incidents/{id}", server.updateIncidentHandler).Methods("PATCH")
	api.HandleFunc("/incidents/{id}/timeline", server.getIncidentTimelineHandler).Methods("GET")
	api.HandleFunc("/incidents/{id}/correlations", server.getIncidentCorrelationsHandler).Methods("GET")

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

	// Admin routes
	admin := api.PathPrefix("/admin").Subrouter()
	admin.Use(middleware.RequireRole("admin"))
	admin.HandleFunc("/users", server.getUsersHandler).Methods("GET")
	admin.HandleFunc("/services", server.getServicesHandler).Methods("GET")

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

		// Cancel background jobs
		cancelBackgroundJobs()

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
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Background jobs shutting down...")
			return
		case <-ticker.C:
			jobCtx := context.Background()
			log.Println("⏰ Running SLO calculations...")
			if err := s.sloService.CalculateAllSLOs(jobCtx); err != nil {
				log.Printf("Error calculating SLOs: %v", err)
			}
		}
	}
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

func (s *Server) createIncidentHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Severity    string `json:"severity"`
		Service     string `json:"service"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request")
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
		respondError(w, http.StatusInternalServerError, "Failed to create service")
		return
	}

	// Create incident
	var incidentID string
	err = s.db.QueryRow(`
		INSERT INTO incidents (title, description, severity, status, service_id)
		VALUES ($1, $2, $3, 'active', $4)
		RETURNING id
	`, req.Title, req.Description, req.Severity, serviceID).Scan(&incidentID)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create incident")
		return
	}

	// Start correlation
	go func() {
		ctx := context.Background()
		_, _ = s.correlationEngine.CorrelateIncident(ctx, incidentID, req.Service, "default", time.Now())
	}()

	respondJSON(w, http.StatusCreated, map[string]string{"id": incidentID})
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

func (s *Server) getSLOsHandler(w http.ResponseWriter, r *http.Request) {
	slos, err := s.sloService.GetAllSLOs(context.Background())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get SLOs")
		return
	}

	respondJSON(w, http.StatusOK, slos)
}

func (s *Server) createSLOHandler(w http.ResponseWriter, r *http.Request) {
	var slo services.SLO
	if err := json.NewDecoder(r.Body).Decode(&slo); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if err := s.sloService.CreateSLO(context.Background(), &slo); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create SLO")
		return
	}

	respondJSON(w, http.StatusCreated, slo)
}

func (s *Server) getSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	slo, err := s.sloService.GetSLO(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusNotFound, "SLO not found")
		return
	}

	respondJSON(w, http.StatusOK, slo)
}

func (s *Server) updateSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	var slo services.SLO
	if err := json.NewDecoder(r.Body).Decode(&slo); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	slo.ID = sloID

	if err := s.sloService.UpdateSLO(context.Background(), &slo); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update SLO")
		return
	}

	respondJSON(w, http.StatusOK, slo)
}

func (s *Server) deleteSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	err := s.sloService.DeleteSLO(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete SLO")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) calculateSLOHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	slo, err := s.sloService.CalculateSLO(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to calculate SLO")
		return
	}

	respondJSON(w, http.StatusOK, slo)
}

func (s *Server) getSLOHistoryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sloID := vars["id"]

	history, err := s.sloService.GetSLOHistory(context.Background(), sloID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get SLO history")
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
