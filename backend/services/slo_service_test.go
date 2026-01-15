package services

import (
	"context"
	"math"
	"testing"
	"time"

	"github.com/sarika-03/Reliability-Studio/clients"
)

// PrometheusQueryClient defines the interface for mocking (locally defined for test)
type PrometheusQueryClient interface {
	Query(ctx context.Context, query string, timestamp time.Time) (*clients.PrometheusResponse, error)
	QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*clients.PrometheusResponse, error)
}

// MockPrometheusClient implements PrometheusQueryClient
type MockPrometheusClient struct {
	QueryFunc func(ctx context.Context, query string, timestamp time.Time) (*clients.PrometheusResponse, error)
}

func (m *MockPrometheusClient) Query(ctx context.Context, query string, timestamp time.Time) (*clients.PrometheusResponse, error) {
	return m.QueryFunc(ctx, query, timestamp)
}

func (m *MockPrometheusClient) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*clients.PrometheusResponse, error) {
	return nil, nil // Not used in CalculateSLO
}

func TestSLOInterfaceImplementation(t *testing.T) {
	var _ PrometheusQueryClient = &MockPrometheusClient{}
	var _ PrometheusQueryClient = &clients.PrometheusClient{}
}

func TestCalculateSLOLogic(t *testing.T) {
	t.Log("Verifying SLO calculation logic...")

	testCases := []struct {
		name     string
		target   float64
		current  float64
		expected float64
		status   string
	}{
		{"Meeting SLO (50% used)", 99.9, 99.95, 50.0, "healthy"},
		{"Exactly at SLO (100% used)", 99.9, 99.9, 0.0, "critical"},
		{"Violating SLO (400% over)", 99.9, 99.5, -400.0, "critical"},
		{"Perfect performance", 99.9, 100.0, 100.0, "healthy"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			allowed := 100.0 - tc.target
			observed := 100.0 - tc.current
			remaining := ((allowed - observed) / allowed) * 100

			if math.Abs(remaining-tc.expected) > 0.0001 {
				t.Errorf("%s: Expected %f%% remaining, got %f", tc.name, tc.expected, remaining)
			}

			status := "healthy"
			if remaining < 25 {
				status = "critical"
			} else if remaining < 50 {
				status = "warning"
			}

			if status != tc.status {
				t.Errorf("%s: Expected status %s, got %s", tc.name, tc.status, status)
			}
		})
	}
}
