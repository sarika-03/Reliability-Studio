import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { backendAPI } from '../app/api/backend';

const theme = {
    bg: '#0b0c10',
    surface: '#1a1d23',
    border: '#2d333d',
    accent: '#00d2ff',
    text: '#e6e8eb',
    textMuted: '#9fa6b2',
};

const styles = {
    container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${theme.surface};
  `,
    tabs: css`
    display: flex;
    padding: 0 10px;
    border-bottom: 1px solid ${theme.border};
    background: #0d0e12;
  `,
    tab: (active: boolean) => css`
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: ${active ? theme.accent : theme.textMuted};
    cursor: pointer;
    border-bottom: 2px solid ${active ? theme.accent : 'transparent'};
    transition: all 0.2s;

    &:hover {
      color: ${theme.text};
    }
  `,
    content: css`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  `,
    dataCard: css`
    background: ${theme.bg};
    border: 1px solid ${theme.border};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  `,
    logEntry: (level: string) => css`
    font-family: 'Berkeley Mono', monospace;
    font-size: 12px;
    padding: 8px;
    border-bottom: 1px solid ${theme.border};
    display: flex;
    gap: 12px;
    
    &::before {
      content: '';
      width: 4px;
      height: 100%;
      background: ${level === 'error' ? '#f44336' : level === 'warn' ? '#ff9800' : '#4caf50'};
    }
  `,
};

interface TelemetryTabsProps {
    incidentId: string;
    service: string;
}

export function TelemetryTabs({ incidentId, service }: TelemetryTabsProps) {
    const [activeTab, setActiveTab] = useState('metrics');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTabData();
    }, [activeTab, incidentId, service]);

    const loadTabData = async () => {
        setLoading(true);
        setError(null);
        setData(null);
        
        try {
            console.log(`[TelemetryTabs] Loading ${activeTab} for service: ${service}`);
            let result;
            switch (activeTab) {
                case 'metrics':
                    const errRate = await backendAPI.metrics.getErrorRate(service);
                    const latency = await backendAPI.metrics.getLatency(service);
                    result = { errorRate: errRate, latency: latency };
                    break;
                case 'logs':
                    result = await backendAPI.logs.getErrors(service);
                    break;
                case 'traces':
                    result = [];
                    break;
                case 'k8s':
                    result = await backendAPI.kubernetes.getPods('default', service);
                    break;
            }
            console.log(`[TelemetryTabs] Loaded ${activeTab}:`, result);
            setData(result);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `Failed to load ${activeTab}`;
            console.error(`[TelemetryTabs] Error loading ${activeTab}:`, errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                {['metrics', 'logs', 'traces', 'k8s'].map(tab => (
                    <div
                        key={tab}
                        className={styles.tab(activeTab === tab)}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.toUpperCase()}
                    </div>
                ))}
            </div>

            <div className={styles.content}>
                {error && (
                    <div style={{
                        padding: '16px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        borderRadius: '4px',
                        color: '#ff9999',
                        fontSize: '12px',
                        marginBottom: '16px',
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>❌ Failed to load {activeTab}</div>
                        <div style={{ fontSize: '11px' }}>{error}</div>
                        <button
                            onClick={() => loadTabData()}
                            style={{
                                marginTop: '8px',
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
                )}

                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 20px',
                        color: theme.textMuted,
                        gap: '12px',
                    }}>
                        <div style={{ fontSize: '24px' }}>⏳</div>
                        <div style={{ fontSize: '12px' }}>Loading {activeTab}...</div>
                    </div>
                ) : (
                    <div>
                        {activeTab === 'metrics' && data && (
                            <>
                                <div className={styles.dataCard}>
                                    <div style={{ color: theme.textMuted, fontSize: '12px', marginBottom: '8px' }}>Error Rate</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f44336' }}>
                                        {(data.errorRate?.value || 0).toFixed(2)}%
                                    </div>
                                </div>
                                <div className={styles.dataCard}>
                                    <div style={{ color: theme.textMuted, fontSize: '12px', marginBottom: '8px' }}>P95 Latency</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#00d2ff' }}>
                                        {(data.latency?.value || 0).toFixed(3)}s
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'logs' && Array.isArray(data) && (
                            <div className={styles.dataCard} style={{ padding: 0 }}>
                                {data.length === 0 ? (
                                    <div style={{ padding: '20px', color: theme.textMuted, textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>✅ No error logs</div>
                                        <div style={{ fontSize: '12px' }}>No errors detected for this service</div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${theme.border}`,
                                            fontSize: '12px',
                                            color: theme.textMuted,
                                            fontWeight: 600,
                                        }}>
                                            {data.length} error log(s)
                                        </div>
                                        {data.map((log, i) => (
                                            <div key={i} className={styles.logEntry(log.level || 'error')}>
                                                <span style={{ color: theme.textMuted, whiteSpace: 'nowrap' }}>
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </span>
                                                <span style={{ color: theme.text }}>{log.message}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'k8s' && Array.isArray(data) && (
                            <div className={styles.dataCard}>
                                {data.length === 0 ? (
                                    <div style={{ padding: '20px', color: theme.textMuted, textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>📦 No pods found</div>
                                        <div style={{ fontSize: '12px' }}>Service may not be deployed</div>
                                    </div>
                                ) : (
                                    <>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', padding: '0 16px', paddingTop: '16px' }}>System Resources ({data.length} pods)</h4>
                                        {data.map((pod, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: `1px solid ${theme.border}` }}>
                                                <span style={{ fontSize: '13px' }}>{pod.name}</span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    background: pod.status === 'Running' ? '#4caf5020' : '#f4433620',
                                                    color: pod.status === 'Running' ? '#4caf50' : '#f44336',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {pod.status}
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'traces' && (
                            <div style={{ color: theme.textMuted, textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔄</div>
                                <div style={{ fontSize: '12px' }}>Distributed tracing investigation is coming soon.</div>
                                <div style={{ fontSize: '11px', marginTop: '8px', color: theme.textMuted }}>Integration with Tempo in progress</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
