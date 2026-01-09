# Telemetry Verification Guide

## Overview
The Reliability Studio backend now generates real telemetry data that flows through:
1. **Prometheus** - Metrics (request counts, latency, errors)
2. **Loki** - Logs (structured application logs)

## What's Being Tracked

### Prometheus Metrics
- `http_requests_total` - Total HTTP requests by service, method, endpoint, status
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_error_total` - Failed requests by service and status code

### Loki Logs
- Application logs from all request processing
- Error logs with stack traces
- Structured logs with trace IDs for correlation

## Verifying Telemetry in Grafana

### 1. Check Prometheus Metrics

**Location:** Grafana → Explore → Data Source: Prometheus

**Query to see all metrics:**
```promql
{__name__=~"http_.*"}
```

**Query to see request rate:**
```promql
rate(http_requests_total[5m])
```

**Query to see error rate:**
```promql
rate(http_requests_error_total[5m])
```

**Query to see latency (95th percentile):**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

Expected results:
- Metrics should appear immediately when requests are made
- Sample telemetry is auto-generated every 30 seconds in the background
- Services include: api-gateway, user-service, payment-service, notification-service

### 2. Check Loki Logs

**Location:** Grafana → Explore → Data Source: Loki

**Query to see all logs:**
```logql
{}
```

**Query to see logs from a specific service:**
```logql
{service="user-service"}
```

**Query to see error logs:**
```logql
{level="error"}
```

**Query to see logs by trace ID:**
```logql
{trace_id="your-trace-id-here"}
```

Expected results:
- Logs should appear immediately after requests
- Each log contains: timestamp, level, message, service, trace_id
- Sample logs are auto-generated every 30 seconds

## Backend Telemetry Flow

### Request Telemetry
1. Client makes HTTP request to backend
2. Telemetry middleware intercepts the request
3. Request is processed
4. Middleware captures: status code, latency, method, path
5. Metrics pushed to Prometheus (counter + histogram)
6. Logs pushed to Loki (with trace ID)

### Sample Telemetry Generation
- Runs every 30 seconds in background
- Generates realistic metrics for development/testing
- Creates sample logs from different services
- Occasionally injects errors for testing

### Trace ID Correlation
- Each request gets a unique trace ID
- Trace ID is logged and can be used to correlate logs and metrics
- Extract trace ID from any request's response header or logs

## Testing the Telemetry

### Manual Request Test
```bash
curl -X POST http://localhost:9000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{
    "service": "test-service",
    "requests": 100,
    "duration_seconds": 10
  }'
```

Then check Prometheus and Loki for the generated metrics and logs.

### Check Backend Logs
Backend logs should show messages like:
```
📊 Metrics: POST /api/test/load -> 200 in 45ms (trace: abc123...)
📝 [info] POST /api/test/load -> 200 in 45ms (trace: abc123...)
📊 Sample telemetry generated
```

## Troubleshooting

### No metrics appearing in Prometheus
1. Verify Prometheus is running: `curl http://localhost:9090/-/healthy`
2. Check backend logs for "Failed to push metric" warnings
3. Verify `PROMETHEUS_URL` environment variable is set correctly
4. Check Prometheus scrape targets are configured

### No logs appearing in Loki
1. Verify Loki is running: `curl http://localhost:3100/ready`
2. Check backend logs for "Failed to push log" warnings
3. Verify `LOKI_URL` environment variable is set correctly
4. Try querying with `{}` in Loki to see all logs

### Metrics/logs disappearing
- Prometheus and Loki have retention policies
- Old data is automatically purged
- Generate more traffic to keep data fresh

## Configuration

### Disable Sample Telemetry
To disable auto-generated sample telemetry, comment out the `telemetryTicker` section in `main.go`

### Change Telemetry Generation Interval
Modify this line in `startBackgroundJobs()`:
```go
telemetryTicker := time.NewTicker(30 * time.Second)  // Change interval here
```

### Add Custom Metrics
Use the server's promClient in any handler:
```go
labels := map[string]string{
    "service": "my-service",
    "status": "success",
}
s.promClient.PushCounter(ctx, "my_metric_total", 1, labels)
```

### Add Custom Logs
Use the server's logger in any handler:
```go
s.logger.Info(ctx, "Operation completed", map[string]interface{}{
    "operation": "user_creation",
    "user_id": userID,
})
```

## Next Steps
1. ✅ Telemetry is now flowing automatically
2. Configure Prometheus datasource in Grafana to create dashboards
3. Set up alerts based on metrics
4. Create SLO dashboards from the metrics data
