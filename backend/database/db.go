package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// DefaultQueryTimeout is the default timeout for database queries
const DefaultQueryTimeout = 30 * time.Second

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LoadConfigFromEnv loads database configuration from environment variables
func LoadConfigFromEnv() *Config {
	return &Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "reliability_studio"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}
}

// Connect establishes a connection to PostgreSQL
func Connect(config *Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool - FIXED: Optimized for better concurrency
	db.SetMaxOpenConns(50)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(15 * time.Minute)

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("✅ Connected to PostgreSQL database: %s@%s:%s/%s",
		config.User, config.Host, config.Port, config.DBName)

	return db, nil
}

// ContextWithTimeout returns a context with database query timeout
func ContextWithTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, DefaultQueryTimeout)
}

// InitSchema initializes the database schema
func InitSchema(db *sql.DB) error {
	schema := `
	-- Enable extensions
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	CREATE EXTENSION IF NOT EXISTS "pg_trgm";

	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email VARCHAR(255) UNIQUE NOT NULL,
		username VARCHAR(100) NOT NULL UNIQUE,
		password_hash VARCHAR(255) NOT NULL,
		roles JSONB DEFAULT '["viewer"]'::jsonb,
		is_first_login BOOLEAN DEFAULT true,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		last_login TIMESTAMP WITH TIME ZONE
	);

	-- Services table
	CREATE TABLE IF NOT EXISTS services (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) UNIQUE NOT NULL,
		description TEXT,
		owner_team VARCHAR(100),
		repository_url VARCHAR(500),
		status VARCHAR(20) DEFAULT 'healthy',
		labels JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- SLOs table
	CREATE TABLE IF NOT EXISTS slos (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		service_id UUID REFERENCES services(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		target_percentage DECIMAL(5,2) NOT NULL,
		window_days INTEGER NOT NULL DEFAULT 30,
		sli_type VARCHAR(50) NOT NULL,
		query TEXT NOT NULL,
		current_percentage DECIMAL(5,2),
		error_budget_remaining DECIMAL(5,2),
		last_calculated_at TIMESTAMP WITH TIME ZONE,
		status VARCHAR(20) DEFAULT 'healthy',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(service_id, name)
	);

	-- SLO History table
	CREATE TABLE IF NOT EXISTS slo_history (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		slo_id UUID REFERENCES slos(id) ON DELETE CASCADE,
		timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
		value DECIMAL(5,2) NOT NULL,
		error_budget DECIMAL(5,2) NOT NULL,
		burn_rate DECIMAL(5,2) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Incidents table
	CREATE TABLE IF NOT EXISTS incidents (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		title VARCHAR(500) NOT NULL,
		description TEXT,
		severity VARCHAR(20) NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved')),
		service_id UUID REFERENCES services(id) ON DELETE SET NULL,
		source VARCHAR(50) DEFAULT 'manual',
		alert_name VARCHAR(255),
		started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		acknowledged_at TIMESTAMP WITH TIME ZONE,
		resolved_at TIMESTAMP WITH TIME ZONE,
		closed_at TIMESTAMP WITH TIME ZONE,
		assigned_to UUID REFERENCES users(id),
		created_by UUID REFERENCES users(id),
		mttr_seconds INTEGER,
		impact_score INTEGER DEFAULT 0,
		affected_users INTEGER DEFAULT 0,
		root_cause TEXT,
		labels JSONB DEFAULT '{}'::jsonb,
		metadata JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Incident Services table
	CREATE TABLE IF NOT EXISTS incident_services (
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		service_id UUID REFERENCES services(id) ON DELETE CASCADE,
		impact_level VARCHAR(50),
		detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (incident_id, service_id)
	);

	-- Incident Tasks table
	CREATE TABLE IF NOT EXISTS incident_tasks (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		title VARCHAR(500) NOT NULL,
		description TEXT,
		status VARCHAR(50) DEFAULT 'open',
		assigned_to UUID REFERENCES users(id),
		created_by UUID REFERENCES users(id),
		due_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		completed_at TIMESTAMP WITH TIME ZONE
	);

	-- Correlation Rules table
	CREATE TABLE IF NOT EXISTS correlation_rules (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) UNIQUE NOT NULL,
		description TEXT,
		enabled BOOLEAN DEFAULT true,
		rule_type VARCHAR(50) NOT NULL,
		query TEXT NOT NULL,
		threshold_value DECIMAL(10,4),
		severity VARCHAR(50) NOT NULL,
		service_id UUID REFERENCES services(id),
		metadata JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Alerts table
	CREATE TABLE IF NOT EXISTS alerts (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		alert_name VARCHAR(255) NOT NULL,
		fingerprint VARCHAR(255) UNIQUE,
		status VARCHAR(50) NOT NULL,
		severity VARCHAR(50) NOT NULL,
		labels JSONB NOT NULL,
		annotations JSONB,
		starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
		ends_at TIMESTAMP WITH TIME ZONE,
		incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Metrics Cache table
	CREATE TABLE IF NOT EXISTS metrics_cache (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		metric_key VARCHAR(255) NOT NULL,
		service_id UUID REFERENCES services(id) ON DELETE CASCADE,
		timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
		value DECIMAL(20,6) NOT NULL,
		labels JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(metric_key, service_id, timestamp)
	);

	-- Investigation Hypotheses table
	CREATE TABLE IF NOT EXISTS investigation_hypotheses (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		title VARCHAR(500) NOT NULL,
		description TEXT,
		status VARCHAR(50) DEFAULT 'proposed',
		confidence DECIMAL(3,2) DEFAULT 0.5,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Investigation Steps table
	CREATE TABLE IF NOT EXISTS investigation_steps (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		hypothesis_id UUID REFERENCES investigation_hypotheses(id) ON DELETE SET NULL,
		title VARCHAR(500) NOT NULL,
		description TEXT,
		action VARCHAR(100) NOT NULL,
		status VARCHAR(50) DEFAULT 'pending',
		findings JSONB DEFAULT '{}'::jsonb,
		assigned_to UUID REFERENCES users(id),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		completed_at TIMESTAMP WITH TIME ZONE
	);

	-- Timeline events table
	-- NOTE: "timestamp" column is required by the incident timeline APIs.
	-- Older databases created before this change may be missing it, so we also
	-- run an ALTER TABLE further down to backfill the column.
	CREATE TABLE IF NOT EXISTS timeline_events (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		event_type VARCHAR(50) NOT NULL,
		-- When the event actually happened (separate from created_at)
		timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
		source VARCHAR(50) NOT NULL,
		title VARCHAR(500) NOT NULL,
		description TEXT,
		severity VARCHAR(20),
		metadata JSONB DEFAULT '{}'::jsonb,
		created_by UUID REFERENCES users(id),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Correlations table
	CREATE TABLE IF NOT EXISTS correlations (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		correlation_type VARCHAR(50) NOT NULL,
		source_type VARCHAR(50) NOT NULL,
		source_id VARCHAR(255) NOT NULL,
		confidence_score DECIMAL(3,2) NOT NULL,
		details JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Metrics snapshots table
	CREATE TABLE IF NOT EXISTS metrics_snapshots (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
		metric_name VARCHAR(255) NOT NULL,
		value DECIMAL(20,6) NOT NULL,
		labels JSONB DEFAULT '{}'::jsonb,
		timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Audit logs table - HARDENED: Track all security-relevant events
	CREATE TABLE IF NOT EXISTS audit_logs (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID REFERENCES users(id) ON DELETE SET NULL,
		username VARCHAR(255),
		action VARCHAR(100) NOT NULL,
		event_type VARCHAR(100) NOT NULL,
		description TEXT,
		client_ip VARCHAR(50),
		success BOOLEAN NOT NULL,
		metadata JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	-- Indexes for performance
	CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
	CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
	CREATE INDEX IF NOT EXISTS idx_incidents_service_id ON incidents(service_id);
	CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at DESC);
	CREATE INDEX IF NOT EXISTS idx_timeline_incident_id ON timeline_events(incident_id);
	CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON timeline_events(created_at DESC);
	-- Ensure the timestamp column exists for older databases that were created
	-- before it was added to the CREATE TABLE statement above.
	ALTER TABLE timeline_events
		ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
	CREATE INDEX IF NOT EXISTS idx_correlations_incident_id ON correlations(incident_id);
	CREATE INDEX IF NOT EXISTS idx_slos_service_id ON slos(service_id);
	CREATE INDEX IF NOT EXISTS idx_metrics_incident_id ON metrics_snapshots(incident_id);
	CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

	-- Full text search indexes
	CREATE INDEX IF NOT EXISTS idx_incidents_title_search ON incidents USING gin(to_tsvector('english', title));
	CREATE INDEX IF NOT EXISTS idx_timeline_description_search ON timeline_events USING gin(to_tsvector('english', description));
	`

	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	log.Println("✅ Database schema initialized successfully")
	return nil
}

