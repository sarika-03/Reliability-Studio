import React, { useState, useEffect } from 'react';
import { Incident } from '../../../models/Incident';
import { backendAPI } from '../../api/backend';

interface KubernetesTabProps {
  incident?: Incident;
}

interface PodStatus {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  age: string;
}

export const KubernetesTab: React.FC<KubernetesTabProps> = ({ incident }) => {
  const [pods, setPods] = useState<PodStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadK8sData();
  }, [incident?.id]);

  const loadK8sData = async () => {
    if (!incident) return;
    try {
      setLoading(true);
      // This would call the actual K8s API through the backend
      // For now, mock empty data
      setPods([]);
    } catch (error) {
      console.error('Failed to load K8s data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return '#388e3c';
      case 'pending':
        return '#f57c00';
      case 'failed':
      case 'crashloopbackoff':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading Kubernetes data...</div>;
  }

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>Kubernetes Status</h4>
      {pods.length === 0 ? (
        <p style={styles.empty}>
          No Kubernetes data available. Ensure K8s integration is configured in the backend.
        </p>
      ) : (
        <div style={styles.table}>
          <table style={styles.tableElement}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.cell}>Pod Name</th>
                <th style={styles.cell}>Status</th>
                <th style={styles.cell}>Restarts</th>
                <th style={styles.cell}>Age</th>
              </tr>
            </thead>
            <tbody>
              {pods.map((pod, idx) => (
                <tr key={idx} style={styles.row}>
                  <td style={styles.cell}>{pod.name}</td>
                  <td
                    style={{
                      ...styles.cell,
                      color: getStatusColor(pod.status),
                      fontWeight: 600,
                    }}
                  >
                    {pod.status}
                  </td>
                  <td style={styles.cell}>{pod.restarts}</td>
                  <td style={styles.cell}>{pod.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  table: {
    overflowX: 'auto' as const,
  },
  tableElement: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
  } as React.CSSProperties,
  headerRow: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd',
  } as React.CSSProperties,
  row: {
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  cell: {
    padding: '8px',
    textAlign: 'left' as const,
  } as React.CSSProperties,
  loading: {
    padding: '16px',
    textAlign: 'center',
    color: '#999',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: '13px',
  } as React.CSSProperties,
};
