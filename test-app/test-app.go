package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

var (
	requestCount int64
	slowCount    int64
	errorCount   int64
	totalLatency float64
	mu           sync.Mutex
	startTime    = time.Now()
)

func recordMetric(path string, latency time.Duration, isError bool) {
	atomic.AddInt64(&requestCount, 1)
	if path == "/slow" {
		atomic.AddInt64(&slowCount, 1)
	}
	if isError {
		atomic.AddInt64(&errorCount, 1)
	}
	mu.Lock()
	totalLatency += latency.Seconds()
	mu.Unlock()
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	uptime := time.Since(startTime).Seconds()
	fmt.Fprintf(w, "# HELP http_requests_total Total HTTP requests\n")
	fmt.Fprintf(w, "# TYPE http_requests_total counter\n")
	fmt.Fprintf(w, "http_requests_total{path=\"/slow\",method=\"GET\"} %d\n", atomic.LoadInt64(&slowCount))
	fmt.Fprintf(w, "http_requests_total{path=\"/error\",method=\"GET\"} %d\n", atomic.LoadInt64(&errorCount))
	fmt.Fprintf(w, "\n# HELP http_request_duration_seconds HTTP request latency\n")
	fmt.Fprintf(w, "# TYPE http_request_duration_seconds histogram\n")
	mu.Lock()
	avgLatency := totalLatency / math.Max(1, float64(atomic.LoadInt64(&requestCount)))
	mu.Unlock()
	fmt.Fprintf(w, "http_request_duration_seconds_sum %f\n", totalLatency)
	fmt.Fprintf(w, "http_request_duration_seconds_count %d\n", atomic.LoadInt64(&requestCount))
	fmt.Fprintf(w, "\n# HELP test_app_uptime_seconds Application uptime\n")
	fmt.Fprintf(w, "# TYPE test_app_uptime_seconds gauge\n")
	fmt.Fprintf(w, "test_app_uptime_seconds %f\n", uptime)
	fmt.Fprintf(w, "\n# HELP test_app_avg_latency_seconds Average request latency\n")
	fmt.Fprintf(w, "# TYPE test_app_avg_latency_seconds gauge\n")
	fmt.Fprintf(w, "test_app_avg_latency_seconds %f\n", avgLatency)
}

func initTracer() {
	ctx := context.Background()

	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint("tempo:4317"),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		log.Fatal(err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("test-app"),
		)),
	)

	otel.SetTracerProvider(tp)
}

func main() {
	initTracer()
	http.HandleFunc("/metrics", metricsHandler)

	http.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
		tracer := otel.Tracer("test-app")
		_, span := tracer.Start(r.Context(), "GET /slow")
		defer span.End()

		start := time.Now()
		sleep := time.Duration(rand.Intn(1000)) * time.Millisecond
		time.Sleep(sleep)
		latency := time.Since(start)
		recordMetric("/slow", latency, false)
		log.Printf("slow request processed (latency: %v)", latency)
		w.Write([]byte("slow ok"))
	})

	http.HandleFunc("/error", func(w http.ResponseWriter, r *http.Request) {
		tracer := otel.Tracer("test-app")
		_, span := tracer.Start(r.Context(), "GET /error")
		defer span.End()

		start := time.Now()
		latency := time.Since(start)
		recordMetric("/error", latency, true)
		log.Println("error occurred")
		http.Error(w, "something broke", 500)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		tracer := otel.Tracer("test-app")
		_, span := tracer.Start(r.Context(), "GET /health")
		defer span.End()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "uptime": time.Since(startTime).String()})
	})

	// Background traffic generator
	go func() {
		time.Sleep(2 * time.Second) // wait for app to start
		client := &http.Client{Timeout: 5 * time.Second}
		for {
			// call /slow mostly
			resp, err := client.Get("http://localhost:5000/slow")
			if err != nil {
				log.Printf("self-call error: %v", err)
			} else {
				resp.Body.Close()
			}
			// occasionally call /error
			if rand.Intn(10) == 0 {
				resp, err := client.Get("http://localhost:5000/error")
				if err != nil {
					log.Printf("self-call error: %v", err)
				} else {
					resp.Body.Close()
				}
			}
			time.Sleep(2 * time.Second)
		}
	}()

	log.Println("Test app running on :5000")
	http.ListenAndServe(":5000", nil)
}
