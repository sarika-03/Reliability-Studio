package services

import (
	"os/exec"
)

func GetCluster() string {
	out, _ := exec.Command("kubectl", "get", "pods", "-A", "-o", "json").Output()
	return string(out)
}
