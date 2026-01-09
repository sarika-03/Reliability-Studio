package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/sarika-03/Reliability-Studio/clients"
)

// StructuredLogger provides structured logging with Loki integration
type StructuredLogger struct {
	lokiClient  *clients.LokiClient
	serviceName string
	localLogsOnly bool // If true, don't push to Loki (for testing)
}

// LogLevel represents the log level
type LogLevel string

const (
	DEBUG LogLevel = "debug"
	INFO  LogLevel = "info"
	WARN  LogLevel = "warn"
	ERROR LogLevel = "error"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp   time.Time              `json:"timestamp"`
	Level       LogLevel               `json:"level"`
	Message     string                 `json:"message"`
	Service     string                 `json:"service"`
	TraceID     string                 `json:"trace_id,omitempty"`
	UserID      string                 `json:"user_id,omitempty"`
	Endpoint    string                 `json:"endpoint,omitempty"`
	Error       string                 `json:"error,omitempty"`
	ErrorType   string                 `json:"error_type,omitempty"`
	StackTrace  string                 `json:"stack_trace,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// NewStructuredLogger creates a new structured logger
func NewStructuredLogger(lokiClient *clients.LokiClient, serviceName string) *StructuredLogger {
	return &StructuredLogger{
		lokiClient:  lokiClient,
		serviceName: serviceName,
		localLogsOnly: lokiClient == nil,
	}
}

// Info logs an info message
func (sl *StructuredLogger) Info(ctx context.Context, message string, metadata ...map[string]interface{}) {
	sl.log(ctx, INFO, message, nil, metadata...)
}

// Warn logs a warning message
func (sl *StructuredLogger) Warn(ctx context.Context, message string, metadata ...map[string]interface{}) {
	sl.log(ctx, WARN, message, nil, metadata...)
}

// Error logs an error message with error details
func (sl *StructuredLogger) Error(ctx context.Context, message string, err error, metadata ...map[string]interface{}) {
	sl.log(ctx, ERROR, message, err, metadata...)
}

// Debug logs a debug message
func (sl *StructuredLogger) Debug(ctx context.Context, message string, metadata ...map[string]interface{}) {
	sl.log(ctx, DEBUG, message, nil, metadata...)
}

// log is the internal logging method
func (sl *StructuredLogger) log(ctx context.Context, level LogLevel, message string, err error, metadata ...map[string]interface{}) {
	// Build metadata map
	var meta map[string]interface{}
	if len(metadata) > 0 {
		meta = metadata[0]
	} else {
		meta = make(map[string]interface{})
	}

	// Get trace ID from context
	traceID := ""
	if tid := ctx.Value("trace-id"); tid != nil {
		traceID = tid.(string)
	}

	// Get user ID from context
	userID := ""
	if uid := ctx.Value("user-id"); uid != nil {
		userID = uid.(string)
	}

	// Build log entry
	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Message:   message,
		Service:   sl.serviceName,
		TraceID:   traceID,
		UserID:    userID,
		Metadata:  meta,
	}

	// Add error details if present
	if err != nil {
		entry.Error = err.Error()
		entry.ErrorType = fmt.Sprintf("%T", err)
	}

	// Log locally
	sl.logLocal(entry)

	// Push to Loki if available
	if !sl.localLogsOnly && sl.lokiClient != nil {
		go sl.pushToLoki(ctx, entry)
	}
}

// logLocal logs to stdout
func (sl *StructuredLogger) logLocal(entry LogEntry) {
	// Format as JSON for easy parsing
	data, _ := json.Marshal(entry)
	
	levelStr := string(entry.Level)
	log.Printf("[%s] %s | %s", levelStr, entry.Message, string(data))
}

// pushToLoki pushes the log entry to Loki
func (sl *StructuredLogger) pushToLoki(ctx context.Context, entry LogEntry) {
	if sl.lokiClient == nil {
		return
	}

	// Convert entry to JSON for message
	entryJSON, _ := json.Marshal(entry)
	message := string(entryJSON)

	// Build labels
	labels := map[string]string{
		"service": entry.Service,
		"level":   string(entry.Level),
	}

	if entry.TraceID != "" {
		labels["trace_id"] = entry.TraceID
	}

	if entry.UserID != "" {
		labels["user_id"] = entry.UserID
	}

	if entry.ErrorType != "" {
		labels["error_type"] = entry.ErrorType
	}

	// Push to Loki
	if err := sl.lokiClient.PushLog(ctx, entry.Service, string(entry.Level), message, labels); err != nil {
		log.Printf("⚠️  Failed to push log to Loki: %v", err)
	}
}

// LogWithMetrics logs a message with metrics metadata
func (sl *StructuredLogger) LogWithMetrics(ctx context.Context, message string, statusCode int, duration time.Duration) {
	meta := map[string]interface{}{
		"status_code": statusCode,
		"duration_ms": duration.Milliseconds(),
	}
	sl.Info(ctx, message, meta)
}

// LogDatabaseError logs database errors with context
func (sl *StructuredLogger) LogDatabaseError(ctx context.Context, operation string, err error, metadata ...map[string]interface{}) {
	meta := make(map[string]interface{})
	if len(metadata) > 0 {
		meta = metadata[0]
	}
	meta["operation"] = operation
	meta["error_type"] = "database"

	sl.Error(ctx, fmt.Sprintf("Database error during %s", operation), err, meta)
}

// LogServiceError logs service-level errors
func (sl *StructuredLogger) LogServiceError(ctx context.Context, service string, operation string, err error) {
	meta := map[string]interface{}{
		"service":   service,
		"operation": operation,
	}

	sl.Error(ctx, fmt.Sprintf("%s service error", service), err, meta)
}
