package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "embed"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

//go:embed schema.sql
var schemaSQL string

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

	// Verify connection with retry strategy
	var pingErr error
	maxRetries := 30
	for i := 0; i < maxRetries; i++ {
		pingErr = db.Ping()
		if pingErr == nil {
			log.Printf("✅ Connected to PostgreSQL database: %s@%s:%s/%s",
				config.User, config.Host, config.Port, config.DBName)
			return db, nil
		}
		
		log.Printf("Waiting for database (attempt %d/%d): %v", i+1, maxRetries, pingErr)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, pingErr)
}

// ContextWithTimeout returns a context with database query timeout
func ContextWithTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, DefaultQueryTimeout)
}

// InitSchema initializes the database schema
func InitSchema(db *sql.DB) error {
	if _, err := db.Exec(schemaSQL); err != nil {
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
