const API_BASE = "http://reliability-backend:9000/api";

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
  traceId?: string;  // Trace ID from response headers
  requestId?: string; // Request ID for debugging
  endpoint?: string;  // API endpoint for context
  method?: string;    // HTTP method for context
  duration?: number;  // Request duration in ms
}

// Generate unique trace ID for request tracking
function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

class ApiErrorHandler {
  static async handle(response: Response, context: {
    endpoint: string;
    method: string;
    traceId: string;
    duration: number;
  }): Promise<ApiError> {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const responseTraceId = response.headers.get('x-trace-id') || context.traceId;

    // Check for 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      return {
        status: response.status,
        message: 'Your session has expired. Please login again.',
        isTokenExpired: true,
        traceId: responseTraceId,
        endpoint: context.endpoint,
        method: context.method,
        duration: context.duration,
      };
    }

    // Check for 429 Too Many Requests (rate limited)
    if (response.status === 429) {
      return {
        status: response.status,
        message: 'Too many requests. Please wait a moment and try again.',
        isTokenExpired: false,
        traceId: responseTraceId,
        endpoint: context.endpoint,
        method: context.method,
        duration: context.duration,
      };
    }

    // Check for 403 Forbidden (account locked or insufficient permissions)
    if (response.status === 403) {
      return {
        status: response.status,
        message: 'Access forbidden. Your account may be locked due to failed login attempts.',
        isTokenExpired: false,
        traceId: responseTraceId,
        endpoint: context.endpoint,
        method: context.method,
        duration: context.duration,
      };
    }

    // Generic error response
    const message = errorData.error || errorData.message || `API error: ${response.statusText}`;
    return {
      status: response.status,
      message: `${message} (${response.status})`,
      isTokenExpired: false,
      traceId: responseTraceId,
      endpoint: context.endpoint,
      method: context.method,
      duration: context.duration,
      requestId: errorData.request_id || errorData.requestId,
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
  const traceId = generateTraceId();
  const method = customConfig.method || 'GET';
  const startTime = performance.now();

  // Get token from localStorage
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    'X-Trace-ID': traceId,  // Send trace ID to backend
    'X-Request-Started': new Date().toISOString(),
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

  // Log request
  console.log(`[API] ${method} ${endpoint} (trace: ${traceId})`);

  // Use retry logic with circuit breaker
  return retry(
    async () => {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const duration = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const apiError = await ApiErrorHandler.handle(response, {
          endpoint,
          method,
          traceId,
          duration,
        });

        // Log error with full context
        console.error(
          `[API] Error ${method} ${endpoint}: ${apiError.message}`,
          {
            status: apiError.status,
            traceId: apiError.traceId,
            requestId: apiError.requestId,
            duration: `${duration}ms`,
          }
        );

        // Handle token expiration globally
        if (apiError.isTokenExpired) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          if (onTokenExpired) {
            onTokenExpired();
          }
        }

        // Create error object with trace ID and other context
        const error = new Error(apiError.message) as Error & ApiError;
        Object.assign(error, {
          status: apiError.status,
          traceId: apiError.traceId,
          requestId: apiError.requestId,
          endpoint: apiError.endpoint,
          method: apiError.method,
          duration: apiError.duration,
          isTokenExpired: apiError.isTokenExpired,
        });

        // Don't retry non-retryable errors
        if (!isRetryableError(error) && apiError.status !== 503) {
          throw error;
        }

        throw error;
      }

      const responseData = await response.json();
      const duration = Math.round(performance.now() - startTime);
      
      // Log successful request
      console.log(`[API] ✓ ${method} ${endpoint} (${duration}ms, trace: ${traceId})`);

      return responseData;
    },
    serviceName,
    { maxAttempts: 3, initialDelay: 1000, maxDelay: 8000 }
  ).then(result => {
    if (result.success) {
      // Return data even if it's falsy (like empty array, 0, or false)
      // as long as the request was successful
      return result.data as T;
    }

    // If not successful, throw the actual error from retry logic
    const fetchError = result.error || new Error('Failed to fetch data');
    const errorWithTrace = fetchError as any;
    if (errorWithTrace.traceId) {
      console.error(
        `[API] Request failed for ${endpoint}: ${fetchError.message}`,
        `(trace: ${errorWithTrace.traceId})`
      );
    } else {
      console.error(`[API] Request failed for ${endpoint}:`, fetchError);
    }
    throw fetchError;
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
    getAnalysis: (id: string) => apiFetch<any>(`/incidents/${id}/analysis`),
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