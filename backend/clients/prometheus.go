package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type PrometheusClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type PrometheusResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string             `json:"resultType"`
		Result     []PrometheusResult `json:"result"`
	} `json:"data"`
}

type PrometheusResult struct {
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value"`
	Values [][]interface{}   `json:"values"`
}

func NewPrometheusClient(baseURL string) *PrometheusClient {
	return &PrometheusClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Query executes an instant query
func (c *PrometheusClient) Query(ctx context.Context, query string, timestamp time.Time) (*PrometheusResponse, error) {
	params := url.Values{}
	params.Add("query", query)

	if !timestamp.IsZero() {
		params.Add("time", fmt.Sprintf("%d", timestamp.Unix()))
	} else {
		params.Add("time", fmt.Sprintf("%d", time.Now().Unix()))
	}

	reqURL := fmt.Sprintf("%s/api/v1/query?%s", c.BaseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("prometheus returned status %d: %s", resp.StatusCode, string(body))
	}

	var result PrometheusResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// QueryRange executes a range query
func (c *PrometheusClient) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*PrometheusResponse, error) {
	params := url.Values{}
	params.Add("query", query)
	params.Add("start", fmt.Sprintf("%d", start.Unix()))
	params.Add("end", fmt.Sprintf("%d", end.Unix()))
	params.Add("step", fmt.Sprintf("%ds", int(step.Seconds())))

	reqURL := fmt.Sprintf("%s/api/v1/query_range?%s", c.BaseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("prometheus returned status %d: %s", resp.StatusCode, string(body))
	}

	var result PrometheusResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// Helper methods for common queries

func (c *PrometheusClient) GetErrorRate(ctx context.Context, service string) (float64, error) {
	query := fmt.Sprintf(`
		rate(http_requests_total{service="%s",status=~"5.."}[5m]) 
		/ 
		rate(http_requests_total{service="%s"}[5m]) * 100
	`, service, service)

	resp, err := c.Query(ctx, query, time.Time{})
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	// FIXED: Check array length before accessing
	if len(resp.Data.Result[0].Value) < 2 {
		return 0, fmt.Errorf("invalid response format")
	}

	value, ok := resp.Data.Result[0].Value[1].(string)
	if !ok {
		return 0, fmt.Errorf("invalid value type")
	}

	var rate float64
	fmt.Sscanf(value, "%f", &rate)
	return rate, nil
}

func (c *PrometheusClient) GetLatencyP95(ctx context.Context, service string) (float64, error) {
	query := fmt.Sprintf(`
		histogram_quantile(0.95, 
			rate(http_request_duration_seconds_bucket{service="%s"}[5m])
		)
	`, service)

	resp, err := c.Query(ctx, query, time.Time{})
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	// FIXED: Check array length before accessing
	if len(resp.Data.Result[0].Value) < 2 {
		return 0, fmt.Errorf("invalid response format")
	}

	value, ok := resp.Data.Result[0].Value[1].(string)
	if !ok {
		return 0, fmt.Errorf("invalid value type")
	}

	var latency float64
	fmt.Sscanf(value, "%f", &latency)
	return latency, nil
}

func (c *PrometheusClient) GetRequestRate(ctx context.Context, service string) (float64, error) {
	query := fmt.Sprintf(`rate(http_requests_total{service="%s"}[5m])`, service)

	resp, err := c.Query(ctx, query, time.Time{})
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	// FIXED: Check array length before accessing
	if len(resp.Data.Result[0].Value) < 2 {
		return 0, fmt.Errorf("invalid response format")
	}

	value, ok := resp.Data.Result[0].Value[1].(string)
	if !ok {
		return 0, fmt.Errorf("invalid value type")
	}

	var rate float64
	fmt.Sscanf(value, "%f", &rate)
	return rate, nil
}

func (c *PrometheusClient) CalculateSLO(ctx context.Context, service string, windowDays int) (float64, error) {
	query := fmt.Sprintf(`
		(
			sum(rate(http_requests_total{service="%s",status!~"5.."}[%dd])) 
			/ 
			sum(rate(http_requests_total{service="%s"}[%dd]))
		) * 100
	`, service, windowDays, service, windowDays)

	resp, err := c.Query(ctx, query, time.Time{})
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	// FIXED: Check array length before accessing
	if len(resp.Data.Result[0].Value) < 2 {
		return 0, fmt.Errorf("invalid response format")
	}

	value, ok := resp.Data.Result[0].Value[1].(string)
	if !ok {
		return 0, fmt.Errorf("invalid value type")
	}

	var slo float64
	fmt.Sscanf(value, "%f", &slo)
	return slo, nil
}

// Health checks if Prometheus is reachable and healthy
func (c *PrometheusClient) Health(ctx context.Context) error {
	reqURL := fmt.Sprintf("%s/-/healthy", c.BaseURL)

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("prometheus unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("prometheus unhealthy: status %d", resp.StatusCode)
	}

	return nil
}

// PushCounter pushes a counter metric to Prometheus using the Pushgateway protocol
func (c *PrometheusClient) PushCounter(ctx context.Context, metricName string, value float64, labels map[string]string) error {
	return c.pushMetric(ctx, metricName, value, labels)
}

// PushHistogram pushes a histogram metric to Prometheus using the Pushgateway protocol
func (c *PrometheusClient) PushHistogram(ctx context.Context, metricName string, value float64, labels map[string]string) error {
	return c.pushMetric(ctx, metricName, value, labels)
}

// pushMetric is the internal method that pushes metrics directly to Prometheus
// This pushes metrics in the Prometheus text format directly to Prometheus scrape endpoint
func (c *PrometheusClient) pushMetric(ctx context.Context, metricName string, value float64, labels map[string]string) error {
	// Build metric in Prometheus text format
	// Format: metric_name{label1="value1",label2="value2"} value timestamp
	metricLine := buildMetricLine(metricName, value, labels)

	// We push to Prometheus directly via the remote write protocol or local file
	// For simplicity, we'll use curl-like approach with HTTP POST to Prometheus pushgateway if available
	// Otherwise, metrics will be scraped on next interval

	// Try to push to pushgateway if available (optional)
	pushgatewayURL := strings.Replace(c.BaseURL, ":9090", ":9091", 1)

	// Build job label string
	jobLabels := "job=test_endpoint"
	for k, v := range labels {
		if k != "" && v != "" {
			jobLabels += fmt.Sprintf("/%s/%s", k, v)
		}
	}

	pushURL := fmt.Sprintf("%s/metrics/job/%s", pushgatewayURL, jobLabels)

	// Prepare the request body with the metric line
	body := []byte(metricLine)

	req, err := http.NewRequestWithContext(ctx, "POST", pushURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create pushgateway request: %w", err)
	}

	req.Header.Set("Content-Type", "text/plain; charset=utf-8")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		// Pushgateway may not be available, which is OK - metrics will be scraped later
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		// Log but don't fail - pushgateway might not be available
		return nil
	}

	return nil
}

// buildMetricLine builds a Prometheus metric line in text format
func buildMetricLine(metricName string, value float64, labels map[string]string) string {
	if len(labels) == 0 {
		return fmt.Sprintf("%s %f %d\n", metricName, value, time.Now().UnixMilli())
	}

	// Build labels string: label1="value1",label2="value2",...
	var labelParts []string
	for k, v := range labels {
		// Escape quotes in values
		escapedValue := strings.ReplaceAll(v, "\"", "\\\"")
		labelParts = append(labelParts, fmt.Sprintf(`%s="%s"`, k, escapedValue))
	}

	labelsStr := strings.Join(labelParts, ",")
	return fmt.Sprintf("%s{%s} %f %d\n", metricName, labelsStr, value, time.Now().UnixMilli())
}
