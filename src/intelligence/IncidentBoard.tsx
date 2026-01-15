import React, { useEffect, useState } from 'react';
import { getIncidents } from '../app/api/backend';
import { Incident } from '../models/Incident';
import { IncidentTimeline } from './IncidentTimeline';
import { RootCausePanel } from './RootCausePanel';
import { ImpactSummary } from './ImpactSummary';

export const IncidentBoard = () => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getIncidents();
        // Handle array or single incident
        setIncident(Array.isArray(data) && data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error('Failed to load incidents:', error);
        setIncident(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-8">Loading incident...</div>;

  if (!incident) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Incidents Detected</h3>
        <p className="text-gray-600">Your services are running smoothly. No active incidents at this time.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>{incident.service || 'Unknown'} Incident</h3>
      <RootCausePanel cause={incident.root_cause || ''} />
      <ImpactSummary impact={incident.impact} />
      <IncidentTimeline events={incident.timeline} />
    </div>
  );
};
