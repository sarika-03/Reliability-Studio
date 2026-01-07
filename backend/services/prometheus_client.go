package services

import (
	"context"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"io"
	"net/http"
	"net/url"
	"time"
)

type PrometheusClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger
}

func NewPrometheusClient() *PrometheusClient {
	return &PrometheusClient{
		baseURL: "http://prometheus:9090",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: zap.L(),
	}
}

type PrometheusResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string `json:"resultType"`
		Result     []struct {
			Metric map[string]string `json:"metric"`
			Value  []interface{}     `json:"value"`
		} `json:"result"`
	} `json:"data"`
}

// Query executes a PromQL query
func (p *PrometheusClient) Query(ctx context.Context, query string) (*PrometheusResponse, error) {
	queryURL := fmt.Sprintf("%s/api/v1/query", p.baseURL)

	params := url.Values{}
	params.Add("query", query)
	params.Add("time", fmt.Sprintf("%d", time.Now().Unix()))

	fullURL := fmt.Sprintf("%s?%s", queryURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		p.logger.Error("Failed to create request", zap.Error(err))
		return nil, err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		p.logger.Error("Failed to execute query", zap.String("query", query), zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		p.logger.Error("Failed to read response", zap.Error(err))
		return nil, err
	}

	var promResp PrometheusResponse
	if err := json.Unmarshal(body, &promResp); err != nil {
		p.logger.Error("Failed to parse response", zap.Error(err), zap.String("body", string(body)))
		return nil, err
	}

	return &promResp, nil
}

// QueryRange executes a range query
func (p *PrometheusClient) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*PrometheusResponse, error) {
	queryURL := fmt.Sprintf("%s/api/v1/query_range", p.baseURL)

	params := url.Values{}
	params.Add("query", query)
	params.Add("start", fmt.Sprintf("%d", start.Unix()))
	params.Add("end", fmt.Sprintf("%d", end.Unix()))
	params.Add("step", fmt.Sprintf("%ds", int(step.Seconds())))

	fullURL := fmt.Sprintf("%s?%s", queryURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		p.logger.Error("Failed to execute range query", zap.String("query", query), zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var promResp PrometheusResponse
	if err := json.Unmarshal(body, &promResp); err != nil {
		p.logger.Error("Failed to parse range response", zap.Error(err))
		return nil, err
	}

	return &promResp, nil
}

// GetErrorRate calculates the error rate for a service
func (p *PrometheusClient) GetErrorRate(ctx context.Context, service string) (float64, error) {
	query := fmt.Sprintf(`
        sum(rate(http_requests_total{service="%s",status=~"5.."}[5m]))
        /
        sum(rate(http_requests_total{service="%s"}[5m]))
    `, service, service)

	resp, err := p.Query(ctx, query)
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	value := resp.Data.Result[0].Value[1]
	if strVal, ok := value.(string); ok {
		var rate float64
		fmt.Sscanf(strVal, "%f", &rate)
		return rate * 100, nil // Convert to percentage
	}

	return 0, nil
}

// GetLatency calculates the p95 latency for a service
func (p *PrometheusClient) GetLatency(ctx context.Context, service string) (float64, error) {
	query := fmt.Sprintf(`
        histogram_quantile(0.95, 
            sum(rate(http_request_duration_seconds_bucket{service="%s"}[5m])) by (le)
        )
    `, service)

	resp, err := p.Query(ctx, query)
	if err != nil {
		return 0, err
	}

	if len(resp.Data.Result) == 0 {
		return 0, nil
	}

	value := resp.Data.Result[0].Value[1]
	if strVal, ok := value.(string); ok {
		var latency float64
		fmt.Sscanf(strVal, "%f", &latency)
		return latency * 1000, nil // Convert to milliseconds
	}

	return 0, nil
}
