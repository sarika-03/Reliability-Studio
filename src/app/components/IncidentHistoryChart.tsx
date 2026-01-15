import React from 'react';
import { Incident } from '../../models/Incident';

interface IncidentHistoryChartProps {
  incidents?: Incident[];
}

export const IncidentHistoryChart: React.FC<IncidentHistoryChartProps> = ({ incidents = [] }) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Incident History (30 Days)</h3>
      <div style={styles.chart}>
        <div style={styles.placeholder}>
          <p>Incident frequency chart</p>
          <p style={styles.small}>Timeline visualization coming soon</p>
        </div>
      </div>
      <div style={styles.stats}>
        <div>
          <div style={styles.statLabel}>Total Incidents</div>
          <div style={styles.statValue}>{incidents.length}</div>
        </div>
        <div>
          <div style={styles.statLabel}>Critical</div>
          <div style={styles.statValue}>
            {incidents.filter(i => i.severity === 'critical').length}
          </div>
        </div>
        <div>
          <div style={styles.statLabel}>High</div>
          <div style={styles.statValue}>
            {incidents.filter(i => i.severity === 'high').length}
          </div>
        </div>
      </div>
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
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  chart: {
    height: '200px',
    marginBottom: '16px',
  } as React.CSSProperties,
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    color: '#999',
  },
  small: {
    fontSize: '12px',
    margin: '8px 0 0 0',
  } as React.CSSProperties,
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '4px',
  } as React.CSSProperties,
  statValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
  } as React.CSSProperties,
};
