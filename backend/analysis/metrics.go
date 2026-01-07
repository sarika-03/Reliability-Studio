package analysis

import "encoding/json"

type MetricResult struct {
	ErrorRate float64
	Latency   float64
}

func AnalyzeMetrics(raw string) MetricResult {
	var parsed map[string]any
	_ = json.Unmarshal([]byte(raw), &parsed)

	results := parsed["data"].(map[string]any)["result"].([]any)

	if len(results) == 0 {
		return MetricResult{}
	}

	val := results[0].(map[string]any)["value"].([]any)[1].(string)

	return MetricResult{
		ErrorRate: 0.0, // you can derive this with more queries later
		Latency:   parseFloat(val),
	}
}
