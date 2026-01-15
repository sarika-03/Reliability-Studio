import React, { useState, useEffect } from 'react';

export const AlertSummary = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading alerts - replace with real API call
    const timer = setTimeout(() => {
      setAlerts([]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div>Loading alerts...</div>;
  }

  if (alerts.length === 0) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #0ea5e9' }}>
        <div style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ System Healthy</div>
        <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>No critical alerts detected. All monitored services are operating within SLO thresholds.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ {alerts.length} Alert(s)</div>
      {alerts.map((alert: any) => (
        <div key={alert.id}>{alert.message}</div>
      ))}
    </div>
  );
};
