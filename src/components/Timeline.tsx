import React from 'react';
import { css } from '@emotion/css';

const theme = {
    border: '#2d333d',
    text: '#e6e8eb',
    textMuted: '#9fa6b2',
    accent: '#00d2ff',
    surface: '#1a1d23',
};

const styles = {
    container: css`
    padding: 24px;
    overflow-y: auto;
    background: #0d0e12;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.border};
      border-radius: 2px;
    }
  `,
    sectionTitle: css`
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 24px;
    color: ${theme.text};
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${theme.border};
    }
  `,
    timeline: css`
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding-left: 20px;

    &::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: ${theme.border};
    }
  `,
    event: css`
    position: relative;
    padding-bottom: 30px;
    padding-left: 24px;

    &:last-child {
      padding-bottom: 0;
    }
  `,
    iconWrapper: (type: string) => css`
    position: absolute;
    left: -24px;
    top: 0;
    width: 32px;
    height: 32px;
    background: #1a1d23;
    border: 1px solid ${theme.border};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    z-index: 1;
    box-shadow: 0 0 0 4px #0d0e12;
  `,
    eventContent: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `,
    eventHeader: css`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  `,
    eventTitle: css`
    font-weight: 600;
    font-size: 14px;
    color: ${theme.text};
  `,
    eventTime: css`
    font-size: 11px;
    color: ${theme.textMuted};
  `,
    eventDesc: css`
    font-size: 13px;
    color: ${theme.textMuted};
    line-height: 1.5;
  `,
    metadata: css`
    margin-top: 12px;
    padding: 8px;
    background: #0b0c10;
    border-radius: 4px;
    font-family: 'Berkeley Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #00ff41;
    overflow-x: auto;
  `,
};

const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
        'alert': '🚨',
        'metric_anomaly': '📊',
        'log_event': '📝',
        'deployment': '🚀',
        'mitigation': '🔧',
        'resolution': '✅',
        'trace_anomaly': '🔍',
        'system': '⚙️',
    };
    return icons[type] || '•';
};

interface TimelineProps {
    events: any[];
}

export function Timeline({ events }: TimelineProps) {
    return (
        <div className={styles.container}>
            <h3 className={styles.sectionTitle}>Incident Timeline</h3>
            <div className={styles.timeline}>
                {events.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 20px',
                        color: theme.textMuted,
                        textAlign: 'center',
                        gap: '12px',
                    }}>
                        <div style={{ fontSize: '24px' }}>📋</div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>No timeline events yet</div>
                            <div style={{ fontSize: '12px' }}>Events will appear as the incident progresses</div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            fontSize: '12px',
                            color: theme.textMuted,
                            marginBottom: '20px',
                            padding: '12px 0 0 24px',
                        }}>
                            {events.length} event(s) recorded
                        </div>
                        {events.map((event) => (
                            <div key={event.id} className={styles.event}>
                                <div className={styles.iconWrapper(event.type)}>
                                    {getEventIcon(event.type)}
                                </div>
                                <div className={styles.eventContent}>
                                    <div className={styles.eventHeader}>
                                        <div className={styles.eventTitle}>{event.title}</div>
                                        <div className={styles.eventTime}>
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className={styles.eventDesc}>{event.description}</div>
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <details style={{ marginTop: '12px' }}>
                                            <summary style={{
                                                fontSize: '11px',
                                                color: theme.accent,
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                            }}>
                                                Show metadata
                                            </summary>
                                            <pre className={styles.metadata}>
                                                {JSON.stringify(event.metadata, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
