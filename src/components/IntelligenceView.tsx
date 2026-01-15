import React, { useState, useEffect } from 'react';
import { css, keyframes } from '@emotion/css';
import { backendAPI } from '../app/api/backend';
import { ARALogs } from './ARALogs';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const styles = {
  container: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: ${fadeIn} 0.4s ease-out;
  `,
  insightCard: css`
    background: #1a1d23;
    border: 1px solid #2d333d;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #2d333d;
    padding-bottom: 15px;
  `,
  title: css`
    font-size: 18px;
    font-weight: 700;
    color: #00d2ff;
    display: flex;
    align-items: center;
    gap: 10px;
  `,
  confidence: (val: number) => css`
    font-size: 12px;
    font-weight: 600;
    color: ${val > 0.7 ? '#4caf50' : '#ff9800'};
    background: ${val > 0.7 ? '#4caf5020' : '#ff980020'};
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid ${val > 0.7 ? '#4caf5040' : '#ff980040'};
  `,
  section: css`
    margin-bottom: 24px;
  `,
  sectionTitle: css`
    font-size: 14px;
    font-weight: 600;
    color: #9fa6b2;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  rcaHint: css`
    font-size: 16px;
    font-weight: 500;
    line-height: 1.6;
    color: #e6e8eb;
    background: #0b0c10;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #00d2ff;
  `,
  fixList: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `,
  fixItem: css`
    background: #0b0c10;
    border: 1px solid #2d333d;
    padding: 12px 16px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
    
    &:hover {
      border-color: #00d2ff;
      background: #16191e;
    }
  `,
  fixText: css`
    font-size: 14px;
    color: #e6e8eb;
  `,
  actionButton: (executing: boolean) => css`
    background: ${executing ? '#2d333d' : '#00d2ff'};
    color: ${executing ? '#9fa6b2' : '#0b0c10'};
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    cursor: ${executing ? 'not-allowed' : 'pointer'};
    transition: transform 0.1s;
    
    &:hover {
      transform: ${executing ? 'none' : 'scale(1.05)'};
    }
  `,
  loading: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    gap: 20px;
    color: #9fa6b2;
  `,
  spinner: css`
    width: 32px;
    height: 32px;
    border: 3px solid #00d2ff20;
    border-top: 3px solid #00d2ff;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
  `
};

interface IntelligenceViewProps {
  incidentId: string;
  service: string;
}

export function IntelligenceView({ incidentId, service }: IntelligenceViewProps) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntelligence();
  }, [incidentId]);

  const loadIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backendAPI.incidents.getIntelligence(incidentId);
      setInsight(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  };

  const runRemediation = async (actionType: string, fixTitle: string) => {
    setExecuting(fixTitle);
    try {
      // Map fix UI text to technical backend actions
      let type = "k8s_restart";
      if (fixTitle.toLowerCase().includes('scale')) type = "k8s_scale";

      await backendAPI.incidents.remediate(incidentId, {
        action_type: type,
        target: service,
        namespace: 'default'
      });
      alert(`✅ Remediation triggered: ${fixTitle}`);
    } catch (err) {
      alert(`❌ Failed to run remediation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Deep analyzing incident logs and metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.insightCard}>
        <div style={{ color: '#f44336' }}>❌ Analysis error: {error}</div>
        <button onClick={loadIntelligence} style={{ marginTop: '10px' }}>Retry Analysis</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ARALogs incidentId={incidentId} />
      <div className={styles.insightCard}>
        <div className={styles.header}>
          <div className={styles.title}>
            <span>🤖 AI Assistant Insight</span>
          </div>
          {insight && <div className={styles.confidence(insight.confidence)}>
            {Math.round(insight.confidence * 100)}% Confidence
          </div>}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Automated Root Cause Hint</div>
          <div className={styles.rcaHint}>
            {insight?.root_cause_hint || "No clear root cause detected in logs yet."}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Suggested Remediation Actions</div>
          <div className={styles.fixList}>
            {insight?.suggested_fixes?.map((fix: string, idx: number) => (
              <div key={idx} className={styles.fixItem}>
                <span className={styles.fixText}>{fix}</span>
                <button
                  className={styles.actionButton(executing === fix)}
                  disabled={executing !== null}
                  onClick={() => runRemediation('k8s_restart', fix)}
                >
                  {executing === fix ? 'Executing...' : 'Run Fix'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
