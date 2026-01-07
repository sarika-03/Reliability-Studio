import React, { ReactNode, ReactElement } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  public render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <h2 style={styles.title}>[WARNING] Something went wrong</h2>
            <p style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={styles.button}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children as ReactElement;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  errorBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
    maxWidth: '500px',
  } as React.CSSProperties,
  title: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    color: '#d32f2f',
  } as React.CSSProperties,
  message: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  } as React.CSSProperties,
  button: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  } as React.CSSProperties,
};
