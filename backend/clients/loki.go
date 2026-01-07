package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

type LokiClient struct {
	baseURL    string
	httpClient *http.Client
}

type LokiQueryResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string `json:"resultType"`
		Result     []struct {
			Stream map[string]string `json:"stream"`
			Values [][]string        `json:"values"`
		} `json:"result"`
	} `json:"data"`
}

type LogEntry struct {
	Timestamp time.Time         `json:"timestamp"`
	Message   string            `json:"message"`
	Level     string            `json:"level"`
	Service   string            `json:"service"`
	Labels    map[string]string `json:"labels"`
}

// NewLokiClient creates a new Loki client
func NewLokiClient(baseURL string) *LokiClient {
	return &LokiClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// QueryLogs executes a LogQL query
func (l *LokiClient) QueryLogs(ctx context.Context, query string, start, end time.Time, limit int) ([]LogEntry, error) {
	params := url.Values{}
	params.Add("query", query)
	params.Add("start", fmt.Sprintf("%d", start.UnixNano()))
	params.Add("end", fmt.Sprintf("%d", end.UnixNano()))
	params.Add("limit", fmt.Sprintf("%d", limit))
	params.Add("direction", "backward")

	url := fmt.Sprintf("%s/loki/api/v1/query_range?%s", l.baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := l.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result LokiQueryResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("loki query failed: %s", result.Status)
	}

	// Parse log entries
	var logs []LogEntry
	for _, stream := range result.Data.Result {
		for _, value := range stream.Values {
			if len(value) < 2 {
				continue
			}

			// FIXED: Parse timestamp (Unix nanoseconds, not RFC3339)
			nsec, err := strconv.ParseInt(value[0], 10, 64)
			if err != nil {
				continue
			}
			timestamp := time.Unix(0, nsec)

			// Parse log message
			message := value[1]

			// Extract level from labels or message
			level := "info"
			if lvl, ok := stream.Stream["level"]; ok {
				level = lvl
			}

			// Extract service
			service := ""
			if svc, ok := stream.Stream["app"]; ok {
				service = svc
			} else if svc, ok := stream.Stream["service"]; ok {
				service = svc
			}

			logs = append(logs, LogEntry{
				Timestamp: timestamp,
				Message:   message,
				Level:     level,
				Service:   service,
				Labels:    stream.Stream,
			})
		}
	}

	return logs, nil
}

// GetErrorLogs retrieves error logs for a service
func (l *LokiClient) GetErrorLogs(ctx context.Context, service string, since time.Time, limit int) ([]LogEntry, error) {
	query := fmt.Sprintf(`{app="%s"} |= "error" or |= "ERROR" or |= "exception" or |~ "(?i)error"`, service)

	end := time.Now()
	start := since
	if start.IsZero() {
		start = end.Add(-15 * time.Minute)
	}

	return l.QueryLogs(ctx, query, start, end, limit)
}

// GetServiceLogs retrieves all logs for a service
func (l *LokiClient) GetServiceLogs(ctx context.Context, service string, since time.Time, limit int) ([]LogEntry, error) {
	query := fmt.Sprintf(`{app="%s"}`, service)

	end := time.Now()
	start := since
	if start.IsZero() {
		start = end.Add(-15 * time.Minute)
	}

	return l.QueryLogs(ctx, query, start, end, limit)
}

// SearchLogs searches for specific text in logs
func (l *LokiClient) SearchLogs(ctx context.Context, service, searchText string, since time.Time, limit int) ([]LogEntry, error) {
	query := fmt.Sprintf(`{app="%s"} |= "%s"`, service, searchText)

	end := time.Now()
	start := since
	if start.IsZero() {
		start = end.Add(-1 * time.Hour)
	}

	return l.QueryLogs(ctx, query, start, end, limit)
}

// GetLogStats gets log statistics for a service
func (l *LokiClient) GetLogStats(ctx context.Context, service string, window time.Duration) (map[string]int, error) {
	end := time.Now()
	start := end.Add(-window)
	_ = start // Keep it for now or remove if not needed by the loop

	// Query for different log levels
	levels := []string{"error", "warn", "info", "debug"}
	stats := make(map[string]int)

	for _, level := range levels {
		query := fmt.Sprintf(`count_over_time({app="%s", level="%s"}[%s])`, service, level, formatDuration(window))

		params := url.Values{}
		params.Add("query", query)
		params.Add("time", fmt.Sprintf("%d", end.Unix()))

		url := fmt.Sprintf("%s/loki/api/v1/query?%s", l.baseURL, params.Encode())

		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			continue
		}

		resp, err := l.httpClient.Do(req)
		if err != nil {
			continue
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var result LokiQueryResponse
		if err := json.Unmarshal(body, &result); err != nil {
			continue
		}

		if len(result.Data.Result) > 0 && len(result.Data.Result[0].Values) > 0 {
			// Count logs (simplified)
			stats[level] = len(result.Data.Result[0].Values)
		}
	}

	return stats, nil
}

// DetectLogPatterns detects common error patterns in logs
func (l *LokiClient) DetectLogPatterns(ctx context.Context, service string, since time.Time) (map[string]int, error) {
	errorLogs, err := l.GetErrorLogs(ctx, service, since, 1000)
	if err != nil {
		return nil, err
	}

	// Group similar errors
	patterns := make(map[string]int)
	for _, log := range errorLogs {
		// Extract error pattern (first 100 chars)
		pattern := log.Message
		if len(pattern) > 100 {
			pattern = pattern[:100]
		}
		patterns[pattern]++
	}

	return patterns, nil
}

// GetRecentErrors gets recent error logs with context
func (l *LokiClient) GetRecentErrors(ctx context.Context, service string, minutes int) ([]LogEntry, error) {
	since := time.Now().Add(-time.Duration(minutes) * time.Minute)
	return l.GetErrorLogs(ctx, service, since, 100)
}

// GetLogsByTimeRange gets logs within a specific time range
func (l *LokiClient) GetLogsByTimeRange(ctx context.Context, service string, start, end time.Time) ([]LogEntry, error) {
	query := fmt.Sprintf(`{app="%s"}`, service)
	return l.QueryLogs(ctx, query, start, end, 1000)
}

// GetCriticalLogs gets critical/fatal level logs
func (l *LokiClient) GetCriticalLogs(ctx context.Context, service string, since time.Time) ([]LogEntry, error) {
	query := fmt.Sprintf(`{app="%s"} |= "critical" or |= "CRITICAL" or |= "fatal" or |= "FATAL"`, service)

	end := time.Now()
	if since.IsZero() {
		since = end.Add(-1 * time.Hour)
	}

	return l.QueryLogs(ctx, query, since, end, 100)
}

// StreamLogs streams logs in real-time (WebSocket-like behavior)
func (l *LokiClient) StreamLogs(ctx context.Context, service string, callback func(LogEntry)) error {
	query := fmt.Sprintf(`{app="%s"}`, service)

	// Poll for new logs every 5 seconds
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	lastTimestamp := time.Now()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			logs, err := l.QueryLogs(ctx, query, lastTimestamp, time.Now(), 100)
			if err != nil {
				continue
			}

			for _, log := range logs {
				callback(log)
				if log.Timestamp.After(lastTimestamp) {
					lastTimestamp = log.Timestamp
				}
			}
		}
	}
}

// Health checks Loki health
func (l *LokiClient) Health(ctx context.Context) error {
	url := fmt.Sprintf("%s/ready", l.baseURL)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := l.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("loki unhealthy: status %d", resp.StatusCode)
	}

	return nil
}

// Helper function to format duration for LogQL queries
func formatDuration(d time.Duration) string {
	seconds := int(d.Seconds())
	minutes := int(d.Minutes())
	hours := int(d.Hours())

	if hours > 0 {
		return fmt.Sprintf("%dh", hours)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm", minutes)
	}
	return fmt.Sprintf("%ds", seconds)
}
