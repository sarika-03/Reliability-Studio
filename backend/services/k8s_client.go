package services

import (
	"context"
	"encoding/json"
	"go.uber.org/zap"
	"os/exec"
	"time"
)

type K8sClient struct {
	logger *zap.Logger
}

func NewK8sClient() *K8sClient {
	return &K8sClient{
		logger: zap.L(),
	}
}

type PodInfo struct {
	Name      string    `json:"name"`
	Namespace string    `json:"namespace"`
	Status    string    `json:"status"`
	Restarts  int       `json:"restarts"`
	Age       time.Time `json:"age"`
}

type K8sStatus struct {
	TotalPods   int       `json:"total_pods"`
	RunningPods int       `json:"running_pods"`
	FailedPods  int       `json:"failed_pods"`
	PendingPods int       `json:"pending_pods"`
	Pods        []PodInfo `json:"pods"`
	LastCheck   time.Time `json:"last_check"`
}

// GetClusterStatus retrieves overall cluster health
func (k *K8sClient) GetClusterStatus(ctx context.Context) (*K8sStatus, error) {
	cmd := exec.CommandContext(ctx, "kubectl", "get", "pods", "-A", "-o", "json")
	output, err := cmd.Output()
	if err != nil {
		k.logger.Error("Failed to get cluster status", zap.Error(err))
		return nil, err
	}

	var response struct {
		Items []struct {
			Metadata struct {
				Name              string    `json:"name"`
				Namespace         string    `json:"namespace"`
				CreationTimestamp time.Time `json:"creationTimestamp"`
			} `json:"metadata"`
			Status struct {
				Phase             string `json:"phase"`
				ContainerStatuses []struct {
					RestartCount int `json:"restartCount"`
				} `json:"containerStatuses"`
			} `json:"status"`
		} `json:"items"`
	}

	if err := json.Unmarshal(output, &response); err != nil {
		k.logger.Error("Failed to parse cluster status", zap.Error(err))
		return nil, err
	}

	status := &K8sStatus{
		LastCheck: time.Now(),
		Pods:      make([]PodInfo, 0),
	}

	for _, item := range response.Items {
		restarts := 0
		if len(item.Status.ContainerStatuses) > 0 {
			restarts = item.Status.ContainerStatuses[0].RestartCount
		}

		pod := PodInfo{
			Name:      item.Metadata.Name,
			Namespace: item.Metadata.Namespace,
			Status:    item.Status.Phase,
			Restarts:  restarts,
			Age:       item.Metadata.CreationTimestamp,
		}
		status.Pods = append(status.Pods, pod)
		status.TotalPods++

		switch item.Status.Phase {
		case "Running":
			status.RunningPods++
		case "Failed":
			status.FailedPods++
		case "Pending":
			status.PendingPods++
		}
	}

	return status, nil
}

// GetPodLogs retrieves logs for a specific pod
func (k *K8sClient) GetPodLogs(ctx context.Context, namespace, podName string, tailLines int) (string, error) {
	cmd := exec.CommandContext(ctx, "kubectl", "logs", podName, "-n", namespace, "--tail", string(rune(tailLines+'0')))
	output, err := cmd.Output()
	if err != nil {
		k.logger.Error("Failed to get pod logs",
			zap.String("pod", podName),
			zap.String("namespace", namespace),
			zap.Error(err))
		return "", err
	}
	return string(output), nil
}

// GetEvents retrieves recent cluster events
func (k *K8sClient) GetEvents(ctx context.Context, namespace string) ([]map[string]interface{}, error) {
	args := []string{"get", "events"}
	if namespace != "" {
		args = append(args, "-n", namespace)
	} else {
		args = append(args, "-A")
	}
	args = append(args, "-o", "json")

	cmd := exec.CommandContext(ctx, "kubectl", args...)
	output, err := cmd.Output()
	if err != nil {
		k.logger.Error("Failed to get events", zap.Error(err))
		return nil, err
	}

	var response struct {
		Items []map[string]interface{} `json:"items"`
	}

	if err := json.Unmarshal(output, &response); err != nil {
		k.logger.Error("Failed to parse events", zap.Error(err))
		return nil, err
	}

	return response.Items, nil
}
