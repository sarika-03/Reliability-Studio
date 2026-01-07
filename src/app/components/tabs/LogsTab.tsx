import React, { useState, useEffect } from 'react';
import { Incident } from '../../../models/Incident';
import { backendAPI } from '../../api/backend';

interface LogsTabProps {
  incident?: Incident;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export const LogsTab: React.FC<LogsTabProps> = ({ incident }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [incident?.id]);

  const loadLogs = async () => {
    if (!incident) return;
    try {
      setLoading(true);
      const data = await backendAPI.logs.getErrors(incident.service_id ?? incident.service ?? '');
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading logs...</div>;
  }

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
      case 'fatal':
        return '#d32f2f';
      case 'warning':
        return '#f57c00';
      case 'info':
        return '#1976d2';
      case 'debug':
        return '#757575';
      default:
        return '#999';
    }
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>Error Logs</h4>
      {logs.length === 0 ? (
        <p style={styles.empty}>No error logs found</p>
      ) : (
        <div style={styles.logList}>
          {logs.map((log, idx) => (
            <div key={idx} style={styles.logEntry}>
              <div style={styles.logMeta}>
                <span
                  style={{
                    ...styles.logLevel,
                    color: getLevelColor(log.level),
                  }}
                >
                  {log.level}
                </span>
                <span style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={styles.logMessage}>{log.message}</div>
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
  } as React.CSSProperties,
  heading: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  logList: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  logEntry: {
    padding: '8px',
    borderBottom: '1px solid #eee',
    fontSize: '12px',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  logMeta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '4px',
  } as React.CSSProperties,
  logLevel: {
    fontWeight: 600,
    minWidth: '60px',
  } as React.CSSProperties,
  logTime: {
    color: '#999',
  } as React.CSSProperties,
  logMessage: {
    color: '#333',
    wordBreak: 'break-word' as const,
  },
  loading: {
    padding: '16px',
    textAlign: 'center',
    color: '#999',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
  } as React.CSSProperties,
};
