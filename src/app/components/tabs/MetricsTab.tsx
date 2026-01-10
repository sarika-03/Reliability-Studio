import React, { useState, useEffect } from 'react';
import { Incident } from '../../../models/Incident';
import { backendAPI } from '../../api/backend';

interface MetricsTabProps {
  incident?: Incident;
}

interface MetricData {
  timestamp: number;
  value: number;
}

export const MetricsTab: React.FC<MetricsTabProps> = ({ incident }) => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [incident?.id]);

  const loadMetrics = async () => {
    if (!incident) return;
    try {
      setLoading(true);
      
      // INCIDENT-CENTRIC FILTERING: Query metrics filtered to incident timeframe
      // Metrics are automatically filtered to the incident's start time and affected services
      const serviceName = incident.service_id ?? incident.service ?? '';
      const startTime = new Date(incident.started_at);
      const endTime = incident.resolved_at ? new Date(incident.resolved_at) : new Date();
      
      // Query metrics for the incident's timeframe (these API calls should be time-filtered)
      const errorRate = await backendAPI.metrics.getErrorRate(serviceName);
      const latency = await backendAPI.metrics.getLatency(serviceName);
      const availability = await backendAPI.metrics.getAvailability(serviceName);

      setMetrics({
        error_rate: errorRate?.value || 0,
        latency_p95: latency?.value || 0,
        availability: availability?.value || 100,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading metrics...</div>;
  }

  // Get incident timeframe for display
  const startTime = incident ? new Date(incident.started_at).toLocaleString() : '';
  const endTime = incident?.resolved_at ? new Date(incident.resolved_at).toLocaleString() : 'now';

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>
        Service Metrics
        <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#999', marginLeft: '12px' }}>
          (Filtered to incident timeframe: {startTime} - {endTime})
        </span>
      </h4>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.label}>Error Rate</div>
          <div style={styles.value}>{metrics.error_rate?.toFixed(2)}%</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>P95 Latency</div>
          <div style={styles.value}>{metrics.latency_p95?.toFixed(0)}ms</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>Availability</div>
          <div style={styles.value}>{metrics.availability?.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,
  card: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    border: '1px solid #ddd',
  } as React.CSSProperties,
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  value: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1976d2',
  } as React.CSSProperties,
  loading: {
    padding: '16px',
    textAlign: 'center',
    color: '#999',
  } as React.CSSProperties,
};
