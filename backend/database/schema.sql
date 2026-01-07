-- Complete Production Database Schema for Reliability Studio

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services (Service Catalog)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    team VARCHAR(255),
    on_call_schedule TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SLOs
CREATE TABLE slos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    objective FLOAT NOT NULL CHECK (objective >= 0 AND objective <= 100),
    window_days INT NOT NULL DEFAULT 30,
    error_budget_remaining FLOAT DEFAULT 100.0,
    burn_rate FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
    sli_query TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_id, name)
);

-- SLO History (for tracking over time)
CREATE TABLE slo_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slo_id UUID REFERENCES slos(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    error_budget FLOAT NOT NULL,
    burn_rate FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Incidents
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved')),
    commander_user_id VARCHAR(255),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    detected_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    mitigated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    mttr_seconds INT,
    mtta_seconds INT,
    root_cause TEXT,
    resolution TEXT,
    postmortem_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Incident Services (many-to-many)
CREATE TABLE incident_services (
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    impact_level VARCHAR(50) CHECK (impact_level IN ('primary', 'secondary', 'tertiary')),
    detected_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (incident_id, service_id)
);

-- Timeline Events
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    severity VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE incident_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
    assigned_to VARCHAR(255),
    created_by VARCHAR(255),
    due_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Correlation Rules (for automated incident detection)
CREATE TABLE correlation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('threshold', 'anomaly', 'pattern')),
    query TEXT NOT NULL,
    threshold_value FLOAT,
    severity VARCHAR(50) NOT NULL,
    service_id UUID REFERENCES services(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts (from Prometheus/Alertmanager)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_name VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('firing', 'resolved')),
    severity VARCHAR(50) NOT NULL,
    labels JSONB NOT NULL,
    annotations JSONB,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Metrics Cache (for faster dashboard loading)
CREATE TABLE metrics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_key VARCHAR(255) NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    labels JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(metric_key, service_id, timestamp)
);

-- Indexes for performance
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_started_at ON incidents(started_at DESC);
CREATE INDEX idx_timeline_incident_timestamp ON timeline_events(incident_id, timestamp DESC);
CREATE INDEX idx_slos_service ON slos(service_id);
CREATE INDEX idx_slo_history_slo_timestamp ON slo_history(slo_id, timestamp DESC);
CREATE INDEX idx_alerts_fingerprint ON alerts(fingerprint);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_incident_services_service ON incident_services(service_id);
CREATE INDEX idx_metrics_cache_key_time ON metrics_cache(metric_key, timestamp DESC);
CREATE INDEX idx_correlations_created_at ON correlations(created_at DESC);
CREATE INDEX idx_correlations_incident_id ON correlations(incident_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slos_updated_at BEFORE UPDATE ON slos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to calculate MTTR when incident is resolved
CREATE OR REPLACE FUNCTION calculate_incident_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
        NEW.mttr_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at))::INT;
        
        IF NEW.acknowledged_at IS NOT NULL THEN
            NEW.mtta_seconds = EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.started_at))::INT;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_metrics_on_resolve BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION calculate_incident_metrics();

-- Insert sample data
INSERT INTO services (name, description, team) VALUES
    ('auth-service', 'Authentication and authorization service', 'Platform'),
    ('payment-service', 'Payment processing service', 'Payments'),
    ('api-gateway', 'Main API gateway', 'Platform'),
    ('notification-service', 'Email and push notifications', 'Communication')
ON CONFLICT (name) DO NOTHING;

INSERT INTO correlation_rules (name, description, rule_type, query, threshold_value, severity, enabled) VALUES
    ('High Error Rate', 'Detects error rate > 5%', 'threshold', 
     'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05', 
     0.05, 'critical', true),
    ('Pod Crash Loop', 'Detects pods in CrashLoopBackOff', 'pattern',
     'kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"} > 0',
     0, 'high', true),
    ('High Latency', 'Detects p95 latency > 1s', 'threshold',
     'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1',
     1.0, 'high', true)
ON CONFLICT (name) DO NOTHING;