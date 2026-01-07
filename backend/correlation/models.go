package correlation

import (
	"time"
)

type Event struct {
	Time    string `json:"time"`
	Source  string `json:"source"`
	Message string `json:"message"`
}

type ImpactSummary struct {
	SLOAffected bool    `json:"slo_affected"`
	ErrorRate   float64 `json:"error_rate"`
	BadPods     int     `json:"bad_pods"`
}

type Anomaly struct {
	Type   string            `json:"type"`
	Metric string            `json:"metric"`
	Value  any               `json:"value"`
	Labels map[string]string `json:"labels"`
}

type Impact struct {
	SLOAffected bool    `json:"slo_affected"`
	ErrorRate   float64 `json:"error_rate"`
	BadPods     int     `json:"bad_pods"`
}

type TimeRange struct {
	Start time.Time
	End   time.Time
}

type Evidence struct {
	Type      string
	Source    string
	Data      any
	Timestamp time.Time
}