// SeedDefaultData inserts default data for testing
func SeedDefaultData(db *sql.DB) error {
	// Insert default services
	services := []struct {
		name        string
		description string
		team        string
	}{
		{"frontend-web", "Main web frontend application", "platform"},
		{"api-gateway", "API Gateway service", "platform"},
		{"user-service", "User management microservice", "identity"},
		{"order-service", "Order processing service", "commerce"},
		{"payment-service", "Payment processing service", "commerce"},
	}

	var err error
	for _, svc := range services {
		_, err = db.Exec(`
			INSERT INTO services (name, description, owner_team, status)
			VALUES ($1, $2, $3, 'healthy')
			ON CONFLICT (name) DO NOTHING
		`, svc.name, svc.description, svc.team)

		if err != nil {
			return fmt.Errorf("failed to seed service %s: %w", svc.name, err)
		}
	}

	// Insert default admin user - FIXED: Use parameterized query and real bcrypt hash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash admin password: %w", err)
	}

	_, err = db.Exec(`
		INSERT INTO users (email, username, password_hash, roles)
		VALUES ($1, $2, $3, $4::jsonb)
		ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
	`, "admin@reliability.io", "admin", string(hashedPassword), `["admin", "editor", "viewer"]`)

	if err != nil {
		return fmt.Errorf("failed to seed admin user: %w", err)
	}

	// Insert default SLOs for the core demo services.
	// NOTE: These are wired to the exact metric shape produced by the test endpoints
	// and telemetry middleware: http_requests_total{service="<svc>",status="200"|"500"}.
	for _, svcName := range []string{"frontend-web", "api-gateway", "payment-service"} {
		var serviceID string
		err := db.QueryRow("SELECT id FROM services WHERE name = $1", svcName).Scan(&serviceID)
		if err == nil {
			availabilityQuery := fmt.Sprintf(
				"(1 - (rate(http_requests_total{service=\"%s\",status=~\"5..\"}[${WINDOW}]) / rate(http_requests_total{service=\"%s\"}[${WINDOW}]))) * 100",
				svcName, svcName,
			)
			_, _ = db.Exec(`
				INSERT INTO slos (service_id, name, description, target_percentage, window_days, sli_type, query)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (service_id, name) DO NOTHING
			`, serviceID, "Availability", "Percentage of successful requests", 99.9, 30, "availability", availabilityQuery)
		}
	}

	// Insert detection rules for automatic incident detection
	// These are tuned so the /api/test/fail endpoint (30% error rate over 60s)
	// will deterministically fire "High Error Rate" for the target service.
	detectionRules := []struct {
		name           string
		description    string
		ruleType       string
		query          string
		thresholdValue float64
		severity       string
	}{
		{
			name:           "High Error Rate",
			description:    "Detects error rate > 20% for any service (tuned for demo)",
			ruleType:       "threshold",
			// Uses the same metric shape as SLOs and /api/test/fail. Value is a ratio [0,1].
			query:          `rate(http_requests_total{service=~".+",status=~"5.."}[5m]) / rate(http_requests_total{service=~".+"}[5m])`,
			thresholdValue: 0.20,
			severity:       "critical",
		},
		{
			name:           "High Latency",
			description:    "Detects P95 latency > 1s",
			ruleType:       "threshold",
			query:          `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service=~".+"}[5m]))`,
			thresholdValue: 1.0,
			severity:       "high",
		},
	}

	for _, rule := range detectionRules {
		_, _ = db.Exec(`
			INSERT INTO correlation_rules (name, description, enabled, rule_type, query, threshold_value, severity)
			VALUES ($1, $2, true, $3, $4, $5, $6)
			ON CONFLICT (name) DO UPDATE 
			SET description = EXCLUDED.description,
			    rule_type = EXCLUDED.rule_type,
			    query = EXCLUDED.query,
			    threshold_value = EXCLUDED.threshold_value,
			    severity = EXCLUDED.severity,
			    enabled = true,
			    updated_at = NOW()
		`, rule.name, rule.description, rule.ruleType, rule.query, rule.thresholdValue, rule.severity)
	}

	log.Println("✅ Default data (services, users, SLOs, detection rules) seeded successfully")
	return nil
}

// HealthCheck performs a database health check
func HealthCheck(db *sql.DB) error {
	ctx, cancel := contextWithTimeout(15 * time.Second) // FIXED: Increased timeout
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	var result int
	if err := db.QueryRowContext(ctx, "SELECT 1").Scan(&result); err != nil {
		return fmt.Errorf("database query failed: %w", err)
	}

	return nil
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func contextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), timeout)
}
