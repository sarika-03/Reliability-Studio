package analysis

import (
	"encoding/json"
	"strings"
)

type LogEvent struct {
	Time    string
	Message string
}

type LogResult struct {
	RootCause  string
	ErrorCount int
	Events     []LogEvent
}

func AnalyzeLogs(service string, raw string) LogResult {
	var parsed map[string]any
	_ = json.Unmarshal([]byte(raw), &parsed)

	streams := parsed["data"].(map[string]any)["result"].([]any)

	var events []LogEvent
	errorCount := 0
	rootCause := ""

	for _, s := range streams {
		values := s.(map[string]any)["values"].([]any)
		for _, v := range values {
			ts := v.([]any)[0].(string)
			msg := v.([]any)[1].(string)

			events = append(events, LogEvent{Time: ts, Message: msg})

			if strings.Contains(strings.ToLower(msg), "error") {
				errorCount++
				if rootCause == "" {
					rootCause = msg
				}
			}
		}
	}

	return LogResult{
		RootCause:  rootCause,
		ErrorCount: errorCount,
		Events:     events,
	}
}
