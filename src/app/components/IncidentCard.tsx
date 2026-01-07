import React from 'react';
import { Incident } from '../../models/Incident';

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick }) => {
  const getSeverityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '🔴 Active';
      case 'investigating':
        return '🔵 Investigating';
      case 'resolved':
        return '[OK] Resolved';
      default:
        return status;
    }
  };

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.header}>
        <h3 style={styles.title}>{incident.title}</h3>
        <span
          style={{
            ...styles.severity,
            backgroundColor: getSeverityColor(incident.severity),
          }}
        >
          {incident.severity}
        </span>
      </div>

      <p style={styles.description}>{incident.description}</p>

      <div style={styles.footer}>
        <div style={styles.status}>{getStatusLabel(incident.status)}</div>
        <div style={styles.time}>
          Started: {new Date(incident.started_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'box-shadow 0.2s',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '8px',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    flex: 1,
  } as React.CSSProperties,
  severity: {
    padding: '4px 12px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    marginLeft: '12px',
  } as React.CSSProperties,
  description: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#999',
  } as React.CSSProperties,
  status: {
    fontWeight: 500,
  } as React.CSSProperties,
  time: {},
};
