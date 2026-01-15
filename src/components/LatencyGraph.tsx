import React from 'react';

export const LatencyGraph = ({ latency }: { latency?: number }) => {
  if (latency === undefined || latency === null) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Latency</h4>
        <p className="text-gray-600">No latency data available. Waiting for telemetry data from services.</p>
      </div>
    );
  }

  return (
    <div>Latency: {latency} ms</div>
  );
};
