package services

import (
	"context"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type LokiClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger
}

func NewLokiClient() *LokiClient {
	return &LokiClient{
		baseURL: "http://loki:3100",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: zap.L(),
	}
}

type LokiResponse struct {
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
	Line      string            `json:"line"`
	Labels    map[string]string `json:"labels"`
}

// Query executes a LogQL query
func (l *LokiClient) Query(ctx context.Context, query string, limit int) (*LokiResponse, error) {
	queryURL := fmt.Sprintf("%s/loki/api/v1/query", l.baseURL)

	params := url.Values{}
	params.Add("query", query)
	params.Add("limit", fmt.Sprintf("%d", limit))
	params.Add("time", fmt.Sprintf("%d", time.Now().UnixNano()))

	fullURL := fmt.Sprintf("%s?%s", queryURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		l.logger.Error("Failed to create request", zap.Error(err))
		return nil, err
	}

	resp, err := l.client.Do(req)
	if err != nil {
		l.logger.Error("Failed to execute query", zap.String("query", query), zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		l.logger.Error("Failed to read response", zap.Error(err))
		return nil, err
	}

	var lokiResp LokiResponse
	if err := json.Unmarshal(body, &lokiResp); err != nil {
		l.logger.Error("Failed to parse response", zap.Error(err), zap.String("body", string(body)))
		return nil, err
	}

	return &lokiResp, nil
}

// QueryRange executes a range query
func (l *LokiClient) QueryRange(ctx context.Context, query string, start, end time.Time, limit int) (*LokiResponse, error) {
	queryURL := fmt.Sprintf("%s/loki/api/v1/query_range", l.baseURL)

	params := url.Values{}
	params.Add("query", query)
	params.Add("start", fmt.Sprintf("%d", start.UnixNano()))
	params.Add("end", fmt.Sprintf("%d", end.UnixNano()))
	params.Add("limit", fmt.Sprintf("%d", limit))

	fullURL := fmt.Sprintf("%s?%s", queryURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := l.client.Do(req)
	if err != nil {
		l.logger.Error("Failed to execute range query", zap.String("query", query), zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var lokiResp LokiResponse
	if err := json.Unmarshal(body, &lokiResp); err != nil {
		l.logger.Error("Failed to parse range response", zap.Error(err))
		return nil, err
	}

	return &lokiResp, nil
}

// GetErrorLogs retrieves error logs for a service
func (l *LokiClient) GetErrorLogs(ctx context.Context, service string, duration time.Duration) ([]LogEntry, error) {
	query := fmt.Sprintf(`{service="%s"} |= "error" or "ERROR" or "Error"`, service)

	start := time.Now().Add(-duration)
	resp, err := l.QueryRange(ctx, query, start, time.Now(), 1000)
	if err != nil {
		return nil, err
	}

	var logs []LogEntry
	for _, result := range resp.Data.Result {
		for _, value := range result.Values {
			if len(value) < 2 {
				continue
			}

			// Parse timestamp (nanoseconds)
			var timestamp int64
			fmt.Sscanf(value[0], "%d", &timestamp)

			logs = append(logs, LogEntry{
				Timestamp: time.Unix(0, timestamp),
				Line:      value[1],
				Labels:    result.Stream,
			})
		}
	}

	return logs, nil
}

// CountErrorsByPattern counts errors matching a pattern
func (l *LokiClient) CountErrorsByPattern(ctx context.Context, service, pattern string, duration time.Duration) (int, error) {
	query := fmt.Sprintf(`count_over_time({service="%s"} |~ "%s" [%s])`, service, pattern, duration.String())

	resp, err := l.Query(ctx, query, 1)
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	if len(resp.Data.Result[0].Values) == 0 {
		return 0, nil
	}

	var count int
	fmt.Sscanf(resp.Data.Result[0].Values[0][1], "%d", &count)
	return count, nil
}

// DetectLogSpike detects sudden increases in log volume
func (l *LokiClient) DetectLogSpike(ctx context.Context, service string) (bool, error) {
	// Compare current rate to historical average
	currentQuery := fmt.Sprintf(`rate({service="%s"}[5m])`, service)
	historicalQuery := fmt.Sprintf(`rate({service="%s"}[1h])`, service)

	currentResp, err := l.Query(ctx, currentQuery, 1)
	if err != nil {
		return false, err
	}

	historicalResp, err := l.Query(ctx, historicalQuery, 1)
	if err != nil {
		return false, err
	}

	if len(currentResp.Data.Result) == 0 || len(historicalResp.Data.Result) == 0 {
		return false, nil
	}

	var currentRate, historicalRate float64
	if len(currentResp.Data.Result[0].Values) > 0 {
		fmt.Sscanf(currentResp.Data.Result[0].Values[0][1], "%f", &currentRate)
	}
	if len(historicalResp.Data.Result[0].Values) > 0 {
		fmt.Sscanf(historicalResp.Data.Result[0].Values[0][1], "%f", &historicalRate)
	}

	// Spike if current rate is 3x historical average
	return currentRate > (historicalRate * 3), nil
}

// FindRootCause analyzes logs to find potential root cause
func (l *LokiClient) FindRootCause(ctx context.Context, service string, duration time.Duration) (string, error) {
	errorLogs, err := l.GetErrorLogs(ctx, service, duration)
	if err != nil {
		return "", err
	}

	if len(errorLogs) == 0 {
		return "No errors found in logs", nil
	}

	// Simple pattern matching for common issues
	patterns := map[string]string{
		"connection refused":    "Service connection failure",
		"timeout":               "Request timeout",
		"out of memory":         "Memory exhaustion",
		"database":              "Database error",
		"authentication failed": "Authentication issue",
		"permission denied":     "Permission issue",
		"null pointer":          "Null pointer exception",
		"index out of bounds":   "Array index error",
	}

	errorCounts := make(map[string]int)
	for _, log := range errorLogs {
		logLower := strings.ToLower(log.Line)
		for pattern, description := range patterns {
			if strings.Contains(logLower, pattern) {
				errorCounts[description]++
			}
		}
	}

	// Return most common error pattern
	maxCount := 0
	rootCause := "Unknown error pattern"
	for description, count := range errorCounts {
		if count > maxCount {
			maxCount = count
			rootCause = description
		}
	}

	return fmt.Sprintf("%s (%d occurrences)", rootCause, maxCount), nil
}
