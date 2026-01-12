import React, { ReactNode } from 'react';
import { css } from '@emotion/css';

/**
 * State Type System for UI Components
 * 
 * This ensures every component explicitly handles:
 * - idle: Initial state, no data loaded
 * - loading: API call in progress
 * - success: Data loaded, display it
 * - error: API call failed, show error with retry
 * - empty: API succeeded but no data found
 */

export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface UIStateConfig {
  state: UIState;
  data?: any;
  error?: {
    message: string;
    code?: string;
    traceId?: string;
    retryable?: boolean;
  };
  onRetry?: () => void;
}

const theme = {
  bg: '#0b0c10',
  surface: '#1a1d23',
  border: '#2d333d',
  accent: '#00d2ff',
  text: '#e6e8eb',
  textMuted: '#9fa6b2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
};

const styles = {
  loadingContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  `,
  loadingSpinner: css`
    width: 40px;
    height: 40px;
    border: 3px solid ${theme.border};
    border-top: 3px solid ${theme.accent};
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
  emptyContainer: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    background: ${theme.surface};
    border: 1px dashed ${theme.border};
    border-radius: 8px;
    min-height: 300px;
  `,
  emptyIcon: css`
    font-size: 48px;
    margin-bottom: 16px;
  `,
  emptyTitle: css`
    font-size: 18px;
    font-weight: 600;
    color: ${theme.text};
    margin-bottom: 8px;
  `,
  emptyDescription: css`
    font-size: 14px;
    color: ${theme.textMuted};
    margin-bottom: 20px;
    max-width: 500px;
    line-height: 1.6;
  `,
  emptyAction: css`
    padding: 10px 20px;
    background: ${theme.accent};
    border: none;
    border-radius: 4px;
    color: ${theme.bg};
    font-weight: 600;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
  `,
  errorContainer: css`
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid ${theme.error};
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  `,
  errorTitle: css`
    font-size: 14px;
    font-weight: 600;
    color: ${theme.error};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  errorMessage: css`
    font-size: 13px;
    color: ${theme.textMuted};
    margin-bottom: 12px;
    font-family: 'Berkeley Mono', monospace;
    background: ${theme.bg};
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  `,
  errorDetails: css`
    font-size: 11px;
    color: ${theme.textMuted};
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 12px;
    margin-bottom: 12px;

    dt {
      font-weight: 600;
      color: ${theme.text};
    }

    dd {
      margin: 0;
      font-family: 'Berkeley Mono', monospace;
      word-break: break-all;
    }
  `,
  errorActions: css`
    display: flex;
    gap: 8px;
  `,
  button: css`
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &.primary {
      background: ${theme.accent};
      color: ${theme.bg};

      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    }

    &.secondary {
      background: ${theme.border};
      color: ${theme.text};

      &:hover {
        background: ${theme.surface};
      }
    }
  `,
};

/**
 * StateRenderer Component
 * 
 * Renders appropriate UI for each state:
 * - idle: Invisible (component waiting for action)
 * - loading: Spinner with message
 * - empty: Explanation of why no data + action to take
 * - error: Error with details, trace ID, and retry button
 * - success: Passes through to children
 * 
 * Usage:
 * ```tsx
 * <StateRenderer config={stateConfig}>
 *   <YourDataComponent data={data} />
 * </StateRenderer>
 * ```
 */
export function StateRenderer({
  config,
  children,
  emptyIcon = '📭',
  emptyTitle = 'No data yet',
  emptyDescription = 'The data you are looking for is not available.',
  emptyAction = null,
}: {
  config: UIStateConfig;
  children?: ReactNode;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; action: () => void } | null;
}) {
  switch (config.state) {
    case 'idle':
      return null;

    case 'loading':
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <div style={{ marginTop: '16px', color: theme.textMuted, fontSize: '14px' }}>
            Loading...
          </div>
        </div>
      );

    case 'empty':
      return (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>{emptyIcon}</div>
          <div className={styles.emptyTitle}>{emptyTitle}</div>
          <div className={styles.emptyDescription}>{emptyDescription}</div>
          {emptyAction && (
            <button
              className={styles.emptyAction}
              onClick={emptyAction.action}
            >
              {emptyAction.label}
            </button>
          )}
        </div>
      );

    case 'error':
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorTitle}>
            <span>❌</span>
            <span>Failed to load data</span>
          </div>
          <div className={styles.errorMessage}>
            {config.error?.message || 'An unknown error occurred'}
          </div>
          {(config.error?.code || config.error?.traceId) && (
            <dl className={styles.errorDetails}>
              {config.error?.code && (
                <>
                  <dt>Error Code:</dt>
                  <dd>{config.error.code}</dd>
                </>
              )}
              {config.error?.traceId && (
                <>
                  <dt>Trace ID:</dt>
                  <dd>{config.error.traceId}</dd>
                </>
              )}
            </dl>
          )}
          <div className={styles.errorActions}>
            {config.error?.retryable && config.onRetry && (
              <button
                className={`${styles.button} primary`}
                onClick={config.onRetry}
              >
                🔄 Retry
              </button>
            )}
            <button
              className={`${styles.button} secondary`}
              onClick={() => {
                console.log('Error details:', config.error);
                alert('Error details logged to console');
              }}
            >
              📋 Details
            </button>
          </div>
        </div>
      );

    case 'success':
      return <>{children}</>;

    default:
      return null;
  }
}

/**
 * Helper hook to manage API state
 */
export function useUIState<T>() {
  const [state, setState] = React.useState<UIState>('idle');
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<UIStateConfig['error'] | null>(null);

  const config: UIStateConfig = {
    state,
    data,
    error,
  };

  const handlers = {
    setLoading: () => setState('loading'),
    setSuccess: (newData: T) => {
      setData(newData);
      setState('success');
    },
    setEmpty: () => setState('empty'),
    setError: (message: string, code?: string, traceId?: string) => {
      setError({ message, code, traceId, retryable: true });
      setState('error');
    },
    reset: () => {
      setState('idle');
      setData(null);
      setError(null);
    },
  };

  return { config, data, handlers };
}
