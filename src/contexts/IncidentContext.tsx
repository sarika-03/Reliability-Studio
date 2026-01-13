// src/contexts/IncidentContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved';
  createdAt: string;
  updatedAt: string;
  affectedServices: string[];
  metrics?: any;
  logs?: any[];
  traces?: any[];
}

interface IncidentContextType {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  selectedIncident: Incident | null;
  refreshIncidents: () => Promise<void>;
  selectIncident: (incident: Incident | null) => void;
  createIncident: (incident: Partial<Incident>) => Promise<void>;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const POLL_INTERVAL = 5000; // 5 seconds

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      console.log('Fetching incidents from:', `${API_BASE_URL}/api/incidents/active`);
      
      const response = await fetch(`${API_BASE_URL}/api/incidents/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received incidents:', data);

      // Handle both array and object responses
      const incidentList = Array.isArray(data) ? data : data.incidents || [];
      setIncidents(incidentList);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch incidents';
      console.error('Error fetching incidents:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshIncidents = useCallback(async () => {
    await fetchIncidents();
  }, [fetchIncidents]);

  const selectIncident = useCallback((incident: Incident | null) => {
    setSelectedIncident(incident);
  }, []);

  const createIncident = useCallback(async (incident: Partial<Incident>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incident),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh incidents after creation
      await fetchIncidents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create incident';
      console.error('Error creating incident:', errorMessage);
      throw err;
    }
  }, [fetchIncidents]);

  // Initial fetch and polling
  useEffect(() => {
    fetchIncidents();

    // Set up polling
    const interval = setInterval(fetchIncidents, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const value: IncidentContextType = {
    incidents,
    loading,
    error,
    selectedIncident,
    refreshIncidents,
    selectIncident,
    createIncident,
  };

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
