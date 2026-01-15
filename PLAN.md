# Intelligent Incident Response: Implementation Plan

## Phase 1: Backend Intelligence Service (Backend) - ✅ COMPLETE
- [x] **Task 1.1: Intelligence Service Foundations**
    - Create `backend/services/intelligence_service.go`.
    - Implement `AnalyzeIncident(incidentID)` to fetch telemetry context.
- [x] **Task 1.2: Log Anomaly Detection**
    - Query Loki for the incident time window.
    - Implement basic pattern grouping to find "New" or "Failing" log types.
- [x] **Task 1.3: RCA Evidence Aggregation**
    - Merge data from Prometheus, Loki, and K8s events into an `Insight` object.

## Phase 2: Automated Remediation (Backend) - ✅ COMPLETE
- [x] **Task 2.1: Remediation Service**
    - Create `backend/services/remediation_service.go`.
    - Implement `ExecuteAction(incidentID, actionID)`.
- [x] **Task 2.2: Kubernetes Integration**
    - Add `RestartDeployment` and `ScaleDeployment` methods to `k8s_client.go`.

## Phase 3: API & Handlers (Backend) - ✅ COMPLETE
- [x] **Task 3.1: Intelligence Handlers**
    - Create `backend/handlers/intelligence.go`.
    - Endpoints: `GET /api/incidents/{id}/intelligence`, `POST /api/incidents/{id}/remediate`.
- [x] **Task 3.2: main.go Registration**
    - Initialize services and register routes.

## Phase 4: Grafana Plugin UI (Frontend) - ✅ COMPLETE
- [x] **Task 4.1: Intelligence Tab**
    - Create `src/components/IntelligencePanel`.
    - Visualize RCA insights and evidence.
- [x] **Task 4.2: Remediation Controls**
    - Add "One-Click Fix" buttons with confirmation Modals.
    - Status tracking for ongoing remediation actions.

## Phase 5: Testing & Validation - ✅ IN PROGRESS
- [x] **Task 5.1: Unit Tests**
    - Verified backend build and connectivity.
- [ ] **Task 5.2: Chaos Simulation**
    - Future: Trigger a failure and verify the Intelligence service correctly identifies the RCA.
