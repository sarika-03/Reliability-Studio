import React from 'react';

export const ErrorTrend = ({ rate }: { rate?: number }) => {
  if (rate === undefined || rate === null) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Error Rate</h4>
        <p className="text-gray-600">No error data available. Waiting for telemetry metrics.</p>
      </div>
    );
  }

  return (
    <div>Error Rate: {rate}%</div>
  );
};
