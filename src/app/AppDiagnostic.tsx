/**
 * QUICK DIAGNOSTIC: Minimal Test Component
 * 
 * Use this to verify your plugin loads correctly.
 * If you see this component, your plugin architecture is working.
 * If you don't see it, there's a build/registration issue.
 */

import React from 'react';
import { AppRootProps } from '@grafana/data';
import { Alert, Container, Button, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const AppDiagnostic = (props: AppRootProps<{}>) => {
  const theme = useTheme2();
  const [showDetails, setShowDetails] = React.useState(false);

  const styles = css`
    padding: 20px;
    background: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    min-height: 100vh;
  `;

  return (
    <Container>
      <div className={styles}>
        {/* VISUAL PROOF OF LOADING */}
        <Alert 
          title="✅ PLUGIN LOADED SUCCESSFULLY" 
          severity="success"
          topSpacing={3}
        >
          <div style={{ marginTop: '16px', lineHeight: '1.6' }}>
            <p>
              <strong>If you see this message:</strong> Your plugin loads correctly! 🎉
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong>This proves:</strong>
            </p>
            <ul style={{ marginLeft: '20px' }}>
              <li>✅ plugin.json is registered correctly</li>
              <li>✅ module.tsx exports properly</li>
              <li>✅ dist/module.js built successfully</li>
              <li>✅ Grafana found your plugin</li>
            </ul>

            {showDetails && (
              <div style={{
                background: theme.colors.background.secondary,
                padding: '12px',
                borderRadius: '4px',
                marginTop: '16px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                <p><strong>Plugin Props:</strong></p>
                <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(props, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Button 
                onClick={() => setShowDetails(!showDetails)}
                variant="secondary"
              >
                {showDetails ? 'Hide' : 'Show'} Plugin Details
              </Button>
            </div>

            <div style={{ marginTop: '24px', borderTop: `1px solid ${theme.colors.border.weak}`, paddingTop: '16px' }}>
              <p><strong>If you DON'T see this message:</strong></p>
              <ol style={{ marginLeft: '20px' }}>
                <li>Check browser console (F12 → Console) for errors</li>
                <li>Verify dist/module.js exists: <code>ls -la dist/</code></li>
                <li>Check Network tab (F12 → Network) for module.js loading</li>
                <li>Hard refresh: <strong>Ctrl+Shift+R</strong> (Windows) or <strong>Cmd+Shift+R</strong> (Mac)</li>
              </ol>
            </div>

            <div style={{ marginTop: '24px', borderTop: `1px solid ${theme.colors.border.weak}`, paddingTop: '16px' }}>
              <p><strong>To return to your actual component:</strong></p>
              <p style={{ marginTop: '8px' }}>
                In <code>src/module.tsx</code>, change:
              </p>
              <pre style={{
                background: theme.colors.background.secondary,
                padding: '12px',
                borderRadius: '4px',
                marginTop: '8px',
                overflow: 'auto'
              }}>
{`// FROM (diagnostic mode):
.setRootPage(AppDiagnostic);

// TO (normal mode):
.setRootPage(App);`}
              </pre>
            </div>
          </div>
        </Alert>
      </div>
    </Container>
  );
};
