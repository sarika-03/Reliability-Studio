import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { backendAPI } from '../app/api/backend';

const theme = {
  bg: '#0d0e12',
  surface: '#16191d',
  border: '#2a2d33',
  text: '#d1d2d3',
  textMuted: '#8b8e92',
  healthy: '#4caf50',
  warning: '#ff9800',
  critical: '#f44336',
  fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const styles = {
  container: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 16px;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid ${theme.border};
  `,
  title: css`
    font-weight: 600;
    color: ${theme.text};
    font-size: 14px;
  `,
  badgeContainer: css`
    display: flex;
    gap: 8px;
  `,
  badge: css`
    background: ${theme.bg};
    border: 1px solid ${theme.border};
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 11px;
    color: ${theme.textMuted};
    font-weight: 500;
  `,
  alertsList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  alertItem: css`
    padding: 12px;
    background: ${theme.bg};
    border: 1px solid ${theme.border};
    border-left: 3px solid ${theme.warning};
    border-radius: 3px;
    font-size: 12px;

    &.critical {
      border-left-color: ${theme.critical};
      background: rgba(244, 67, 54, 0.05);
    }

    &.healthy {
      border-left-color: ${theme.healthy};
      background: rgba(76, 175, 80, 0.05);
    }
  `,
  alertName: css`
    font-weight: 500;
    color: ${theme.text};
    margin-bottom: 4px;
  `,
  alertDetails: css`
    color: ${theme.textMuted};
    margin-bottom: 6px;
    font-size: 11px;
  `,
  severity: css`
    display: inline-block;
    padding: 2px 6px;
    border-radius: 2px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    background: ${theme.critical};
    color: #fff;
    margin-right: 8px;

    &.high {
      background: ${theme.warning};
    }

    &.medium {
      background: #2196f3;
    }
  `,
  empty: css`
    text-align: center;
    color: ${theme.textMuted};
    padding: 24px 0;
    font-size: 12px;
  `,
  loadingDots: css`
    display: inline-block;
    animation: dots 1.5s steps(4, end) infinite;

    @keyframes dots {
      0%, 20% {
        content: '';
      }
      40% {
        content: '.';
      }
      60% {
        content: '..';
      }
      80%, 100% {
        content: '...';
      }
    }
  `,
};

interface DetectionAlert {
  rule_name: string;
  service_id: string;
  severity: string;
  value: number;
  timestamp: number;
  metadata?: any;
}

export function DetectionAlerts() {
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch alerts every 30 seconds
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await backendAPI.detection?.getStatus?.();
        if (response?.alerts) {
          // Convert map to array
          const alertsArray = Object.entries(response.alerts).map(([key, alert]: [string, any]) => ({
            rule_name: alert.rule_name,
            service_id: alert.service_id,
            severity: alert.severity,
            value: alert.value,
            timestamp: alert.timestamp,
            metadata: alert.metadata,
          }));
          setAlerts(alertsArray);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch detection alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getServerStatus = () => {
    // Mock: This would come from backend in real implementation
    return { ok: true, message: 'Detection engine running' };
  };

  const formatValue = (value: number, rule: string) => {
    if (rule.includes('Error Rate') || rule.includes('Latency')) {
      return value.toFixed(2);
    }
    return Math.round(value);
  };

  // Note: The API doesn't exist yet, so we'll show a placeholder
  const apiNotReady = !backendAPI.detection?.getStatus;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          🔍 Active Detection Alerts {loading && <span className={styles.loadingDots}></span>}
        </div>
        <div className={styles.badgeContainer}>
          <div className={styles.badge}>
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
          </div>
          <div className={styles.badge}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {apiNotReady ? (
        <div className={styles.empty}>
          Detection API not yet integrated. Backend detection service initializing...
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.empty}>
          ✅ No active alerts - system is healthy
        </div>
      ) : (
        <div className={styles.alertsList}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`${styles.alertItem} ${alert.severity?.toLowerCase() || 'medium'}`}
            >
              <div className={styles.alertName}>
                <span className={`${styles.severity} ${alert.severity?.toLowerCase()}`}>
                  {alert.severity}
                </span>
                {alert.rule_name}
              </div>
              <div className={styles.alertDetails}>
                Service: <strong>{alert.service_id}</strong>
                {' | '}
                Value: <strong>{formatValue(alert.value, alert.rule_name)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
