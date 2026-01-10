const API_BASE = "http://localhost:9000/api";

import { retry, isRetryableError } from '../../utils/retry-logic';
import { circuitBreakerManager } from '../../utils/circuit-breaker';

interface FetchOptions extends RequestInit {
  body?: any;
  serviceName?: string; // For circuit breaker
}

interface ApiError {
  status: number;
  message: string;
  isTokenExpired: boolean;
}

class ApiErrorHandler {
  static async handle(response: Response): Promise<ApiError> {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    
    // Check for 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      return {
        status: response.status,
        message: 'Your session has expired. Please login again.',
        isTokenExpired: true,
      };
    }

    // Check for 429 Too Many Requests (rate limited)
    if (response.status === 429) {
      return {
        status: response.status,
        message: 'Too many requests. Please wait a moment and try again.',
        isTokenExpired: false,
      };
    }

    // Check for 403 Forbidden (account locked or insufficient permissions)
    if (response.status === 403) {
      return {
        status: response.status,
        message: 'Access forbidden. Your account may be locked due to failed login attempts.',
        isTokenExpired: false,
      };
    }

    return {
      status: response.status,
      message: errorData.error || `API error: ${response.statusText}`,
      isTokenExpired: false,
    };
  }
}

// Global error callback for token expiration
let onTokenExpired: (() => void) | null = null;

export function setTokenExpiredCallback(callback: () => void) {
  onTokenExpired = callback;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { body, serviceName = 'backend-api', ...customConfig } = options;
  
  // Get token from localStorage
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...customConfig.headers,
  };

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Use retry logic with circuit breaker
  return retry(
    async () => {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        const apiError = await ApiErrorHandler.handle(response);
        
        // Handle token expiration globally
        if (apiError.isTokenExpired) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          if (onTokenExpired) {
            onTokenExpired();
          }
        }
        
        const error = new Error(apiError.message) as Error & { status?: number; isTokenExpired?: boolean };
        error.status = apiError.status;
        error.isTokenExpired = apiError.isTokenExpired;
        
        // Don't retry non-retryable errors
        if (!isRetryableError(error) && apiError.status !== 503) {
          throw error;
        }
        
        throw error;
      }
      
      return await response.json();
    },
    serviceName,
    { maxAttempts: 3, initialDelay: 1000, maxDelay: 8000 }
  ).then(result => {
    if (result.success && result.data) {
      return result.data as T;
    }
    throw result.error || new Error('Failed to fetch data');
  });
}

export const backendAPI = {
  auth: {
    login: (username: string, password: string) => 
      apiFetch<{ access_token: string; user: any }>("/auth/login", { 
        method: 'POST', 
        body: { username, password } 
      }),
    register: (username: string, email: string, password: string) =>
      apiFetch<{ user_id: string; username: string }>("/auth/register", {
        method: 'POST',
        body: { username, email, password }
      }),
    refresh: () =>
      apiFetch<{ access_token: string }>("/auth/refresh", { method: 'POST' }),
  },
  incidents: {
    list: () => apiFetch<any[]>("/incidents"),
    get: (id: string) => apiFetch<any>(`/incidents/${id}`),
    create: (data: any) => apiFetch<any>("/incidents", { method: 'POST', body: data }),
    update: (id: string, data: any) => apiFetch<any>(`/incidents/${id}`, { method: 'PATCH', body: data }),
    getTimeline: (id: string) => apiFetch<any[]>(`/incidents/${id}/timeline`),
    getCorrelations: (id: string) => apiFetch<any[]>(`/incidents/${id}/correlations`),
  },
  services: {
    list: () => apiFetch<any[]>("/services"),
    get: (id: string) => apiFetch<any>(`/services/${id}`),
    create: (data: any) => apiFetch<any>("/services", { method: 'POST', body: data }),
    update: (id: string, data: any) => apiFetch<any>(`/services/${id}`, { method: 'PATCH', body: data }),
  },
  slos: {
    list: () => apiFetch<any[]>("/slos"),
    get: (id: string) => apiFetch<any>(`/slos/${id}`),
    create: (data: any) => apiFetch<any>("/slos", { method: 'POST', body: data }),
    update: (id: string, data: any) => apiFetch<any>(`/slos/${id}`, { method: 'PATCH', body: data }),
    delete: (id: string) => apiFetch<any>(`/slos/${id}`, { method: 'DELETE' }),
    calculate: (id: string) => apiFetch<any>(`/slos/${id}/calculate`, { method: 'POST' }),
    getHistory: (id: string) => apiFetch<any[]>(`/slos/${id}/history`),
  },
  metrics: {
    getAvailability: (service: string) => apiFetch<any>(`/metrics/availability/${service}`),
    getErrorRate: (service: string) => apiFetch<any>(`/metrics/error-rate/${service}`),
    getLatency: (service: string) => apiFetch<any>(`/metrics/latency/${service}`),
  },
  kubernetes: {
    getPods: (ns: string, svc: string) => apiFetch<any[]>(`/kubernetes/pods/${ns}/${svc}`),
    getDeployments: (ns: string, svc: string) => apiFetch<any[]>(`/kubernetes/deployments/${ns}/${svc}`),
    getEvents: (ns: string, svc: string) => apiFetch<any[]>(`/kubernetes/events/${ns}/${svc}`),
  },
  logs: {
    getErrors: (service: string) => apiFetch<any[]>(`/logs/${service}/errors`),
    search: (service: string, query: string) => apiFetch<any[]>(`/logs/${service}/search?q=${encodeURIComponent(query)}`),
  },
  detection: {
    getRules: () => apiFetch<any>("/detection/rules"),
    getStatus: () => apiFetch<any>("/detection/status"),
  },
  investigation: {
    getHypotheses: (incidentId: string) => apiFetch<any[]>(`/incidents/${incidentId}/investigation/hypotheses`),
    createHypothesis: (incidentId: string, data: any) => apiFetch<any>(`/incidents/${incidentId}/investigation/hypotheses`, { method: 'POST', body: data }),
    getSteps: (incidentId: string) => apiFetch<any[]>(`/incidents/${incidentId}/investigation/steps`),
    createStep: (incidentId: string, data: any) => apiFetch<any>(`/incidents/${incidentId}/investigation/steps`, { method: 'POST', body: data }),
    getRCA: (incidentId: string) => apiFetch<any>(`/incidents/${incidentId}/investigation/rca`),
    getRecommendedActions: (incidentId: string) => apiFetch<any>(`/incidents/${incidentId}/investigation/recommended-actions`),
  }
};

// Legacy exports for backwards compatibility
export const getIncidents = () => backendAPI.incidents.list();
export const getIncident = (id: string) => backendAPI.incidents.get(id);
export const getSLO = () => backendAPI.slos.list();
export const getSLOByService = (service: string) => backendAPI.slos.get(service);
export const getK8s = () => backendAPI.kubernetes.getPods('default', 'all');
export const getK8sPods = () => backendAPI.kubernetes.getPods('default', 'all');
export const getK8sEvents = () => backendAPI.kubernetes.getEvents('default', 'all');
export const getMetrics = (query: string) => apiFetch(`/metrics?query=${encodeURIComponent(query)}`);
export const getLogs = (service: string) => backendAPI.logs.getErrors(service);