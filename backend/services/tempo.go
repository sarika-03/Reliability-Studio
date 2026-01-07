package services

import (
	"io"
	"net/http"
)

func GetTraces() string {
	resp, err := http.Get("http://tempo:3200/api/search")
	if err != nil {
		return err.Error()
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}
