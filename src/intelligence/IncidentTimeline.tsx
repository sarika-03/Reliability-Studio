import React from 'react';

export const IncidentTimeline = ({ events }: any) => (
  <div>
    <h4>Timeline</h4>
    {events.map((e: any, i: number) => (
      <div key={i}>
        <strong>{new Date(e.time).toLocaleTimeString()}</strong> — {e.source}: {e.message}
      </div>
    ))}
  </div>
);
