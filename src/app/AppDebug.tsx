import React from 'react';
import { AppRootProps } from '@grafana/data';
import { useTheme2, Container, Alert } from '@grafana/ui';

/**
 * Debug version of App component - use this to test basic rendering
 * Replace setRootPage(App) with setRootPage(AppDebug) in module.tsx temporarily
 */
export const AppDebug = (props: AppRootProps<{}>) => {
  const theme = useTheme2();
  
  return (
    <Container>
      <Alert 
        title="✅ Plugin Loaded Successfully" 
        severity="success"
        topSpacing={4}
      >
        <div style={{ marginTop: '16px' }}>
          <p><strong>App Props:</strong></p>
          <pre style={{
            background: theme.colors.background.secondary,
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(props, null, 2)}
          </pre>
          
          <p style={{ marginTop: '16px' }}><strong>Next Steps:</strong></p>
          <ol>
            <li>If you see this message, plugin is rendering correctly</li>
            <li>Replace AppDebug with your App component</li>
            <li>Check console for any errors in IncidentControlRoom</li>
          </ol>
        </div>
      </Alert>
    </Container>
  );
};
