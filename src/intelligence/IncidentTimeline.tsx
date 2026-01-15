import React from 'react';

export const IncidentTimeline = ({ events }: any) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Timeline</h4>
        <p className="text-gray-600">No timeline events available. No activity detected for this incident.</p>
      </div>
    );
  }

  return (
    <div>
      <h4>Timeline</h4>
      {events.map((e: any, i: number) => (
        <div key={i}>
          <strong>{new Date(e.time).toLocaleTimeString()}</strong> — {e.source}: {e.message}
        </div>
      ))}
    </div>
  );
};
