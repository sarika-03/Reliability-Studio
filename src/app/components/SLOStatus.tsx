import React from 'react';
import { Service } from '../../models/Service';

interface SLOStatusProps {
  services?: Service[];
}

interface ServiceWithSLO extends Service {
  slos?: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    errorBudgetRemaining: number;
  }>;
}

export const SLOStatus: React.FC<SLOStatusProps> = ({ services = [] }) => {
  const getSLOStatusColor = (remaining: number) => {
    if (remaining < 25) return '#d32f2f';
    if (remaining < 50) return '#f57c00';
    return '#388e3c';
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>SLO Status</h3>
      {services.length === 0 ? (
        <p style={styles.empty}>No SLO data available</p>
      ) : (
        <div style={styles.list}>
          {(services as ServiceWithSLO[]).map((service) => (
            <div key={service.id} style={styles.serviceSection}>
              <div style={styles.serviceName}>{service.name}</div>
              {service.slos && service.slos.length > 0 ? (
                service.slos.map((slo) => (
                  <div key={slo.id} style={styles.sloCard}>
                    <div style={styles.sloName}>{slo.name}</div>
                    <div style={styles.sloMeta}>
                      <span>Target: {slo.target}%</span>
                      <span>Current: {slo.current?.toFixed(2)}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min(slo.errorBudgetRemaining, 100)}%`,
                          backgroundColor: getSLOStatusColor(slo.errorBudgetRemaining),
                        }}
                      />
                    </div>
                    <div style={styles.budgetText}>
                      Error Budget: {slo.errorBudgetRemaining?.toFixed(1)}%
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.noSLO}>No SLOs configured</p>
              )}
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
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  serviceSection: {
    padding: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  serviceName: {
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '8px',
  } as React.CSSProperties,
  sloCard: {
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  sloName: {
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '4px',
  } as React.CSSProperties,
  sloMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  progressBar: {
    height: '8px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  } as React.CSSProperties,
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  budgetText: {
    fontSize: '11px',
    color: '#999',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: '13px',
  } as React.CSSProperties,
  noSLO: {
    fontSize: '12px',
    color: '#999',
    margin: '4px 0 0 0',
  } as React.CSSProperties,
};
