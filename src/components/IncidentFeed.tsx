import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { useRealtime } from '../app/hooks/useRealtime';
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
};

const styles = {
  container: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
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
  status: css`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: ${theme.textMuted};
  `,
  statusDot: css`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${theme.critical};

    &.connected {
      background: ${theme.healthy};
    }
  `,
  feed: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  `,
  feedItem: css`
    padding: 12px;
    background: ${theme.bg};
    border: 1px solid ${theme.border};
    border-radius: 3px;
    border-left: 3px solid ${theme.warning};

    &.critical {
      border-left-color: ${theme.critical};
    }

    &.healthy {
      border-left-color: ${theme.healthy};
    }
  `,
  feedItemTitle: css`
    font-weight: 500;
    color: ${theme.text};
    margin-bottom: 4px;
    font-size: 13px;
  `,
  feedItemDetails: css`
    font-size: 12px;
    color: ${theme.textMuted};
  `,
  timestamp: css`
    font-size: 11px;
    color: ${theme.textMuted};
    margin-top: 6px;
  `,
  empty: css`
    text-align: center;
    color: ${theme.textMuted};
    padding: 24px 0;
    font-size: 12px;
  `,
};

interface IncidentFeedItem {
  id: string;
  title: string;
  severity: string;
  timestamp: number;
  type: string;
  payload: any;
}

export function IncidentFeed() {
  const [incidents, setIncidents] = useState<IncidentFeedItem[]>([]);

  const { connected } = useRealtime({
    url: 'ws://localhost:9000/api/realtime',
    onIncidentCreated: (incident: any) => {
      const feedItem: IncidentFeedItem = {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        timestamp: Date.now(),
        type: 'created',
        payload: incident,
      };

      setIncidents((prev) => [feedItem, ...prev.slice(0, 49)]);
    },
    onIncidentUpdated: (incident: any) => {
      const feedItem: IncidentFeedItem = {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        timestamp: Date.now(),
        type: 'updated',
        payload: incident,
      };

      setIncidents((prev) => [feedItem, ...prev.slice(0, 49)]);
    },
    onAlert: (alert: any) => {
      const feedItem: IncidentFeedItem = {
        id: alert.id || Math.random().toString(),
        title: alert.title || 'New Alert',
        severity: alert.severity || 'medium',
        timestamp: Date.now(),
        type: 'alert',
        payload: alert,
      };

      setIncidents((prev) => [feedItem, ...prev.slice(0, 49)]);
    },
  });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    return date.toLocaleTimeString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>🔴 Incident Feed</div>
        <div className={styles.status}>
          <div className={`${styles.statusDot} ${connected ? 'connected' : ''}`}></div>
          <span>{connected ? '🟢 Live' : '🔴 Offline'}</span>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className={styles.empty}>
          {connected
            ? '✅ No incidents. Waiting for changes...'
            : '⚠️ Not connected to incident stream. Attempting to reconnect...'}
        </div>
      ) : (
        <div className={styles.feed}>
          {incidents.map((item) => (
            <div
              key={`${item.id}-${item.timestamp}`}
              className={`${styles.feedItem} ${item.severity}`}
              title={item.payload?.description}
            >
              <div className={styles.feedItemTitle}>
                {item.type === 'created' && '✨ New: '}
                {item.type === 'updated' && '📝 Updated: '}
                {item.type === 'alert' && '⚠️ Alert: '}
                {item.title}
              </div>
              <div className={styles.feedItemDetails}>
                {item.severity && `Severity: ${item.severity}`}
                {item.payload?.service && ` · Service: ${item.payload.service}`}
              </div>
              <div className={styles.timestamp}>{formatTime(item.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
