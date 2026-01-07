package analysis

import "encoding/json"

type K8sEvent struct {
	Time    string
	Message string
}

type K8sResult struct {
	BadPods int
	Events  []K8sEvent
}

func AnalyzeK8s(raw string) K8sResult {
	var parsed map[string]any
	_ = json.Unmarshal([]byte(raw), &parsed)

	items := parsed["items"].([]any)

	bad := 0
	var events []K8sEvent

	for _, i := range items {
		pod := i.(map[string]any)
		status := pod["status"].(map[string]any)
		phase := status["phase"].(string)

		if phase == "Failed" {
			bad++
			events = append(events, K8sEvent{
				Time:    status["startTime"].(string),
				Message: "Pod failed",
			})
		}
	}

	return K8sResult{
		BadPods: bad,
		Events:  events,
	}
}
