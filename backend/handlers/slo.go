package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/sarika-03/Reliability-Studio/services"
)

func GetSLOStatus(w http.ResponseWriter, r *http.Request) {
	query := `rate(http_requests_total[1m])`
	data := services.QueryMetrics(query)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"raw": data,
	})
}
