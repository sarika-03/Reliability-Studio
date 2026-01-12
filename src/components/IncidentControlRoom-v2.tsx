import React, { useState, useEffect, useCallback } from 'react';
import { css, keyframes } from '@emotion/css';
import { backendAPI } from '../app/api/backend';
import { useRealtime } from '../app/hooks/useRealtime';
import { usePolledData, useFetchData } from '../utils/api-hooks';
import { StateRenderer, UIState } from '../utils/state-renderer';
import { Timeline } from './Timeline';
import { TelemetryTabs } from './TelemetryTabs';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const theme = {
    bg: '#0b0c10',
    surface: '#1a1d23',
    surfaceLight: '#252932',
    border: '#2d333d',
    accent: '#00d2ff',
    accentGradient: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    critical: '#f44336',
    high: '#ff9800',
    medium: '#ffeb3b',
    low: '#4caf50',
    text: '#e6e8eb',
    textMuted: '#9fa6b2',
};

const styles = {
    container: css`
    display: flex;
    height: calc(100vh - 100px);
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    overflow: hidden;
    animation: ${fadeIn} 0.5s ease-out;
  `,
    sidebar: css`
    width: 320px;
    border-right: 1px solid ${theme.border};
    display: flex;
    flex-direction: column;
    background: ${theme.surface};
    overflow-y: auto;
  `,
    header: css`
    padding: 20px;
    border-bottom: 1px solid ${theme.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
    title: css`
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  `,
    refreshButton: css`
    padding: 6px 12px;
    background: ${theme.accent};
    color: ${theme.bg};
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(0, 210, 255, 0.5);
    }
    
    &:active {
      transform: scale(0.95);
    }
  `,
    incidentList: css`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.border};
      border-radius: 3px;
      
      &:hover {
        background: ${theme.textMuted};
      }
    }
  `,
    incidentItem: css`
    padding: 12px;
    margin-bottom: 8px;
    background: ${theme.surfaceLight};
    border-left: 4px solid ${theme.accent};
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #2e3a45;
      transform: translateX(4px);
    }
    
    &.selected {
      background: #2e3a45;
      border-left-color: ${theme.accent};
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
    }
  `,
    incidentName: css`
    font-weight: 600;
    font-size: 14px;
    margin: 0 0 4px 0;
  `,
    incidentMeta: css`
    font-size: 12px;
    color: ${theme.textMuted};
    display: flex;
    justify-content: space-between;
  `,
    severityBadge: css`
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  `,
    content: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
    emptyState: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
    text-align: center;
  `,
    emptyIcon: css`
    font-size: 64px;
    margin-bottom: 20px;
  `,
    emptyTitle: css`
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 12px 0;
  `,
    emptyDescription: css`
    color: ${theme.textMuted};
    margin: 0 0 20px 0;
    max-width: 400px;
    line-height: 1.6;
  `,
    emptyActions: css`
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  `,
    primaryButton: css`
    padding: 10px 20px;
    background: ${theme.accent};
    color: ${theme.bg};
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 210, 255, 0.4);
    }
  `,
    secondaryButton: css`
    padding: 10px 20px;
    background: transparent;
    color: ${theme.accent};
    border: 1px solid ${theme.accent};
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(0, 210, 255, 0.1);
    }
  `,
    loadingSpinner: css`
    width: 32px;
    height: 32px;
    border: 2px solid ${theme.border};
    border-top-color: ${theme.accent};
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
  `,
    errorAlert: css`
    padding: 16px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid ${theme.critical};
    border-radius: 4px;
    margin-bottom: 16px;
    
    &.dismissible {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
  `,
    errorTitle: css`
    font-weight: 600;
    color: ${theme.critical};
    margin: 0 0 4px 0;
  `,
    errorMessage: css`
    color: ${theme.text};
    font-size: 14px;
    margin: 0;
    word-break: break-word;
  `,
    errorTrace: css`
    color: ${theme.textMuted};
    font-size: 11px;
    font-family: 'Monaco', 'Courier New', monospace;
    margin-top: 8px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    max-height: 60px;
    overflow-y: auto;
  `,
    closeButton: css`
    background: none;
    border: none;
    color: ${theme.textMuted};
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    
    &:hover {
      color: ${theme.text};
    }
  `,
    pollStatus: css`
    padding: 8px 12px;
    font-size: 11px;
    color: ${theme.textMuted};
    border-top: 1px solid ${theme.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
    pollIndicator: css`
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${theme.low};
    margin-right: 6px;
    animation: ${pulse} 2s infinite;
  `,
};

interface Incident {
    id: string;
    name: string;
    service_id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'resolved' | 'acknowledged';
    created_at: string;
    updated_at: string;
}

interface Service {
    id: string;
    name: string;
}

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'critical': return theme.critical;
        case 'high': return theme.high;
        case 'medium': return theme.medium;
        case 'low': return theme.low;
        default: return theme.accent;
    }
};

const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export const IncidentControlRoom: React.FC = () => {
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Polled incidents list - refresh every 5 seconds
    const {
        state: incidentsState,
        data: incidents,
        error: incidentsError,
        refetch: refetchIncidents,
        isPolling: isIncidentsPolling,
    } = usePolledData(
        () => backendAPI.incidents.list(),
        { interval: 5000, enabled: true }
    );
    const incidentsList = incidents || [];

    // Load services list
    const {
        state: servicesState,
        data: services = [],
        error: servicesError,
    } = useFetchData(
        () => backendAPI.services.list(),
        []
    );

    // Load timeline when incident is selected
    const {
        state: timelineState,
        data: timelineEvents = [],
    } = useFetchData(
        selectedIncidentId ? () => backendAPI.incidents.getTimeline(selectedIncidentId) : async () => [],
        [selectedIncidentId]
    );

    const selectedIncident = incidentsList.find(i => i.id === selectedIncidentId);

    const handleSelectIncident = (incidentId: string) => {
        setSelectedIncidentId(incidentId);
        setError(null);
    };

    const handleDismissError = useCallback(() => {
        setError(null);
    }, []);

    const handleCreateIncident = useCallback(() => {
        // Show guidance for creating incident via API
        const cmd = `curl -X POST http://localhost:9000/api/incidents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Database connection timeout",
    "service_id": "api-server",
    "severity": "high",
    "description": "Customers experiencing slow page loads"
  }'`;

        alert(`Create an incident using:\n\n${cmd}`);
    }, []);

    return (
        <div className={styles.container}>
            {/* Sidebar - Incidents List */}
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <h2 className={styles.title}>🚨 Incidents</h2>
                    <button className={styles.refreshButton} onClick={refetchIncidents}>
                        ↻ Refresh
                    </button>
                </div>

                {/* Error in incidents list */}
                {incidentsError && (
                    <div className={`${styles.errorAlert} dismissible`}>
                        <div style={{ flex: 1 }}>
                            <div className={styles.errorTitle}>Failed to load incidents</div>
                            <div className={styles.errorMessage}>{incidentsError.message}</div>
                            {incidentsError.traceId && (
                                <div className={styles.errorTrace}>Trace ID: {incidentsError.traceId}</div>
                            )}
                        </div>
                        <button className={styles.closeButton} onClick={handleDismissError}>✕</button>
                    </div>
                )}

                {/* Incidents list or empty state */}
                {incidentsState === 'loading' ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div className={styles.loadingSpinner} />
                    </div>
                ) : incidentsState === 'empty' ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>✅</div>
                        <div className={styles.emptyTitle}>All Systems Healthy</div>
                        <div className={styles.emptyDescription}>
                            No active incidents detected. All services are operating normally.
                        </div>
                        <div className={styles.emptyActions}>
                            <button className={styles.primaryButton} onClick={handleCreateIncident}>
                                + Create Test Incident
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.incidentList}>
                            {incidents.map(incident => (
                                <div
                                    key={incident.id}
                                    className={`${styles.incidentItem} ${
                                        selectedIncidentId === incident.id ? 'selected' : ''
                                    }`}
                                    onClick={() => handleSelectIncident(incident.id)}
                                >
                                    <div className={styles.incidentName}>{incident.name}</div>
                                    <div className={styles.incidentMeta}>
                                        <span
                                            className={styles.severityBadge}
                                            style={{
                                                background: `${getSeverityColor(incident.severity)}20`,
                                                color: getSeverityColor(incident.severity),
                                            }}
                                        >
                                            {incident.severity}
                                        </span>
                                        <span>{formatTime(incident.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Polling status */}
                        <div className={styles.pollStatus}>
                            <span>
                                <span className={styles.pollIndicator} /> Live polling
                            </span>
                            <span>{incidents.length} active</span>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                {selectedIncident ? (
                    <>
                        {/* Incident header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: `1px solid ${theme.border}`,
                            background: theme.surface,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                                        {selectedIncident.name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: theme.textMuted }}>
                                        <span>Service: {selectedIncident.service_id}</span>
                                        <span>Status: {selectedIncident.status}</span>
                                        <span>Since: {formatTime(selectedIncident.created_at)}</span>
                                    </div>
                                </div>
                                <span
                                    className={styles.severityBadge}
                                    style={{
                                        background: `${getSeverityColor(selectedIncident.severity)}20`,
                                        color: getSeverityColor(selectedIncident.severity),
                                    }}
                                >
                                    {selectedIncident.severity}
                                </span>
                            </div>
                        </div>

                        {/* Error alert for this incident */}
                        {error && (
                            <div className={`${styles.errorAlert} dismissible`} style={{ margin: '16px' }}>
                                <div>
                                    <div className={styles.errorTitle}>Error loading incident details</div>
                                    <div className={styles.errorMessage}>{error}</div>
                                </div>
                                <button className={styles.closeButton} onClick={handleDismissError}>✕</button>
                            </div>
                        )}

                        {/* Timeline and Telemetry tabs */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            <div style={{ width: '30%', borderRight: `1px solid ${theme.border}`, overflow: 'auto' }}>
                                <div style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        📋 Timeline ({timelineEvents.length} events)
                                    </h4>
                                    {timelineState === 'loading' ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <div className={styles.loadingSpinner} style={{ margin: '0 auto' }} />
                                        </div>
                                    ) : (
                                        <Timeline events={timelineEvents} />
                                    )}
                                </div>
                            </div>

                            <div style={{ flex: 1, overflow: 'auto' }}>
                                <div style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        📊 Telemetry & Correlation
                                    </h4>
                                    <TelemetryTabs incidentId={selectedIncident.id} />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👈</div>
                        <div className={styles.emptyTitle}>Select an Incident</div>
                        <div className={styles.emptyDescription}>
                            Choose an incident from the list to view its timeline, metrics, logs, and traces.
                            Use the investigation tools to diagnose the root cause.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
