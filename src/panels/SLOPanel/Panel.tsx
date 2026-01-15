import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SLOQuery } from './types';
import { getSLO } from '../../app/api/backend';

export const Panel: React.FC<PanelProps<SLOQuery>> = () => {
  const [metrics, setMetrics] = useState<string>("");

  useEffect(() => {
    getSLO().then((res) => {
      // Handle array response
      if (Array.isArray(res)) {
        setMetrics(JSON.stringify(res, null, 2));
      } else if (typeof res === 'string') {
        setMetrics(res);
      } else {
        setMetrics(JSON.stringify(res, null, 2));
      }
    });
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <h4>SLO Metrics (Live)</h4>
      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
        {metrics.slice(0, 1200)}
      </pre>
    </div>
  );
};
