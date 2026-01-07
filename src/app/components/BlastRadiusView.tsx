import React, { useState, useEffect } from 'react';
import { Service } from '../../models/Service';

interface BlastRadiusViewProps {
  services?: Service[];
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({ services = [] }) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Blast Radius Analysis</h2>
      <p style={styles.description}>
        Services affected by this incident:
      </p>
      {services.length === 0 ? (
        <p style={styles.empty}>No services affected or loading...</p>
      ) : (
        <div style={styles.serviceGrid}>
          {services.map((service) => (
            <div key={service.id} style={styles.serviceCard}>
              <div style={styles.serviceName}>{service.name}</div>
              <div style={styles.serviceStatus}>
                Status: <strong>{service.status}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    marginBottom: '16px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  description: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,
  serviceCard: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
  } as React.CSSProperties,
  serviceName: {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '4px',
  } as React.CSSProperties,
  serviceStatus: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: '13px',
  } as React.CSSProperties,
};
