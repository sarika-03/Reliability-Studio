/**
 * IncidentControlPlane - The core incident-centric UI for Reliability Studio
 * 
 * This component implements the strict incident-centric model:
 * - Incident Header (ID, title, severity, status, start time, duration)
 * - Live Timeline (auto-updates)
 * - Impact & Services (automatically filtered)
 * - Unified Telemetry (Metrics, Logs, Traces, K8s, SLOs) - auto-filtered to incident timeframe
 * - Operator Actions (Acknowledge, Add Note, Mitigate, Resolve)
 * 
 * NO generic dashboards, NO explore panels, NO unfiltered views
 */

import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Incident } from '../../models/Incident';
import { IncidentHeader } from './IncidentHeader';
import { BlastRadiusView } from './BlastRadiusView';
import { TimelineView } from './TimelineView';
import { MetricsTab } from './tabs/MetricsTab';
import { LogsTab } from './tabs/LogsTab';
import { TracesTab } from './tabs/TracesTab';
import { KubernetesTab } from './tabs/KubernetesTab';
import { SLOStatus } from '../components/SLOStatus';
import { TabsBar, Tab, TabContent } from '@grafana/ui';
import { incidentsApi } from '../api/incidents';
import { backendAPI } from '../api/backend';

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
};

const styles = {
  container: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,
  headerSection: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 20px;
  `,
  impactSection: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 16px;
  `,
  timelineSection: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 16px;
    min-height: 300px;
  `,
  telemetrySection: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 16px;
  `,
  actionsSection: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    padding: 16px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  `,
  actionButton: css`
    padding: 10px 20px;
    border: 1px solid ${theme.border};
    border-radius: 4px;
    background: ${theme.surfaceHeader};
    color: ${theme.text};
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
    &:hover {
      background: ${theme.border};
      border-color: ${theme.textMuted};
    }
  `,
  actionButtonPrimary: css`
    background: ${theme.healthy};
    color: #fff;
    border-color: ${theme.healthy};
    &:hover {
      background: #45a049;
    }
  `,
  actionButtonDanger: css`
    background: ${theme.critical};
    color: #fff;
    border-color: ${theme.critical};
    &:hover {
      background: #e53935;
    }
  `,
  sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${theme.text};
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  duration: css`
    font-size: 12px;
    color: ${theme.textMuted};
    margin-top: 8px;
  `,
};

interface IncidentControlPlaneProps {
  incident: Incident;
  timeline: any[];
  correlations: any[];
  onIncidentUpdate: (incident: any) => void;
  onIncidentResolved: () => void;
}

interface IncidentAnalysis {
  incident_id: string;
  service: string;
  namespace?: string;
  incident_confidence: number;
  root_cause_summary_text?: string;
  root_cause_summary?: Array<{
    signal_type: string;
    source: string;
    reason: string;
    primary: boolean;
    signal_ids?: string[];
  }>;
  correlations: any[];
}

export const IncidentControlPlane: React.FC<IncidentControlPlaneProps> = ({
  incident,
  timeline,
  correlations,
  onIncidentUpdate,
  onIncidentResolved,
}) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [incidentDuration, setIncidentDuration] = useState('');
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(true);

  // Load incident analysis
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setAnalysisLoading(true);
        const data = await incidentsApi.getAnalysis(incident.id);
        if (!cancelled) {
          setAnalysis(data);
        }
      } catch (err) {
        console.error('Failed to load incident analysis', err);
        if (!cancelled) {
          setAnalysis(null);
        }
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [incident.id]);

  // Calculate incident duration
  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(incident.started_at);
      const now = incident.resolved_at ? new Date(incident.resolved_at) : new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        setIncidentDuration(`${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`);
      } else if (diffHours > 0) {
        setIncidentDuration(`${diffHours}h ${diffMins % 60}m`);
      } else {
        setIncidentDuration(`${diffMins}m`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [incident.started_at, incident.resolved_at]);

  // OPERATOR ACTIONS
  const handleAcknowledge = async () => {
    try {
      const updated = await incidentsApi.update(incident.id, { status: 'investigating' });
      onIncidentUpdate(updated);
    } catch (error) {
      console.error('Failed to acknowledge incident:', error);
      alert('Failed to acknowledge incident');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      // Add note as timeline event
      // This would be implemented via backend API
      setNoteText('');
      alert('Note added (implementation pending)');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleMitigate = async () => {
    try {
      const updated = await incidentsApi.update(incident.id, { status: 'mitigated' });
      onIncidentUpdate(updated);
    } catch (error) {
      console.error('Failed to mitigate incident:', error);
      alert('Failed to mitigate incident');
    }
  };

  const handleResolve = async () => {
    if (!confirm('Mark this incident as resolved?')) return;
    try {
      const updated = await incidentsApi.update(incident.id, { status: 'resolved' });
      onIncidentUpdate(updated);
      onIncidentResolved();
      alert('Incident resolved! The system will update automatically.');
    } catch (error) {
      console.error('Failed to resolve incident:', error);
      alert('Failed to resolve incident');
    }
  };

  // Get affected services for Impact section
  const affectedServices = (incident.services || []) as any[];
  if (affectedServices.length === 0 && incident.service) {
    affectedServices.push({ name: incident.service, status: 'degraded' });
  }

  return (
    <div className={styles.container}>
      {/* INCIDENT HEADER: ID, title, severity, status, start time, duration */}
      <div className={styles.headerSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>INCIDENT ID</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: theme.text }}>{incident.id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>DURATION</div>
            <div style={{ fontSize: '13px', color: theme.text }}>{incidentDuration}</div>
          </div>
        </div>
        <IncidentHeader incident={incident} onUpdate={() => onIncidentUpdate(incident)} />
        {/* ANALYSIS SUMMARY */}
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>ANALYSIS</div>
            {analysisLoading ? (
              <div style={{ fontSize: 12, color: theme.textMuted }}>Running incident analysis…</div>
            ) : analysis && analysis.root_cause_summary_text ? (
              <div style={{ fontSize: 13, color: theme.text }}>{analysis.root_cause_summary_text}</div>
            ) : (
              <div style={{ fontSize: 13, color: theme.textMuted }}>No strong root cause identified yet.</div>
            )}
          </div>
          <div style={{ minWidth: 160, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>CONFIDENCE</div>
            {analysisLoading ? (
              <div style={{ fontSize: 13, color: theme.textMuted }}>—</div>
            ) : analysis ? (
              <div style={{ fontSize: 13, color: theme.text }}>
                {(analysis.incident_confidence * 100).toFixed(0)}%
              </div>
            ) : (
              <div style={{ fontSize: 13, color: theme.textMuted }}>N/A</div>
            )}
          </div>
        </div>
      </div>

      {/* IMPACT & SERVICES: Automatically filtered to incident */}
      <div className={styles.impactSection}>
        <div className={styles.sectionTitle}>Impact & Affected Services</div>
        <BlastRadiusView services={affectedServices} />
        {analysis && analysis.correlations && analysis.correlations.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: theme.bg, borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: theme.text }}>Key Signals</div>
            {analysis.root_cause_summary && analysis.root_cause_summary.length > 0 ? (
              analysis.root_cause_summary.slice(0, 3).map((rc, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>
                  {rc.primary ? 'PRIMARY' : 'CONTRIBUTING'} • {rc.signal_type} from {rc.source}: {rc.reason}
                </div>
              ))
            ) : (
              analysis.correlations.slice(0, 5).map((corr: any) => (
                <div key={corr.id} style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>
                  {corr.type}: {corr.source_id} ({(corr.confidence_score * 100).toFixed(0)}% confidence)
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* LIVE TIMELINE: Auto-updates with real-time events */}
      <div className={styles.timelineSection}>
        <div className={styles.sectionTitle}>Timeline of Events</div>
        <TimelineView incidentId={incident.id} />
      </div>

      {/* UNIFIED TELEMETRY: Metrics, Logs, Traces, K8s, SLOs - Auto-filtered to incident timeframe */}
      <div className={styles.telemetrySection}>
        <div className={styles.sectionTitle}>
          Unified Telemetry
          <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: '12px', fontWeight: 'normal' }}>
            (Filtered to incident timeframe: {new Date(incident.started_at).toLocaleString()} - {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : 'now'})
          </span>
        </div>
        <TabsBar>
          <Tab label="Metrics" active={activeTab === 'metrics'} onChangeTab={() => setActiveTab('metrics')} />
          <Tab label="Logs" active={activeTab === 'logs'} onChangeTab={() => setActiveTab('logs')} />
          <Tab label="Traces" active={activeTab === 'traces'} onChangeTab={() => setActiveTab('traces')} />
          <Tab label="Kubernetes" active={activeTab === 'k8s'} onChangeTab={() => setActiveTab('k8s')} />
          <Tab label="SLOs" active={activeTab === 'slos'} onChangeTab={() => setActiveTab('slos')} />
        </TabsBar>
        <TabContent style={{ marginTop: '16px' }}>
          {activeTab === 'metrics' && <MetricsTab incident={incident as any} />}
          {activeTab === 'logs' && <LogsTab incident={incident as any} />}
          {activeTab === 'traces' && <TracesTab incident={incident as any} />}
          {activeTab === 'k8s' && <KubernetesTab incident={incident as any} />}
          {activeTab === 'slos' && <SLOStatus services={affectedServices as any} />}
        </TabContent>
      </div>

      {/* OPERATOR ACTIONS: Acknowledge, Add Note, Mitigate, Resolve */}
      {incident.status !== 'resolved' && (
        <div className={styles.actionsSection}>
          <div className={styles.sectionTitle} style={{ width: '100%', marginBottom: '0' }}>Operator Actions</div>
          {incident.status === 'open' && (
            <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={handleAcknowledge}>
              Acknowledge Incident
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <input
              type="text"
              placeholder="Add note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                color: theme.text,
                fontSize: '13px',
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button className={styles.actionButton} onClick={handleAddNote} disabled={addingNote || !noteText.trim()}>
              {addingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
          {(incident.status === 'investigating' || incident.status === 'active') && (
            <button className={styles.actionButton} onClick={handleMitigate}>
              Mark Mitigated
            </button>
          )}
          {(incident.status === 'open' || incident.status === 'investigating' || incident.status === 'active' || incident.status === 'mitigated') && (
            <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={handleResolve}>
              Resolve Incident
            </button>
          )}
        </div>
      )}
    </div>
  );
};

