import React from 'react';
import { Incident } from '../../models/Incident';

interface MTTRTrendChartProps {
  incidents?: Incident[];
}

export const MTTRTrendChart: React.FC<MTTRTrendChartProps> = ({ incidents = [] }) => {
  const calculateMTTR = (incident: Incident) => {
    if (!incident.resolved_at) return 0;
    const start = new Date(incident.started_at).getTime();
    const end = new Date(incident.resolved_at).getTime();
    return Math.round((end - start) / (1000 * 60)); // Convert to minutes
  };

  const resolvedIncidents = incidents.filter(i => i.resolved_at);
  const mttrValues = resolvedIncidents.map(calculateMTTR);
  const avgMTTR = mttrValues.length > 0 ? Math.round(mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length) : 0;
  const maxMTTR = mttrValues.length > 0 ? Math.max(...mttrValues) : 0;

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>MTTR Trend</h3>
      <div style={styles.chart}>
        <div style={styles.placeholder}>
          <p>Mean Time To Resolution chart</p>
          <p style={styles.small}>Timeline visualization coming soon</p>
        </div>
      </div>
      <div style={styles.stats}>
        <div>
          <div style={styles.statLabel}>Avg MTTR</div>
          <div style={styles.statValue}>{avgMTTR}m</div>
        </div>
        <div>
          <div style={styles.statLabel}>Max MTTR</div>
          <div style={styles.statValue}>{maxMTTR}m</div>
        </div>
        <div>
          <div style={styles.statLabel}>Resolved</div>
          <div style={styles.statValue}>{resolvedIncidents.length}</div>
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
