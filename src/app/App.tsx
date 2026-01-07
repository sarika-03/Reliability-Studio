import React, { useState, useEffect } from 'react';
import { css, cx } from '@emotion/css';
import { backendAPI } from './api/backend';
import { SLOData, Incident } from './types';

const theme = {
  bg: '#0d0e12',
  surface: '#16191d',
  surfaceHeader: '#1c1f24',
  border: '#2a2d33',
  text: '#d1d2d3',
  textMuted: '#8b8e92',
  healthy: '#4caf50',
  warning: '#ff9800',
  critical: '#f44336',
  fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  monoFont: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
};

const styles = {
  appContainer: css`
    background-color: ${theme.bg};
    color: ${theme.text};
    font-family: ${theme.fontFamily};
    min-height: 100vh;
    font-size: 13px;
  `,
  header: css`
    height: 44px;
    background-color: ${theme.surfaceHeader};
    border-bottom: 1px solid ${theme.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  `,
  flexCenter: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  brand: css`
    font-weight: 700;
    color: #fff;
    font-size: 15px;
  `,
  divider: css`
    color: ${theme.border};
  `,
  metaItem: css`
    font-size: 11px;
    color: ${theme.textMuted};
    text-transform: uppercase;
    font-weight: 500;
  `,
  metaHigh: css`
    color: ${theme.text};
    text-transform: none;
    font-weight: 600;
  `,
  contentWrapper: css`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
  `,
  kpiGrid: css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  `,
  kpiBox: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    padding: 16px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  `,
  kpiLabel: css`
    font-size: 11px;
    font-weight: 600;
    color: ${theme.textMuted};
    text-transform: uppercase;
  `,
  kpiValue: css`
    font-size: 22px;
    font-weight: 700;
  `,
  mainBoard: css`
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    min-height: 480px;
  `,
  rightColumn: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,
  panel: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  panelHeader: css`
    background: ${theme.surfaceHeader};
    padding: 10px 16px;
    border-bottom: 1px solid ${theme.border};
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${theme.textMuted};
  `,
  incidentList: css`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  incidentCard: css`
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: rgba(0, 0, 0, 0.4);
      border-color: ${theme.healthy};
    }
  `,
  incidentCardSelected: css`
    background: rgba(76, 175, 80, 0.1);
    border-color: ${theme.healthy};
  `,
  incidentHeader: css`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  `,
  severityDot: css`
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,
  incidentTitle: css`
    font-size: 12px;
    font-weight: 600;
  `,
  incidentMeta: css`
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: ${theme.textMuted};
  `,
  incidentTime: css`
    font-size: 10px;
    color: ${theme.textMuted};
    font-family: ${theme.monoFont};
  `,
  detailsContent: css`
    padding: 16px;
    flex: 1;
  `,
  detailsGrid: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  detailRow: css`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid ${theme.border};
  `,
  detailLabel: css`
    font-size: 11px;
    color: ${theme.textMuted};
    text-transform: uppercase;
    font-weight: 600;
  `,
  detailValue: css`
    font-size: 12px;
    color: ${theme.text};
    font-family: ${theme.monoFont};
  `,
  timelineContent: css`
    padding: 16px;
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
  `,
  timelineList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  timelineEvent: css`
    display: grid;
    grid-template-columns: 80px 120px 1fr;
    gap: 12px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 11px;
  `,
  timelineTime: css`
    color: ${theme.textMuted};
    font-family: ${theme.monoFont};
  `,
  timelineSource: css`
    color: ${theme.healthy};
    font-weight: 600;
  `,
  timelineMessage: css`
    color: ${theme.text};
  `,
  emptyContent: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  `,
  tabBar: css`
    display: flex;
    background: ${theme.surfaceHeader};
    border-bottom: 1px solid ${theme.border};
  `,
  tabBtn: css`
    background: none;
    border: none;
    border-right: 1px solid ${theme.border};
    padding: 12px 24px;
    color: ${theme.textMuted};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #22252a;
      color: #fff;
    }
  `,
  tabActive: css`
    background: ${theme.surface};
    color: #fff;
    border-bottom: 2px solid ${theme.healthy};
  `,
  consoleBody: css`
    padding: 24px;
    background: #090a0d;
    min-height: 200px;
  `,
  consolePlaceholder: css`
    font-family: ${theme.monoFont};
  `,
  consoleText: css`
    color: ${theme.text};
    font-size: 11px;
    margin: 0;
  `,
  textHealthy: css`
    color: ${theme.healthy};
  `,
  textWarning: css`
    color: ${theme.warning};
  `,
  textCritical: css`
    color: ${theme.critical};
  `,
  textMuted: css`
    color: ${theme.textMuted};
  `,
  actionBtn: css`
    background: ${theme.healthy};
    color: #fff;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    &:hover {
      opacity: 0.9;
    }
  `,
  correlationList: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  `,
  correlationItem: css`
    background: rgba(0, 0, 0, 0.2);
    padding: 8px;
    border-radius: 4px;
    font-size: 11px;
    border-left: 2px solid ${theme.healthy};
  `,
};



