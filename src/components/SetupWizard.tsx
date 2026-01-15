import React, { useState, useEffect } from 'react';
import { Button, Field, Input, Select, HorizontalGroup, VerticalGroup } from '@grafana/ui';
import { detectDatasources, validateRequiredDatasources, Datasource, DatasourceConfig } from '../utils/datasource-manager';

export interface SetupWizardProps {
  onComplete: (config: DatasourceConfig) => void;
  onSkip: () => void;
}

/**
 * Interactive setup wizard for first-time installation
 * Guides user through selecting required datasources
 */
export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<DatasourceConfig>({});
  const [preferences, setPreferences] = useState({
    defaultTimeRange: '1h',
    refreshInterval: '30s',
  });
  const [detectedDatasources, setDetectedDatasources] = useState<Array<{
    uid: string;
    name: string;
    type: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Detect available datasources
  useEffect(() => {
    const detectDatasourcesOnMount = async () => {
      try {
        setLoading(true);
        const detected = await detectDatasources();
        setConfig(detected);
        
        // Format for display
        const list = Object.entries(detected)
          .filter(([, ds]) => ds !== undefined)
          .map(([, ds]) => ({
            uid: ds!.uid,
            name: ds!.name,
            type: ds!.type,
          }));
        
        setDetectedDatasources(list);
        setError(null);
      } catch (e) {
        console.error('[SetupWizard] Error detecting datasources:', e);
        setError(e instanceof Error ? e.message : 'Failed to detect datasources');
      } finally {
        setLoading(false);
      }
    };

    detectDatasourcesOnMount();
  }, []);

  const validation = validateRequiredDatasources(config);
  const canProceed = validation.valid;

  const handleNext = () => {
    if (canProceed) {
      setStep(step + 1);
    }
  };

  const handleComplete = () => {
    if (canProceed) {
      onComplete(config);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome to Reliability Studio</h2>
          <p style={styles.subtitle}>Let's set up your monitoring configuration</p>
        </div>

        {/* Progress indicator */}
        <div style={styles.progress}>
          <div style={{ ...styles.step, ...(step >= 1 ? styles.stepActive : {}) }}>
            <span style={styles.stepNumber}>1</span>
            <span style={styles.stepLabel}>Datasources</span>
          </div>
          <div style={styles.progressLine} />
          <div style={{ ...styles.step, ...(step >= 2 ? styles.stepActive : {}) }}>
            <span style={styles.stepNumber}>2</span>
            <span style={styles.stepLabel}>Preferences</span>
          </div>
          <div style={styles.progressLine} />
          <div style={{ ...styles.step, ...(step >= 3 ? styles.stepActive : {}) }}>
            <span style={styles.stepNumber}>3</span>
            <span style={styles.stepLabel}>Complete</span>
          </div>
        </div>

        {/* Content */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>Select Your Datasources</h3>
            <p style={styles.stepDescription}>
              We found {detectedDatasources.length} datasource{detectedDatasources.length !== 1 ? 's' : ''}.
              {detectedDatasources.length === 0 && ' Please configure datasources in Grafana first.'}
            </p>

            {error && (
              <div style={styles.errorBox}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {loading ? (
              <p>Detecting datasources...</p>
            ) : (
              <VerticalGroup spacing="lg">
                {detectedDatasources.length > 0 ? (
                  <>
                    <p style={styles.infoBox}>
                      ✓ Detected {detectedDatasources.length} datasource{detectedDatasources.length !== 1 ? 's' : ''}
                    </p>
                    <div style={styles.datasourceList}>
                      {detectedDatasources.map((ds) => (
                        <div key={ds.uid} style={styles.datasourceItem}>
                          <span style={styles.datasourceName}>{ds.name}</span>
                          <span style={styles.datasourceType}>{ds.type.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={styles.warningBox}>
                    ⚠️ No datasources detected. Please add at least Prometheus in Grafana configuration.
                  </p>
                )}

                {validation.missingRequired.length > 0 && (
                  <div style={styles.errorBox}>
                    <strong>Missing required:</strong> {validation.missingRequired.join(', ')}
                  </div>
                )}

                {validation.missingOptional.length > 0 && (
                  <div style={styles.warningBox}>
                    <strong>Optional (features may be limited):</strong> {validation.missingOptional.join(', ')}
                  </div>
                )}
              </VerticalGroup>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>Preferences</h3>
            <VerticalGroup spacing="lg">
              <Field label="Default Time Range">
                <Select
                  options={[
                    { label: 'Last 5 minutes', value: '5m' },
                    { label: 'Last 15 minutes', value: '15m' },
                    { label: 'Last hour', value: '1h' },
                    { label: 'Last 6 hours', value: '6h' },
                    { label: 'Last 24 hours', value: '24h' },
                  ]}
                  defaultValue={{ label: 'Last hour', value: '1h' }}
                  onChange={(option) => {
                    setPreferences({ ...preferences, defaultTimeRange: (option as any).value });
                  }}
                />
              </Field>
              <Field label="Refresh Interval">
                <Select
                  options={[
                    { label: '5 seconds', value: '5s' },
                    { label: '10 seconds', value: '10s' },
                    { label: '30 seconds', value: '30s' },
                    { label: '1 minute', value: '1m' },
                    { label: 'Manual', value: '0' },
                  ]}
                  defaultValue={{ label: '30 seconds', value: '30s' }}
                  onChange={(option) => {
                    setPreferences({ ...preferences, refreshInterval: (option as any).value });
                  }}
                />
              </Field>
            </VerticalGroup>
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>Setup Complete!</h3>
            <div style={styles.successBox}>
              <p style={styles.successText}>✓ Reliability Studio is ready to use</p>
              <p style={styles.successSubtext}>
                You can now create SLOs, monitor incidents, and analyze your system reliability.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <HorizontalGroup justify="space-between" style={styles.actions}>
          <HorizontalGroup>
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)} variant="secondary">
                Back
              </Button>
            )}
            <Button onClick={onSkip} variant="secondary">
              Skip Setup
            </Button>
          </HorizontalGroup>
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed && step === 1}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={!canProceed}>
              Get Started
            </Button>
          )}
        </HorizontalGroup>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    padding: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '48px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#111827',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  progress: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '48px',
    gap: '8px',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  stepActive: {
    color: '#3b82f6',
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    fontWeight: '600',
    fontSize: '18px',
    color: '#6b7280',
  },
  stepLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
  },
  progressLine: {
    flex: 1,
    height: '2px',
    backgroundColor: '#e5e7eb',
    margin: '0 8px',
  },
  stepContent: {
    marginBottom: '48px',
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#111827',
  },
  stepDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#991b1b',
  },
  warningBox: {
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#92400e',
  },
  infoBox: {
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1e40af',
    margin: '16px 0',
  },
  datasourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  datasourceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  datasourceName: {
    fontWeight: '500',
    color: '#111827',
  },
  datasourceType: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    background: '#f3f4f6',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  successBox: {
    background: '#ecfdf5',
    border: '1px solid #d1fae5',
    borderRadius: '8px',
    padding: '24px 16px',
    textAlign: 'center',
  },
  successText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#047857',
    margin: '0 0 8px 0',
  },
  successSubtext: {
    fontSize: '14px',
    color: '#10b981',
    margin: 0,
  },
  actions: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
};
