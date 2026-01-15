import React from 'react';

export const RootCausePanel = ({ cause }: { cause?: string }) => {
  if (!cause || cause.trim() === '') {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Root Cause</h4>
        <p className="text-gray-600">Root cause analysis in progress. Correlation engine is gathering data.</p>
      </div>
    );
  }

  return (
    <div>
      <h4>Root Cause</h4>
      <p>{cause}</p>
    </div>
  );
};
