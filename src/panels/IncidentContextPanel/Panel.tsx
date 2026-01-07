import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { IncidentQuery } from './types';
import { getIncidents } from '../../app/api/backend';

export const Panel: React.FC<PanelProps<IncidentQuery>> = () => {
  const [logs, setLogs] = useState<string>("");

  useEffect(() => {
    getIncidents().then((res) => {
      // Handle array response
      if (Array.isArray(res)) {
        setLogs(JSON.stringify(res, null, 2));
      } else if (typeof res === 'string') {
        setLogs(res);
      } else {
        setLogs(JSON.stringify(res, null, 2));
      }
    });
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <h4>Incident Context</h4>
      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
        {logs.slice(0, 1500)}
      </pre>
    </div>
  );
};
