import React from 'react';
import { css } from '@emotion/css';
import { AlertSummary } from '../components/AlertSummary';
import { K8sStatus } from '../components/K8sStatus';

export const Overview = () => (
  <div className={section}>
    <h3>System Overview</h3>
    <AlertSummary />
    <K8sStatus />
  </div>
);

const section = css`
  margin-bottom: 32px;
`;
