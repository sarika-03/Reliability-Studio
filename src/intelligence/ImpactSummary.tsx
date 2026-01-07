import React from 'react';
import { Impact } from '../models/Impact';

export const ImpactSummary = ({ impact }: { impact: Impact }) => (
  <div>
    <h4>Impact</h4>
    <div>Error Rate: {impact.errorRate}%</div>
    <div>Bad Pods: {impact.badPods}</div>
    <div>SLO Affected: {impact.sloAffected ? 'Yes' : 'No'}</div>
  </div>
);
