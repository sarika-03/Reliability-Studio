import React from 'react';
import { Impact } from '../models/Impact';

export const ImpactSummary = ({ impact }: { impact?: Impact }) => {
  if (!impact) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Impact</h4>
        <p className="text-gray-600">Impact data not available. No metrics detected yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h4>Impact</h4>
      <div>Error Rate: {impact.errorRate}%</div>
      <div>Bad Pods: {impact.badPods}</div>
      <div>SLO Affected: {impact.sloAffected ? 'Yes' : 'No'}</div>
    </div>
  );
};
