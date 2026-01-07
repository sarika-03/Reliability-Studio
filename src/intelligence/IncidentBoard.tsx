import React, { useEffect, useState } from 'react';
import { getIncidents } from '../app/api/backend';
import { Incident } from '../models/Incident';
import { IncidentTimeline } from './IncidentTimeline';
import { RootCausePanel } from './RootCausePanel';
import { ImpactSummary } from './ImpactSummary';

export const IncidentBoard = () => {
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getIncidents();
      // Handle array or single incident
      setIncident(Array.isArray(data) && data.length > 0 ? data[0] : null);
    };
    load();
  }, []);

  if (!incident) return <div>Loading incident...</div>;

  return (
    <div>
      <h3>{incident.service || 'Unknown'} Incident</h3>
      <RootCausePanel cause={incident.root_cause || ''} />
      <ImpactSummary impact={incident.impact} />
      <IncidentTimeline events={incident.timeline} />
    </div>
  );
};
