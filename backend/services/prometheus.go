package services

import (
	"io"
	"net/http"
	"net/url"
)

func QueryMetrics(query string) string {
	url := "http://prometheus:9090/api/v1/query?query=" + url.QueryEscape(query)
	resp, err := http.Get(url)
	if err != nil {
		return err.Error()
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}
