package analysis

import "encoding/json"

type TraceEvent struct {
	Time    string
	Message string
}

type TraceResult struct {
	Failures int
	Events   []TraceEvent
}

func AnalyzeTraces(raw string) TraceResult {
	var parsed map[string]any
	_ = json.Unmarshal([]byte(raw), &parsed)

	traces := parsed["traces"].([]any)

	failures := 0
	var events []TraceEvent

	for _, t := range traces {
		trace := t.(map[string]any)
		status := trace["status"].(string)
		time := trace["startTimeUnixNano"].(string)

		if status != "ok" {
			failures++
			events = append(events, TraceEvent{Time: time, Message: "Trace failure"})
		}
	}

	return TraceResult{
		Failures: failures,
		Events:   events,
	}
}
