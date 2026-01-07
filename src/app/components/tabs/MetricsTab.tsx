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
      const errorRate = await backendAPI.metrics.getErrorRate(incident.service_id ?? incident.service ?? '');
      const latency = await backendAPI.metrics.getLatency(incident.service_id ?? incident.service ?? '');
      const availability = await backendAPI.metrics.getAvailability(incident.service_id ?? incident.service ?? '');

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

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>Service Metrics</h4>
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
