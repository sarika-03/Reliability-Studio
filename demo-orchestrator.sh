#!/usr/bin/env bash
set -euo pipefail

# Demo Orchestrator for Reliability Studio
# ----------------------------------------
# This script is a pure automation helper for demos. It does NOT change
# product behavior or use mock data. It simply:
#   1. Resets the Postgres database to a clean state
#   2. Ensures the docker stack is running
#   3. Injects real load and failures via the existing /api/test/* endpoints
#   4. Waits for detection + correlation to run
#   5. Opens Grafana on the Reliability Studio app with the newest incident
#
# Requirements:
#   - docker / docker compose
#   - curl, jq, xdg-open (Linux) or open (macOS)
#
# Usage:
#   ./demo-orchestrator.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$ROOT_DIR/docker"

BACKEND_CONTAINER="reliability-backend"
POSTGRES_CONTAINER="reliability-postgres"
GRAFANA_URL="http://localhost:3000"
BACKEND_URL="http://localhost:9000"

info()  { echo -e "[INFO]  $*"; }
warn()  { echo -e "[WARN]  $*" >&2; }
error() { echo -e "[ERROR] $*" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || warn "jq not found; incident deep-link will fall back to generic URL"

step_reset_db() {
  info "Resetting demo database schema (drop + re-init) ..."
  # Drop and recreate schema by recreating the Postgres volume. This keeps the
  # logic simple and ensures InitSchema + SeedDefaultData run cleanly.
  pushd "$DOCKER_DIR" >/dev/null
  docker-compose down -v || true
  popd >/dev/null
}

step_start_stack() {
  info "Starting docker stack (postgres, backend, prometheus, loki, grafana, pushgateway, tempo, test-app) ..."
  pushd "$DOCKER_DIR" >/dev/null
  docker-compose up -d --build
  popd >/dev/null

  info "Waiting for backend health ..."
  for i in {1..60}; do
    if curl -fsS "$BACKEND_URL/api/health" >/dev/null 2>&1; then
      info "Backend is healthy."
      return
    fi
    sleep 2
  done
  error "Backend did not become healthy in time."
}

step_inject_traffic() {
  info "Injecting baseline load for payment-service ..."
  curl -fsS -X POST "$BACKEND_URL/api/test/load" \
    -H 'Content-Type: application/json' \
    -d '{"service":"payment-service","requests":500,"duration_seconds":60}' || \
    warn "Load injection failed (continuing)."

  info "Injecting failure for payment-service (30% error rate) ..."
  curl -fsS -X POST "$BACKEND_URL/api/test/fail" || \
    warn "Failure injection failed (continuing)."
}

step_wait_for_detection() {
  info "Waiting for incident detection + correlation cycle ..."
  # Detector runs every 30s; Prometheus scrape interval is 5s. Waiting 75s is
  # usually enough for metrics to propagate and incidents to be created.
  sleep 75
}

get_latest_incident_id() {
  # Uses the authenticated incident list API (auth is disabled in demo stack).
  local json
  json="$(curl -fsS "$BACKEND_URL/api/incidents" 2>/dev/null || echo '[]')" || return 1
  if command -v jq >/dev/null 2>&1; then
    echo "$json" | jq -r 'sort_by(.started_at) | last | .id // empty'
  else
    # Very naive fallback: try to grep an "id" field
    echo "$json" | sed -n 's/.*"id"\s*:\s*"\([^"]\+\)".*/\1/p' | tail -n1
  fi
}

step_open_grafana() {
  local incident_id
  incident_id="$(get_latest_incident_id)" || true

  if [[ -z "$incident_id" ]]; then
    warn "Could not determine latest incident id; opening Grafana home instead."
    local url="$GRAFANA_URL"
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$url" >/dev/null 2>&1 || true
    elif command -v open >/dev/null 2>&1; then
      open "$url" || true
    else
      info "Open this URL in your browser: $url"
    fi
    return
  fi

  # Deep-link into the incident workspace for the latest incident in the
  # Reliability Studio app. This matches the plugin route used in Grafana.
  local url="$GRAFANA_URL/d/sarika-reliability-studio-app/incidents?var-incident_id=$incident_id"
  info "Opening Grafana incident view for incident: $incident_id"

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$url" || true
  else
    info "Open this URL in your browser: $url"
  fi
}

main() {
  step_reset_db
  step_start_stack
  step_inject_traffic
  step_wait_for_detection
  step_open_grafana
  info "Demo orchestration complete."
}

main "$@"
