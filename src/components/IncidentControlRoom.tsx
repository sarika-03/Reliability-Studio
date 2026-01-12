import React, { useState, useEffect } from 'react';
import { css, keyframes } from '@emotion/css';
import { backendAPI } from '../app/api/backend';
import { useRealtime } from '../app/hooks/useRealtime';
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
  `,
    sidebarHeader: css`
    padding: 20px;
    border-bottom: 1px solid ${theme.border};
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 10px;
  `,
    incidentList: css`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.border};
      border-radius: 2px;
    }
  `,
    incidentCard: (active: boolean, severity: string) => css`
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    background: ${active ? theme.surfaceLight : 'transparent'};
    border: 1px solid ${active ? theme.accent : theme.border};
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      background: ${theme.surfaceLight};
      transform: translateX(4px);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: ${severity === 'critical' ? theme.critical :
            severity === 'high' ? theme.high :
                severity === 'medium' ? theme.medium : theme.low};
    }
  `,
    cardTitle: css`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
    cardMeta: css`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${theme.textMuted};
  `,
    mainContent: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
    header: css`
    padding: 24px;
    border-bottom: 1px solid ${theme.border};
    background: ${theme.surface};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
    headerInfo: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
    headerTitle: css`
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -1px;
  `,
    badge: (color: string) => css`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    background: ${color}20;
    color: ${color};
    border: 1px solid ${color}40;
  `,
    actions: css`
    display: flex;
    gap: 12px;
  `,
    button: (primary: boolean) => css`
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: ${primary ? theme.accentGradient : 'transparent'};
    border: 1px solid ${primary ? 'transparent' : theme.border};
    color: ${theme.text};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${primary ? '0 4px 15px rgba(0, 210, 255, 0.3)' : 'none'};
      background: ${primary ? theme.accentGradient : theme.surfaceLight};
    }
  `,
    contentGrid: css`
    display: grid;
    grid-template-columns: 1fr 400px;
    flex: 1;
    overflow: hidden;
  `,
    tabContainer: css`
    border-left: 1px solid ${theme.border};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
    emptyState: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${theme.textMuted};
    gap: 20px;
  `,
    liveDot: css`
    width: 10px;
    height: 10px;
    background: ${theme.critical};
    border-radius: 50%;
    animation: ${pulse} 2s infinite;
  `,
};

export function IncidentControlRoom() {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [incidentsLoading, setIncidentsLoading] = useState(false);
    const [services, setServices] = useState<string[]>([]);
    const [servicesError, setServicesError] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string>(() => {
        return localStorage.getItem('selectedService') || 'payment-service';
    });

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        loadIncidents();
    }, [selectedService]);

    const loadServices = async () => {
        try {
            setServicesError(null);
            const data = await backendAPI.services.list();
            const serviceNames = data.map((s: any) => s.name);
            setServices(serviceNames);

            if (serviceNames.includes('payment-service') && !localStorage.getItem('selectedService')) {
                handleServiceChange('payment-service');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load services';
            console.error('[IncidentControlRoom] Failed to load services:', errorMsg);
            setServicesError(errorMsg);
            setServices(['payment-service', 'api-gateway', 'user-service', 'frontend-web']);
        }
    };

    const handleServiceChange = (service: string) => {
        setSelectedService(service);
        localStorage.setItem('selectedService', service);
        setSelectedIncident(null);
        setTimelineEvents([]);
    };

    const loadIncidents = async () => {
        try {
            setIncidentsLoading(true);
            setError(null);
            const data = await backendAPI.incidents.list();
            
            const filteredData = selectedService
                ? data.filter((inc: any) => inc.service === selectedService)
                : data;
            
            setIncidents(filteredData);
            
            // Auto-select first incident if none selected
            if (filteredData.length > 0 && !selectedIncident) {
                console.log('[IncidentControlRoom] Auto-selecting first incident:', filteredData[0].id);
                handleSelectIncident(filteredData[0]);
            } else if (filteredData.length === 0) {
                console.log('[IncidentControlRoom] No incidents found for service:', selectedService);
                setSelectedIncident(null);
                setTimelineEvents([]);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load incidents';
            console.error('[IncidentControlRoom] Failed to load incidents:', errorMsg);
            setError(errorMsg);
            setIncidents([]);
        } finally {
            setIncidentsLoading(false);
            setLoading(false);
        }
    };

    const handleSelectIncident = async (incident: any) => {
        try {
            console.log('[IncidentControlRoom] Selecting incident:', incident.id);
            setSelectedIncident(incident);
            setTimelineLoading(true);
            setError(null);
            
            const events = await backendAPI.incidents.getTimeline(incident.id);
            console.log('[IncidentControlRoom] Loaded timeline events:', events.length);
            setTimelineEvents(events);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load timeline';
            console.error('[IncidentControlRoom] Failed to load timeline:', errorMsg);
            setError(errorMsg);
            setTimelineEvents([]);
        } finally {
            setTimelineLoading(false);
        }
    };

    useRealtime({
        onIncidentCreated: (newIncident) => {
            setIncidents((prev) => [newIncident, ...prev]);
            // If none selected, select this new one
            if (!selectedIncident) {
                handleSelectIncident(newIncident);
            }
        },
        onIncidentUpdated: (updatedIncident) => {
            setIncidents((prev) =>
                prev.map(i => i.id === updatedIncident.id ? { ...i, ...updatedIncident } : i)
            );
            if (selectedIncident?.id === updatedIncident.id) {
                setSelectedIncident((prev: any) => ({ ...prev, ...updatedIncident }));
            }
        },
        onTimelineEvent: (event) => {
            if (selectedIncident?.id === event.incident_id) {
                setTimelineEvents((prev) => [event, ...prev]);
            }
        }
    });

    const acknowledgeIncident = async (id: string) => {
        try {
            console.log('[IncidentControlRoom] Acknowledging incident:', id);
            await backendAPI.incidents.update(id, { status: 'investigating' });
            setIncidents(prev =>
                prev.map(i => i.id === id ? { ...i, status: 'investigating' } : i)
            );
            if (selectedIncident?.id === id) {
                setSelectedIncident(prev => ({ ...prev, status: 'investigating' }));
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to acknowledge incident';
            console.error('[IncidentControlRoom] Failed to acknowledge:', errorMsg);
            setError(errorMsg);
        }
    };

    const resolveIncident = async (id: string) => {
        try {
            console.log('[IncidentControlRoom] Resolving incident:', id);
            await backendAPI.incidents.update(id, { status: 'resolved' });
            setIncidents(prev =>
                prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i)
            );
            if (selectedIncident?.id === id) {
                setSelectedIncident(prev => ({ ...prev, status: 'resolved' }));
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to resolve incident';
            console.error('[IncidentControlRoom] Failed to resolve:', errorMsg);
            setError(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.liveDot} />
                        <span>Active Incidents</span>
                    </div>
                    <div className={styles.emptyState}>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>📊 Initializing Control Room</div>
                        <div style={{ fontSize: '12px', marginTop: '8px', color: theme.textMuted }}>Loading services and incidents...</div>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                        <div>Initializing</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Sidebar - Incident List */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.liveDot} />
                    <span>Active Incidents</span>
                </div>

                {/* Error State */}
                {servicesError && (
                    <div style={{
                        padding: '12px 20px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        borderBottom: '1px solid #f44336',
                        fontSize: '12px',
                        color: '#ff9999',
                    }}>
                        ❌ Services error: {servicesError}
                    </div>
                )}

                <div style={{ padding: '10px 20px', borderBottom: `1px solid ${theme.border}` }}>
                    <label style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', display: 'block' }}>
                        Service Filter
                    </label>
                    <select
                        value={selectedService}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: theme.surfaceLight,
                            border: `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            color: theme.text,
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        <option value="">All Services</option>
                        {services.map((svc) => (
                            <option key={svc} value={svc}>{svc}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.incidentList}>
                    {incidentsLoading ? (
                        <div className={styles.emptyState}>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>📋 Loading incidents</div>
                            <div style={{ fontSize: '12px', marginTop: '8px', color: theme.textMuted }}>Fetching from backend...</div>
                        </div>
                    ) : error ? (
                        <div style={{
                            padding: '20px',
                            background: 'rgba(244, 67, 54, 0.1)',
                            borderRadius: '4px',
                            margin: '10px',
                            fontSize: '12px',
                            color: '#ff9999',
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '8px' }}>❌ Failed to load incidents</div>
                            <div style={{ fontSize: '11px', marginBottom: '12px' }}>{error}</div>
                            <button
                                onClick={() => loadIncidents()}
                                style={{
                                    padding: '6px 12px',
                                    background: '#f44336',
                                    border: 'none',
                                    borderRadius: '3px',
                                    color: '#fff',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : incidents.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>✅ No active incidents</div>
                            <div style={{ fontSize: '12px', marginTop: '8px', color: theme.textMuted }}>All systems healthy</div>
                        </div>
                    ) : (
                        incidents.map((incident) => (
                            <div
                                key={incident.id}
                                className={styles.incidentCard(selectedIncident?.id === incident.id, incident.severity)}
                                onClick={() => handleSelectIncident(incident)}
                            >
                                <div className={styles.cardTitle}>{incident.title}</div>
                                <div className={styles.cardMeta}>
                                    <span>{incident.service}</span>
                                    <span>{new Date(incident.started_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
                {error && (
                    <div style={{
                        padding: '16px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        borderBottom: '1px solid #f44336',
                        color: '#ff9999',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span>❌ Error: {error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ff9999',
                                cursor: 'pointer',
                                fontSize: '18px',
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {selectedIncident ? (
                    <>
                        <div className={styles.header}>
                            <div className={styles.headerInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <div className={styles.badge(
                                        selectedIncident.severity === 'critical' ? theme.critical :
                                            selectedIncident.severity === 'high' ? theme.high : theme.medium
                                    )}>
                                        {selectedIncident.severity}
                                    </div>
                                    <div className={styles.badge(theme.accent)}>
                                        {selectedIncident.status}
                                    </div>
                                </div>
                                <div className={styles.headerTitle}>{selectedIncident.title}</div>
                                <div style={{ color: theme.textMuted, fontSize: '14px' }}>
                                    Detected for <strong>{selectedIncident.service}</strong> at {new Date(selectedIncident.started_at).toLocaleString()}
                                </div>
                            </div>
                            <div className={styles.actions}>
                                {selectedIncident.status === 'open' && (
                                    <button
                                        className={styles.button(true)}
                                        onClick={() => acknowledgeIncident(selectedIncident.id)}
                                    >
                                        Acknowledge
                                    </button>
                                )}
                                {selectedIncident.status !== 'resolved' && (
                                    <button
                                        className={styles.button(false)}
                                        onClick={() => resolveIncident(selectedIncident.id)}
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.contentGrid}>
                            {/* Timeline Stream */}
                            {timelineLoading ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: theme.textMuted,
                                    gap: '12px',
                                }}>
                                    <div style={{ fontSize: '24px' }}>⏳</div>
                                    <div style={{ fontSize: '12px' }}>Loading timeline events...</div>
                                </div>
                            ) : (
                                <Timeline events={timelineEvents} />
                            )}

                            {/* Telemetry Tabs */}
                            <div className={styles.tabContainer}>
                                <TelemetryTabs
                                    incidentId={selectedIncident.id}
                                    service={selectedIncident.service}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>👋</div>
                        <h2 style={{ margin: '0 0 8px 0' }}>Select an incident to investigate</h2>
                        <p style={{ margin: '0', color: theme.textMuted }}>
                            {incidents.length > 0
                                ? 'Click on an incident in the left sidebar to view details, timeline, and telemetry.'
                                : 'All systems are healthy. No active incidents detected.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