const Login: React.FC<{ onLogin: (token: string, user: any) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:9000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css`
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: ${theme.bg};
    `}>
      <form onSubmit={handleSubmit} className={css`
        background: ${theme.surface};
        padding: 40px;
        border-radius: 8px;
        border: 1px solid ${theme.border};
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      `}>
        <h2 className={styles.brand}>Reliability Studio Login</h2>
        {error && <div className={styles.textCritical}>{error}</div>}
        <input
          type="text"
          placeholder="Username or Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={css`
            padding: 12px;
            background: #000;
            border: 1px solid ${theme.border};
            color: #fff;
            border-radius: 4px;
          `}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={css`
            padding: 12px;
            background: #000;
            border: 1px solid ${theme.border};
            color: #fff;
            border-radius: 4px;
          `}
        />
        <button
          type="submit"
          disabled={loading}
          className={cx(styles.actionBtn, css`padding: 12px; font-size: 14px;`)}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
        <div className={styles.textMuted} style={{ fontSize: '11px', textAlign: 'center' }}>
          Default: admin / (see seed data)
        </div>
      </form>
    </div>
  );
};

const Header: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.flexCenter}>
        <span className={styles.brand}>Reliability Studio</span>
        <span className={styles.divider}>|</span>
        <span className={styles.metaItem}>Env: <span className={styles.metaHigh}>Monitoring</span></span>
        <span className={styles.divider}>|</span>
        <span className={styles.metaItem}>Local Time: <span className={styles.metaHigh}>{time.toLocaleTimeString()}</span></span>
      </div>
      <div className={styles.flexCenter}>
        {user && (
          <div className={styles.flexCenter}>
            <span className={styles.metaItem}>{user.username}</span>
            <span className={styles.divider}>|</span>
            <button
              onClick={onLogout}
              className={css`
                background: none;
                border: none;
                color: ${theme.textMuted};
                cursor: pointer;
                font-size: 11px;
                &:hover { color: #fff; }
              `}
            >
              LOGOUT
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ marginTop: '8px' }}>
      <polyline
        fill="none"
        stroke={theme.healthy}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
};

const SLOCard: React.FC<{ slo: SLOData }> = ({ slo }) => {
  const [history, setHistory] = React.useState<number[]>([]);

  React.useEffect(() => {
    backendAPI.slos.getHistory(slo.id).then((data: any[]) => {
      setHistory(data.map((h: any) => h.value));
    }).catch(console.error);
  }, [slo.id]);

  return (
    <div className={styles.kpiBox}>
      <span className={styles.kpiLabel}>{slo.name}</span>
      <span className={cx(styles.kpiValue, slo.status === 'healthy' ? styles.textHealthy : styles.textCritical)}>
        {slo.current_percentage.toFixed(2)}%
      </span>
      <span className={styles.metaItem}>Budget: {slo.error_budget_remaining.toFixed(1)}%</span>
      <Sparkline data={history} />
    </div>
  );
};

const IncidentCard: React.FC<{
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}> = ({ incident, isSelected, onClick }) => {
  const severityColor =
    incident.severity === 'critical'
      ? theme.critical
      : incident.severity === 'high' || incident.severity === 'medium'
        ? theme.warning
        : theme.healthy;

  return (
    <div
      className={cx(styles.incidentCard, isSelected && styles.incidentCardSelected)}
      onClick={onClick}
    >
      <div className={styles.incidentHeader}>
        <span
          className={styles.severityDot}
          style={{ backgroundColor: severityColor }}
        />
        <span className={styles.incidentTitle}>{incident.title}</span>
      </div>
      <div className={styles.incidentMeta}>
        <span>{incident.service}</span>
        <span className={cx(incident.status === 'active' ? styles.textCritical : styles.textHealthy)}>{incident.status}</span>
      </div>
      <div className={styles.incidentTime}>
        {new Date(incident.started_at).toLocaleString()}
      </div>
    </div>
  );
};

const MainBoard: React.FC<{
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  timeline: any[];
  correlations: any[];
}> = ({ incidents, selectedIncident, onSelectIncident, timeline, correlations }) => (
  <div className={styles.mainBoard}>
    <div className={styles.panel}>
      <div className={styles.panelHeader}>Active & Recent Incidents</div>
      <div className={styles.incidentList}>
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={selectedIncident?.id === incident.id}
              onClick={() => onSelectIncident(incident)}
            />
          ))
        ) : (
          <div className={styles.emptyContent}>
            <span className={styles.textMuted}>No incidents found</span>
          </div>
        )}
      </div>
    </div>

    <div className={styles.rightColumn}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          Incident Context: {selectedIncident?.title || 'None Selected'}
        </div>
        <div className={styles.detailsContent}>
          {selectedIncident ? (
            <div className={styles.detailsGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Root Cause Analysis:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={styles.actionBtn} onClick={async () => {
                    if (selectedIncident) {
                      await backendAPI.incidents.update(selectedIncident.id, { status: 'analyzing' });
                      // Trigger reload by a trick or just wait for interval
                    }
                  }}>Analyze</button>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Correlations:</span>
                <div className={styles.correlationList}>
                  {correlations.length > 0 ? correlations.map(c => (
                    <div key={c.id} className={styles.correlationItem}>
                      <span className={styles.textHealthy}>[{c.correlation_type}]</span> {c.source_id} ({(c.confidence_score * 100).toFixed(0)}% confidence)
                    </div>
                  )) : <span className={styles.textMuted}>No correlations detected yet</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyContent}>
              <span className={styles.textMuted}>Select an incident to view deep context</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>Timeline Events</div>
        <div className={styles.timelineContent}>
          {selectedIncident ? (
            <div className={styles.timelineList}>
              {timeline.length > 0 ? timeline.map((event, idx) => (
                <div key={idx} className={styles.timelineEvent}>
                  <span className={styles.timelineTime}>
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                  <span className={styles.timelineSource}>{event.source}</span>
                  <span className={styles.timelineMessage}>{event.title}</span>
                </div>
              )) : (
                <div className={styles.timelineEvent}>
                  <span className={styles.timelineTime}>{new Date(selectedIncident.started_at).toLocaleTimeString()}</span>
                  <span className={styles.timelineSource}>System</span>
                  <span className={styles.timelineMessage}>Incident reported</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyContent}>
              <span className={styles.textMuted}>No timeline data available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const TelemetryConsole = ({ selectedIncident }: { selectedIncident: Incident | null }) => {
  const [activeTab, setActiveTab] = useState('Metrics');
  const [data, setData] = useState<any>(null);
  const tabs = ['Metrics', 'Logs', 'Traces', 'Kubernetes'];

  useEffect(() => {
    if (!selectedIncident) return;

    const loadTelemetry = async () => {
      if (activeTab === 'Metrics') {
        const res = await backendAPI.metrics.getErrorRate(selectedIncident.service);
        setData(res);
      } else if (activeTab === 'Logs') {
        const res = await backendAPI.logs.getErrors(selectedIncident.service);
        setData(res);
      } else if (activeTab === 'Kubernetes') {
        const res = await backendAPI.kubernetes.getPods('default', selectedIncident.service);
        setData(res);
      } else {
        setData(null);
      }
    };
    loadTelemetry();
  }, [selectedIncident, activeTab]);

  return (
    <div className={styles.panel}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={cx(styles.tabBtn, activeTab === tab && styles.tabActive)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.consoleBody}>
        <pre className={styles.consoleText}>
          {data ? JSON.stringify(data, null, 2) : `No active ${activeTab.toLowerCase()} signal for this service...`}
        </pre>
      </div>
    </div>
  );
};

export const App = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [slos, setSlos] = useState<SLOData[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update backendAPI token
  useEffect(() => {
    if (token) {
      (window as any).AUTH_TOKEN = token;
    }
  }, [token]);

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [sloRes, incRes] = await Promise.all([
        backendAPI.slos.list(),
        backendAPI.incidents.list()
      ]);

      setSlos(sloRes || []);
      setIncidents(incRes || []);

      if (incRes && incRes.length > 0 && !selectedIncident) {
        setSelectedIncident(incRes[0]);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (selectedIncident && token) {
      const loadContext = async () => {
        const [tm, corr] = await Promise.all([
          backendAPI.incidents.getTimeline(selectedIncident.id),
          backendAPI.incidents.getCorrelations(selectedIncident.id)
        ]);
        setTimeline(tm || []);
        setCorrelations(corr || []);
      };
      loadContext();
    }
  }, [selectedIncident, token]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className={styles.appContainer}>
        <Header user={user} onLogout={handleLogout} />
        <div className={styles.contentWrapper}>
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <span className={styles.textHealthy}>Authenticating and linking reliability matrix...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <Header user={user} onLogout={handleLogout} />
      <div className={styles.contentWrapper}>
        <div className={styles.kpiGrid}>
          {slos.slice(0, 4).map(slo => <SLOCard key={slo.id} slo={slo} />)}
          {slos.length === 0 && <span className={styles.textMuted}>No SLOs configured.</span>}
        </div>
        <MainBoard
          incidents={incidents}
          selectedIncident={selectedIncident}
          onSelectIncident={setSelectedIncident}
          timeline={timeline}
          correlations={correlations}
        />
        <TelemetryConsole selectedIncident={selectedIncident} />
      </div>
    </div>
  );
};