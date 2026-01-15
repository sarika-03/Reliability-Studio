import React, { useEffect, useState } from 'react';
import { Service } from '../../models/Service';
import { backendAPI } from '../api/backend';

interface SLOStatusProps {
  services?: Service[];
}

interface SLOAnalysis {
  slo: {
    id: string;
    name: string;
    target_percentage: number;
    current_percentage: number;
    error_budget_remaining: number;
    status: string;
  };
  burn_rates: Array<{
    window: string;
    burn_rate: number;
    threshold: number;
    breached: boolean;
  }>;
}

export const SLOStatus: React.FC<SLOStatusProps> = ({ services = [] }) => {
  const [sloAnalyses, setSloAnalyses] = useState<Record<string, SLOAnalysis | null>>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!services || services.length === 0) return;
      setLoading(true);
      const results: Record<string, SLOAnalysis | null> = {};
      try {
        // For now, fetch SLOs for the first service only (primary impact)
        const primary = services[0];
        const slos = await backendAPI.slos.list();
        const byService = slos.filter((s: any) => s.service_id === primary.id);
        for (const slo of byService) {
          try {
            const analysis = await backendAPI.slos.calculate(slo.id);
            results[slo.id] = analysis as SLOAnalysis;
          } catch (e) {
            console.error('Failed to calculate SLO', e);
            results[slo.id] = null;
          }
        }
      } finally {
        setSloAnalyses(results);
        setLoading(false);
      }
    };
    load();
  }, [services]);
  const getSLOStatusColor = (remaining: number) => {
    if (remaining < 25) return '#d32f2f';
    if (remaining < 50) return '#f57c00';
    return '#388e3c';
  };

  const primaryService = services[0];

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>SLO Status</h3>
      {loading ? (
        <p style={styles.empty}>Calculating SLOs…</p>
      ) : !primaryService ? (
        <p style={styles.empty}>No SLO data available</p>
      ) : (
        <div style={styles.list}>
          <div style={styles.serviceSection}>
            <div style={styles.serviceName}>{primaryService.name}</div>
            {Object.keys(sloAnalyses).length === 0 ? (
              <p style={styles.noSLO}>No SLOs configured</p>
            ) : (
              Object.entries(sloAnalyses).map(([id, analysis]) => {
                if (!analysis) return null;
                const slo = analysis.slo;
                return (
                  <div key={id} style={styles.sloCard}>
                    <div style={styles.sloName}>{slo.name}</div>
                    <div style={styles.sloMeta}>
                      <span>Target: {slo.target_percentage}%</span>
                      <span>Current: {slo.current_percentage.toFixed(2)}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.min(Math.max(slo.error_budget_remaining, 0), 100)}%`,
                          backgroundColor: getSLOStatusColor(slo.error_budget_remaining),
                        }}
                      />
                    </div>
                    <div style={styles.budgetText}>
                      Error Budget: {slo.error_budget_remaining.toFixed(1)}%
                    </div>
                    {analysis.burn_rates && analysis.burn_rates.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
                        Burn rates:{' '}
                        {analysis.burn_rates.map((br) => (
                          <span key={br.window} style={{ marginRight: 8 }}>
                            {br.window}: {br.burn_rate.toFixed(2)}x{br.breached ? ' (breached)' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  serviceSection: {
    padding: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  serviceName: {
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '8px',
  } as React.CSSProperties,
  sloCard: {
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  sloName: {
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '4px',
  } as React.CSSProperties,
  sloMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  progressBar: {
    height: '8px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  } as React.CSSProperties,
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  budgetText: {
    fontSize: '11px',
    color: '#999',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: '13px',
  } as React.CSSProperties,
  noSLO: {
    fontSize: '12px',
    color: '#999',
    margin: '4px 0 0 0',
  } as React.CSSProperties,
};
