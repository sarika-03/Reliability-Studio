package services

import (
	"io"
	"net/http"
	"os"
)

// GetTraces queries Tempo for traces
// Uses TEMPO_URL environment variable, defaults to http://tempo:3200
func GetTraces() string {
	tempoURL := os.Getenv("TEMPO_URL")
	if tempoURL == "" {
		tempoURL = "http://tempo:3200"
	}
	
	resp, err := http.Get(tempoURL + "/api/search")
	if err != nil {
		return err.Error()
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}
