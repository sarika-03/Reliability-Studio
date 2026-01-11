import React from 'react';
import { IncidentControlRoom } from '../components/IncidentControlRoom';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <div style={{ height: '100%', width: '100%' }}>
        <IncidentControlRoom />
      </div>
    </ErrorBoundary>
  );
};