package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	httpRequests = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total HTTP requests",
		},
		[]string{"path"},
	)
)

func main() {
	prometheus.MustRegister(httpRequests)

	http.Handle("/metrics", promhttp.Handler())

	http.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
		httpRequests.WithLabelValues("/slow").Inc()
		time.Sleep(time.Duration(rand.Intn(1000)) * time.Millisecond)
		log.Println("slow request processed")
		w.Write([]byte("slow ok"))
	})

	http.HandleFunc("/error", func(w http.ResponseWriter, r *http.Request) {
		httpRequests.WithLabelValues("/error").Inc()
		log.Println("error occurred")
		http.Error(w, "something broke", 500)
	})

	log.Println("Test app running on :5000")
	http.ListenAndServe(":5000", nil)
}
