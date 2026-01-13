// src/components/CorrelationView.tsx
import React, { useEffect, useState } from 'react';
import { useIncidents } from '../contexts/IncidentContext';

interface MetricsData {
  timestamp: string;
  value: number;
  service: string;
}

interface CorrelationData {
  metrics: MetricsData[];
  logs: any[];
  traces: any[];
  correlations: {
    type: string;
    source: string;
    target: string;
    confidence: number;
  }[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const CorrelationView: React.FC = () => {
  const { selectedIncident } = useIncidents();
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedIncident) {
      setCorrelationData(null);
      return;
    }

    const fetchCorrelationData = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, verify incident exists and has required context
        const incidentRes = await fetch(`${API_BASE_URL}/api/incidents/${selectedIncident.id}`);

        if (!incidentRes.ok) {
          throw new Error('Incident not found or no longer exists');
        }

        const incidentData = await incidentRes.json();

        // Check if incident has minimum required context
        if (!incidentData.service || incidentData.service === 'unknown') {
          setError('Cannot perform correlation: Incident has no associated service. Please update the incident with service information.');
          setLoading(false);
          return;
        }

        if (!incidentData.started_at) {
          setError('Cannot perform correlation: Incident has no timestamp. Correlation requires a time window to analyze.');
          setLoading(false);
          return;
        }

        // Fetch metrics, logs, and traces for the selected incident
        const [metricsRes, logsRes, tracesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/incidents/${selectedIncident.id}/metrics`),
          fetch(`${API_BASE_URL}/api/incidents/${selectedIncident.id}/logs`),
          fetch(`${API_BASE_URL}/api/incidents/${selectedIncident.id}/traces`),
        ]);

        const metrics = metricsRes.ok ? await metricsRes.json() : [];
        const logs = logsRes.ok ? await logsRes.json() : [];
        const traces = tracesRes.ok ? await tracesRes.json() : [];

        // Fetch correlation analysis
        const correlationRes = await fetch(
          `${API_BASE_URL}/api/incidents/${selectedIncident.id}/correlations`
        );
        const correlations = correlationRes.ok ? await correlationRes.json() : [];

        // Check if we have any data at all
        const hasData =
          (Array.isArray(metrics) && metrics.length > 0) ||
          (Array.isArray(logs) && logs.length > 0) ||
          (Array.isArray(traces) && traces.length > 0);

        if (!hasData) {
          setError('No observability data found for this incident. Metrics, logs, and traces are not available. This may indicate the service is not instrumented or data collection is delayed.');
        }

        setCorrelationData({
          metrics: Array.isArray(metrics) ? metrics : [],
          logs: Array.isArray(logs) ? logs : [],
          traces: Array.isArray(traces) ? traces : [],
          correlations: Array.isArray(correlations) ? correlations : [],
        });
      } catch (err) {
        console.error('Error fetching correlation data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load correlation data. Please try again or check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelationData();
  }, [selectedIncident]);

  if (!selectedIncident) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Select an incident</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose an incident from the list to view correlation data
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading correlation data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Correlation Analysis
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Incident: {selectedIncident.title}
        </p>
      </div>

      {/* Metrics Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Metrics ({correlationData?.metrics?.length || 0})
        </h3>
        {correlationData?.metrics && correlationData.metrics.length > 0 ? (
          <div className="space-y-2">
            {correlationData.metrics.slice(0, 5).map((metric, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="text-sm font-medium text-gray-900">{metric.service}</span>
                  <span className="text-xs text-gray-500 ml-2">{new Date(metric.timestamp).toLocaleString()}</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{metric.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No metrics data available</p>
        )}
      </div>

      {/* Logs Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Logs ({correlationData?.logs?.length || 0})
        </h3>
        {correlationData?.logs && correlationData.logs.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {correlationData.logs.slice(0, 10).map((log, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded font-mono text-xs">
                {typeof log === 'string' ? log : JSON.stringify(log)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No logs data available</p>
        )}
      </div>

      {/* Traces Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Traces ({correlationData?.traces?.length || 0})
        </h3>
        {correlationData?.traces && correlationData.traces.length > 0 ? (
          <div className="space-y-2">
            {correlationData.traces.slice(0, 5).map((trace, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-900 font-medium">{trace.name || `Trace ${idx + 1}`}</div>
                <div className="text-xs text-gray-500 mt-1">{trace.duration || 'N/A'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No traces data available</p>
        )}
      </div>

      {/* Correlations Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Detected Correlations ({correlationData?.correlations?.length || 0})
        </h3>
        {correlationData?.correlations && correlationData.correlations.length > 0 ? (
          <div className="space-y-3">
            {correlationData.correlations.map((corr, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">{corr.type}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${corr.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                      corr.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {(corr.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="text-sm text-gray-900">
                  <span className="font-medium">{corr.source}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-medium">{corr.target}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No correlations detected</p>
        )}
      </div>
    </div>
  );
};