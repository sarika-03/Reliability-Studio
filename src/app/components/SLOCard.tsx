import React from 'react';
import { SLO } from '../../models/SLO';

interface SLOCardProps {
  slo?: SLO;
}

export const SLOCard: React.FC<SLOCardProps> = ({ slo }) => {
  if (!slo) {
    return (
      <div style={styles.card}>
        <p style={styles.empty}>No SLO data available</p>
      </div>
    );
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return '#388e3c';
      case 'warning':
        return '#f57c00';
      case 'critical':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  return (
    <div style={{...styles.card, borderLeft: `4px solid ${getStatusColor(slo.status)}`}}>
      <h3 style={styles.title}>{slo.name}</h3>
      <p style={styles.description}>{slo.description}</p>

      <div style={styles.metrics}>
        <div>
          <div style={styles.label}>Target</div>
          <div style={styles.value}>{slo.target_percentage}%</div>
        </div>
        <div>
          <div style={styles.label}>Current</div>
          <div style={styles.value}>{slo.current_percentage?.toFixed(2)}%</div>
        </div>
        <div>
          <div style={styles.label}>Budget</div>
          <div style={{...styles.value, color: getStatusColor(slo.status)}}>
            {slo.error_budget_remaining?.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${Math.min(Math.max(slo.error_budget_remaining || 0, 0), 100)}%`,
            backgroundColor: getStatusColor(slo.status),
          }}
        />
      </div>

      <div style={styles.footer}>
        <span style={{...styles.status, color: getStatusColor(slo.status)}}>
          {slo.status?.toUpperCase()}
        </span>
        <span style={styles.window}>{slo.window_days} day window</span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  title: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  description: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  } as React.CSSProperties,
  label: {
    fontSize: '11px',
    color: '#999',
    marginBottom: '4px',
  } as React.CSSProperties,
  value: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  } as React.CSSProperties,
  progressBar: {
    height: '6px',
    backgroundColor: '#eee',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '12px',
  } as React.CSSProperties,
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  } as React.CSSProperties,
  status: {
    fontWeight: 600,
  } as React.CSSProperties,
  window: {
    color: '#999',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    textAlign: 'center',
  } as React.CSSProperties,
};
