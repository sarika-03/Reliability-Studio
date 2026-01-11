import React, { useState, useEffect } from 'react';
import { backendAPI } from '../api/backend';

interface TimelineViewProps {
  incidentId?: string;
}

interface TimelineEvent {
  id: string;
  // Backend returns "type" (Go struct field json:"type").
  type: string;
  title: string;
  description: string;
  severity?: string;
  created_at: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ incidentId = '' }: TimelineViewProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!incidentId) return;

    // Initial load
    loadTimeline();

    // LIVE UPDATES: Poll for new timeline events every 5 seconds (control plane behavior)
    const interval = setInterval(() => {
      loadTimeline();
    }, 5000);

    return () => clearInterval(interval);
  }, [incidentId]);

  const loadTimeline = async (): Promise<void> => {
    if (!incidentId) return;
    try {
      setLoading(true);
      const data = await backendAPI.incidents.getTimeline(incidentId);
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load timeline:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case 'alert':
        return '[!]';
      case 'metric_anomaly':
        return '[CHART]';
      case 'log_spike':
        return '[LOGS]';
      case 'pod_crash':
        return '[CRASH]';
      case 'kubernetes_event':
        return '[K8S]';
      case 'status_change':
        return '[CHANGE]';
      case 'comment':
        return '[COMMENT]';
      default:
        return '•';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading timeline...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Incident Timeline</h3>
      {events.length === 0 ? (
        <p style={styles.empty}>No events recorded</p>
      ) : (
        <div style={styles.timeline}>
          {events.map((event: TimelineEvent) => (
            <div key={event.id} style={styles.event}>
              <div style={styles.eventIcon}>{getEventIcon(event.type)}</div>
              <div style={styles.eventContent}>
                <div style={styles.eventTitle}>{event.title}</div>
                <div style={styles.eventDescription}>{event.description}</div>
                <div style={styles.eventTime}>
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  ...styles.eventSeverity,
                  backgroundColor: getSeverityColor(event.severity || 'info'),
                }}
              >
                {event.severity || 'info'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getSeverityColor = (severity: string): string => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return '#ffcdd2';
    case 'high':
      return '#ffe0b2';
    case 'medium':
      return '#fff9c4';
    case 'low':
      return '#c8e6c9';
    default:
      return '#eeeeee';
  }
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  timeline: {
    position: 'relative',
  } as React.CSSProperties,
  event: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '16px',
    borderLeft: '2px solid #ddd',
    paddingLeft: '12px',
    marginLeft: '8px',
  } as React.CSSProperties,
  eventIcon: {
    fontSize: '20px',
    flexShrink: 0,
  } as React.CSSProperties,
  eventContent: {
    flex: 1,
  } as React.CSSProperties,
  eventTitle: {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '4px',
  } as React.CSSProperties,
  eventDescription: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  eventTime: {
    fontSize: '12px',
    color: '#999',
  } as React.CSSProperties,
  eventSeverity: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    alignSelf: 'center',
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
