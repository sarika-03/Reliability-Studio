import React from 'react';
import { AppRootProps } from '@grafana/data';
import { IncidentControlRoom } from '../components/IncidentControlRoom';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App = (props: AppRootProps) => {
  React.useEffect(() => {
    console.log('[App] Component mounted with props:', props);
    return () => console.log('[App] Component unmounted');
  }, []);

  return (
    <ErrorBoundary level="page">
      <div className="page-container" style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <IncidentControlRoom />
      </div>
    </ErrorBoundary>
  );
};