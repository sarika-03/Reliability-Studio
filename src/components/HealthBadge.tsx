import React from 'react';

export const HealthBadge = ({ status }: { status: string }) => {
  const color =
    status === 'critical' ? '#991b1b' : status === 'warning' ? '#92400e' : '#14532d';

  return <span style={{ padding: 6, background: color }}>{status}</span>;
};
