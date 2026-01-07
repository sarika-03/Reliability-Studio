package clients

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type KubernetesClient struct {
	clientset *kubernetes.Clientset
}

type PodStatus struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Status    string            `json:"status"`
	Restarts  int32             `json:"restarts"`
	Age       string            `json:"age"`
	Labels    map[string]string `json:"labels"`
}

type K8sEvent struct {
	Type      string    `json:"type"`
	Reason    string    `json:"reason"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Object    string    `json:"object"`
}

func NewKubernetesClient() (*KubernetesClient, error) {
	var config *rest.Config
	var err error
	kubeconfigPath := "" // Use default logic

	if kubeconfigPath != "" {
		// Use kubeconfig file
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	} else {
		// Use in-cluster config
		config, err = rest.InClusterConfig()
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	return &KubernetesClient{clientset: clientset}, nil
}

// GetFailedPods returns all pods that are not in Running state
func (k *KubernetesClient) GetFailedPods(ctx context.Context, namespace string) ([]PodStatus, error) {
	if namespace == "" {
		namespace = corev1.NamespaceAll
	}

	pods, err := k.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	var failedPods []PodStatus

	for _, pod := range pods.Items {
		status := string(pod.Status.Phase)

		// Count restarts
		var totalRestarts int32
		for _, containerStatus := range pod.Status.ContainerStatuses {
			totalRestarts += containerStatus.RestartCount
		}

		// Check if pod is not healthy
		if status != "Running" || totalRestarts > 3 {
			age := time.Since(pod.CreationTimestamp.Time)

			failedPods = append(failedPods, PodStatus{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    status,
				Restarts:  totalRestarts,
				Age:       formatAge(age),
				Labels:    pod.Labels,
			})
		}
	}

	return failedPods, nil
}

// GetRecentEvents returns recent events from Kubernetes
func (k *KubernetesClient) GetRecentEvents(ctx context.Context, namespace string, since time.Duration) ([]K8sEvent, error) {
	if namespace == "" {
		namespace = corev1.NamespaceAll
	}

	events, err := k.clientset.CoreV1().Events(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	var recentEvents []K8sEvent
	cutoff := time.Now().Add(-since)

	for _, event := range events.Items {
		if event.LastTimestamp.Time.After(cutoff) {
			recentEvents = append(recentEvents, K8sEvent{
				Type:      event.Type,
				Reason:    event.Reason,
				Message:   event.Message,
				Timestamp: event.LastTimestamp.Time,
				Object:    fmt.Sprintf("%s/%s", event.InvolvedObject.Kind, event.InvolvedObject.Name),
			})
		}
	}

	return recentEvents, nil
}

// GetPodsByLabel returns pods matching specific labels
func (k *KubernetesClient) GetPodsByLabel(ctx context.Context, namespace string, labels map[string]string) ([]PodStatus, error) {
	if namespace == "" {
		namespace = corev1.NamespaceAll
	}

	labelSelector := metav1.FormatLabelSelector(&metav1.LabelSelector{
		MatchLabels: labels,
	})

	pods, err := k.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	var podStatuses []PodStatus

	for _, pod := range pods.Items {
		var totalRestarts int32
		for _, containerStatus := range pod.Status.ContainerStatuses {
			totalRestarts += containerStatus.RestartCount
		}

		age := time.Since(pod.CreationTimestamp.Time)

		podStatuses = append(podStatuses, PodStatus{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    string(pod.Status.Phase),
			Restarts:  totalRestarts,
			Age:       formatAge(age),
			Labels:    pod.Labels,
		})
	}

	return podStatuses, nil
}

// GetPodLogs returns logs from a specific pod
func (k *KubernetesClient) GetPodLogs(ctx context.Context, namespace, podName string, tailLines int64) (string, error) {
	podLogOpts := corev1.PodLogOptions{
		TailLines: &tailLines,
	}

	req := k.clientset.CoreV1().Pods(namespace).GetLogs(podName, &podLogOpts)
	logs, err := req.Stream(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get pod logs: %w", err)
	}
	defer logs.Close()

	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, logs)
	if err != nil {
		return "", fmt.Errorf("failed to read logs: %w", err)
	}

	return buf.String(), nil
}

// GetClusterHealth returns overall cluster health metrics
func (k *KubernetesClient) GetClusterHealth(ctx context.Context) (map[string]interface{}, error) {
	nodes, err := k.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	pods, err := k.clientset.CoreV1().Pods(corev1.NamespaceAll).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	// Count pod states
	var runningPods, failedPods, pendingPods int
	for _, pod := range pods.Items {
		switch pod.Status.Phase {
		case corev1.PodRunning:
			runningPods++
		case corev1.PodFailed:
			failedPods++
		case corev1.PodPending:
			pendingPods++
		}
	}

	// Count node states
	var readyNodes, notReadyNodes int
	for _, node := range nodes.Items {
		for _, condition := range node.Status.Conditions {
			if condition.Type == corev1.NodeReady {
				if condition.Status == corev1.ConditionTrue {
					readyNodes++
				} else {
					notReadyNodes++
				}
				break
			}
		}
	}

	return map[string]interface{}{
		"nodes": map[string]int{
			"total":    len(nodes.Items),
			"ready":    readyNodes,
			"notReady": notReadyNodes,
		},
		"pods": map[string]int{
			"total":   len(pods.Items),
			"running": runningPods,
			"failed":  failedPods,
			"pending": pendingPods,
		},
	}, nil
}

func formatAge(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%ds", int(d.Seconds()))
	} else if d < time.Hour {
		return fmt.Sprintf("%dm", int(d.Minutes()))
	} else if d < 24*time.Hour {
		return fmt.Sprintf("%dh", int(d.Hours()))
	}
	return fmt.Sprintf("%dd", int(d.Hours()/24))
}

// Health checks if Kubernetes API is reachable
func (k *KubernetesClient) Health(ctx context.Context) error {
	// Try to get server version as a health check
	_, err := k.clientset.Discovery().ServerVersion()
	if err != nil {
		return fmt.Errorf("kubernetes API unhealthy: %w", err)
	}
	return nil
}

// GetPods returns pods for a service (implementation for correlation engine)
func (k *KubernetesClient) GetPods(ctx context.Context, namespace, service string) ([]PodStatus, error) {
	// Use label selector to find pods for the service
	labels := map[string]string{"app": service}
	return k.GetPodsByLabel(ctx, namespace, labels)
}

// GetDeployments returns deployments for a service
func (k *KubernetesClient) GetDeployments(ctx context.Context, namespace, service string) (interface{}, error) {
	deployments, err := k.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", service),
	})
	return deployments, err
}

// GetEvents returns recent events for a service
func (k *KubernetesClient) GetEvents(ctx context.Context, namespace, service string, since time.Time) ([]K8sEvent, error) {
	return k.GetRecentEvents(ctx, namespace, time.Since(since))
}
