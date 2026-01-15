import React from 'react';
import { Incident } from '../../../models/Incident';

interface TracesTabProps {
  incident?: Incident;
}

export const TracesTab: React.FC<TracesTabProps> = ({ incident }) => {
  const serviceId = incident?.service_id ?? incident?.service ?? 'unknown';
  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>Distributed Traces</h4>
      <p style={styles.message}>
        Traces from {serviceId} during the incident window
      </p>
      <div style={styles.placeholder}>
        <p>Distributed tracing data will appear here when available.</p>
        <p style={styles.small}>
          Connect your Tempo/Jaeger instance via backend configuration.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  message: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '16px',
  } as React.CSSProperties,
  placeholder: {
    padding: '24px',
    textAlign: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    color: '#999',
  },
  small: {
    fontSize: '12px',
    marginTop: '8px',
  } as React.CSSProperties,
};
