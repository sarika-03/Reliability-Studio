// src/components/SLOView.tsx
import React, { useEffect, useState } from 'react';

interface SLO {
  id: string;
  name: string;
  description: string;
  target: number;
  current?: number;
  status: 'healthy' | 'at-risk' | 'breached' | 'no-data';
  error_budget?: number;
  service: string;
  metric_type: string;
  threshold: number;
  window: string;
  last_calculated?: string;
  error_message?: string;
}

interface SLOError {
  type: 'no_data' | 'missing_metrics' | 'invalid_threshold' | 'query_failed' | 'unknown';
  message: string;
  details?: string;
  suggestions?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const SLOView: React.FC = () => {
  const [slos, setSLOs] = useState<SLO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSLO, setSelectedSLO] = useState<SLO | null>(null);
  const [sloError, setSLOError] = useState<SLOError | null>(null);

  useEffect(() => {
    fetchSLOs();
    const interval = setInterval(fetchSLOs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSLOs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/slos`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process SLOs and categorize errors
      const processedSLOs = Array.isArray(data) ? data.map((slo: any) => {
        if (!slo.current && slo.current !== 0) {
          return {
            ...slo,
            status: 'no-data',
            error_message: parseSLOError(slo)
          };
        }
        
        // Calculate status based on current vs target
        let status: SLO['status'] = 'healthy';
        if (slo.current < slo.target) {
          const deviation = ((slo.target - slo.current) / slo.target) * 100;
          if (deviation > 10) {
            status = 'breached';
          } else if (deviation > 5) {
            status = 'at-risk';
          }
        }
        
        return { ...slo, status };
      }) : [];
      
      setSLOs(processedSLOs);
      setError(null);
    } catch (err) {
      console.error('Error fetching SLOs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SLOs');
    } finally {
      setLoading(false);
    }
  };

  const parseSLOError = (slo: any): string => {
    // Try to extract meaningful error from backend response
    if (slo.error) {
      if (slo.error.includes('no data returned')) {
        return `No metrics data available for ${slo.service}. Check if the service is instrumented and sending metrics to Prometheus.`;
      }
      if (slo.error.includes('query failed')) {
        return `Prometheus query failed. The metric query may be invalid or the service may not exist.`;
      }
      if (slo.error.includes('threshold')) {
        return `Invalid threshold configuration. Please check SLO settings.`;
      }
      return slo.error;
    }
    return 'No data available. The SLO calculation could not be performed.';
  };

  const calculateSLO = async (sloId: string) => {
    try {
      setSLOError(null);
      const response = await fetch(`${API_BASE_URL}/api/slos/${sloId}/calculate`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate SLO');
      }

      const result = await response.json();
      
      // Check for specific error conditions
      if (!result.value && result.value !== 0) {
        const errorInfo = categorizeSLOError(result);
        setSLOError(errorInfo);
      } else {
        // Success - refresh SLOs
        await fetchSLOs();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSLOError({
        type: 'unknown',
        message: errorMessage,
        suggestions: [
          'Check if Prometheus is running and accessible',
          'Verify the service name is correct',
          'Ensure metrics are being collected'
        ]
      });
    }
  };

  const categorizeSLOError = (result: any): SLOError => {
    if (result.error?.includes('no data') || result.error?.includes('empty result')) {
      return {
        type: 'no_data',
        message: 'No metrics data returned from Prometheus',
        details: `The query for ${result.service || 'this service'} returned no data points.`,
        suggestions: [
          'Verify the service is running and instrumented',
          'Check if metrics are being scraped by Prometheus',
          'Confirm the time window has valid data',
          'Review the Prometheus query in SLO configuration'
        ]
      };
    }

    if (result.error?.includes('metric') || result.error?.includes('not found')) {
      return {
        type: 'missing_metrics',
        message: 'Required metrics are not available',
        details: `Prometheus does not have the required metrics for ${result.metric_type || 'this SLO'}.`,
        suggestions: [
          'Check if the service is exporting the correct metrics',
          'Verify metric names match the SLO configuration',
          'Ensure Prometheus scrape config includes this service',
          'Check Prometheus targets page for scrape errors'
        ]
      };
    }

    if (result.error?.includes('threshold')) {
      return {
        type: 'invalid_threshold',
        message: 'Invalid SLO threshold configuration',
        details: 'The configured threshold may be out of valid range or incorrectly formatted.',
        suggestions: [
          'Check SLO threshold is between 0 and 100',
          'Verify the metric type matches the threshold',
          'Review SLO configuration for typos'
        ]
      };
    }

    if (result.error?.includes('query')) {
      return {
        type: 'query_failed',
        message: 'Prometheus query execution failed',
        details: result.error,
        suggestions: [
          'Check Prometheus is running and accessible',
          'Verify the PromQL query syntax is valid',
          'Test the query directly in Prometheus UI',
          'Check Prometheus logs for errors'
        ]
      };
    }

    return {
      type: 'unknown',
      message: 'SLO calculation failed',
      details: result.error || 'Unknown error occurred',
      suggestions: [
        'Check backend logs for detailed error messages',
        'Verify all observability stack components are running',
        'Try recalculating the SLO'
      ]
    };
  };

  const getStatusColor = (status: SLO['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'breached':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'no-data':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: SLO['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'at-risk':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'breached':
        return (
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'no-data':
        return (
          <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading SLOs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Failed to load SLOs</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (slos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No SLOs configured</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new SLO to track service reliability
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Service Level Objectives ({slos.length})
        </h2>
        <button
          onClick={fetchSLOs}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {sloError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">{sloError.message}</h3>
              {sloError.details && (
                <p className="mt-2 text-sm text-blue-700">{sloError.details}</p>
              )}
              {sloError.suggestions && sloError.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-blue-800">Suggested fixes:</p>
                  <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                    {sloError.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slos.map((slo) => (
          <div
            key={slo.id}
            className={`border rounded-lg p-4 ${
              selectedSLO?.id === slo.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedSLO(slo)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {getStatusIcon(slo.status)}
                <h3 className="ml-2 text-lg font-medium text-gray-900">{slo.name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(slo.status)}`}>
                {slo.status.toUpperCase().replace('-', ' ')}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-3">{slo.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{slo.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium text-gray-900">{slo.target}%</span>
              </div>
              {slo.current !== undefined && slo.current !== null ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current:</span>
                    <span className={`font-medium ${
                      slo.status === 'healthy' ? 'text-green-600' :
                      slo.status === 'at-risk' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {slo.current.toFixed(2)}%
                    </span>
                  </div>
                  {slo.error_budget !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Error Budget:</span>
                      <span className="font-medium text-gray-900">{slo.error_budget.toFixed(2)}%</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-2">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-700">No Data Available</p>
                      <p className="text-xs text-gray-600 mt-1">{slo.error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  calculateSLO(slo.id);
                }}
                className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                Recalculate
              </button>
              {slo.last_calculated && (
                <span className="text-xs text-gray-500 self-center">
                  Last: {new Date(slo.last_calculated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
