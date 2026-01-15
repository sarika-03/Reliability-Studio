package services

import (
	"context"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"os/exec"
	"time"
)

type K8sClient struct {
	logger *zap.Logger
}

func NewK8sClient(logger *zap.Logger) *K8sClient {
	if logger == nil {
		logger = zap.L()
	}
	return &K8sClient{
		logger: logger,
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
// RestartDeployment performs a rollout restart of a deployment
func (k *K8sClient) RestartDeployment(ctx context.Context, namespace, deploymentName string) error {
	cmd := exec.CommandContext(ctx, "kubectl", "rollout", "restart", "deployment", deploymentName, "-n", namespace)
	err := cmd.Run()
	if err != nil {
		k.logger.Error("Failed to restart deployment",
			zap.String("deployment", deploymentName),
			zap.String("namespace", namespace),
			zap.Error(err))
		return err
	}
	return nil
}

// ScaleDeployment scales a deployment to a specified number of replicas
func (k *K8sClient) ScaleDeployment(ctx context.Context, namespace, deploymentName string, replicas int) error {
	cmd := exec.CommandContext(ctx, "kubectl", "scale", "deployment", deploymentName, "--replicas", fmt.Sprintf("%d", replicas), "-n", namespace)
	err := cmd.Run()
	if err != nil {
		k.logger.Error("Failed to scale deployment",
			zap.String("deployment", deploymentName),
			zap.String("namespace", namespace),
			zap.Int("replicas", replicas),
			zap.Error(err))
		return err
	}
	return nil
}
