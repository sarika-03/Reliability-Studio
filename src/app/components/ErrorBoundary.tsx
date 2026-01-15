import React, { ReactNode, ReactElement } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'section' | 'component'; // Error boundary scope
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  attemptNumber: number;
}

/**
 * Enhanced Error Boundary with graceful degradation support
 * - Page level: Shows full error page with reload button
 * - Section level: Shows error message while keeping rest of page functional
 * - Component level: Shows inline error without disrupting page
 */
export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, attemptNumber: 0 };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      // Keep only last 50 errors
      localStorage.setItem('errorLogs', JSON.stringify(logs.slice(-50)));
    } catch (e) {
      console.error('[ErrorBoundary] Failed to log error:', e);
    }

    this.setState((prev) => ({
      errorInfo,
      attemptNumber: prev.attemptNumber + 1,
    }));
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render(): ReactElement {
    if (this.state.hasError) {
      const { level = 'component' } = this.props;
      const { error } = this.state;

      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback as ReactElement;
      }

      // Graceful degradation based on error boundary level
      if (level === 'page') {
        return this.renderPageError();
      } else if (level === 'section') {
        return this.renderSectionError();
      } else {
        return this.renderComponentError();
      }
    }

    return this.props.children as ReactElement;
  }

  private renderPageError(): ReactElement {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>⚠️</div>
          <h1 style={styles.pageTitle}>Application Error</h1>
          <p style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          {this.state.errorInfo && (
            <details style={styles.details}>
              <summary style={styles.summary}>Error Details</summary>
              <pre style={styles.pre}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <div style={styles.buttonGroup}>
            <button onClick={this.handleRetry} style={{ ...styles.button, ...styles.retryButton }}>
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ ...styles.button, ...styles.reloadButton }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderSectionError(): ReactElement {
    return (
      <div style={styles.sectionContainer}>
        <div style={styles.sectionError}>
          <div style={styles.sectionIcon}>⚠️</div>
          <h3 style={styles.sectionTitle}>Section Unavailable</h3>
          <p style={styles.message}>
            {this.state.error?.message || 'This section encountered an error.'}
          </p>
          <button onClick={this.handleRetry} style={styles.button}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  private renderComponentError(): ReactElement {
    return (
      <div style={styles.componentError}>
        <span style={styles.componentIcon}>❌</span>
        <span style={styles.componentMessage}>
          {this.state.error?.message || 'Component error'}
        </span>
      </div>
    );
  }
}

const styles = {
  // Page-level error
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '16px',
  } as React.CSSProperties,
  errorBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '48px 32px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
    maxWidth: '600px',
    borderLeft: '4px solid #ef4444',
  } as React.CSSProperties,
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  } as React.CSSProperties,
  pageTitle: {
    margin: '0 0 12px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
  } as React.CSSProperties,
  sectionIcon: {
    fontSize: '32px',
    marginRight: '8px',
  } as React.CSSProperties,
  componentIcon: {
    fontSize: '16px',
    marginRight: '6px',
  } as React.CSSProperties,
  message: {
    margin: '0 0 24px 0',
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.6',
  } as React.CSSProperties,
  details: {
    marginBottom: '24px',
    textAlign: 'left' as const,
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  } as React.CSSProperties,
  pre: {
    margin: '0',
    fontSize: '12px',
    color: '#6b7280',
    overflow: 'auto',
    maxHeight: '200px',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  button: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s',
  } as React.CSSProperties,
  retryButton: {
    backgroundColor: '#10b981',
  } as React.CSSProperties,
  reloadButton: {
    backgroundColor: '#ef4444',
  } as React.CSSProperties,

  // Section-level error
  sectionContainer: {
    width: '100%',
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '8px',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  sectionError: {
    textAlign: 'center' as const,
    maxWidth: '400px',
  } as React.CSSProperties,
  sectionTitle: {
    margin: '8px 0 12px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  } as React.CSSProperties,

  // Component-level error
  componentError: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
  } as React.CSSProperties,
  componentMessage: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
};
