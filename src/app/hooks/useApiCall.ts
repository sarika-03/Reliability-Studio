import { useState, useCallback } from 'react';

export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isTokenExpired: boolean;
}

export interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onTokenExpired?: () => void;
}

/**
 * Custom hook for making API calls with automatic error handling
 * Handles token expiration, rate limiting, and other API errors
 */
export function useApiCall<T = any>(
  options: UseApiCallOptions = {}
): [
  ApiCallState<T>,
  (apiCall: Promise<T>) => Promise<T | null>
] {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    isTokenExpired: false,
  });

  const execute = useCallback(
    async (apiCall: Promise<T>): Promise<T | null> => {
      setState({
        data: null,
        loading: true,
        error: null,
        isTokenExpired: false,
      });

      try {
        const result = await apiCall;
        setState({
          data: result,
          loading: false,
          error: null,
          isTokenExpired: false,
        });
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const isTokenExpired = (error as any).isTokenExpired || false;

        setState({
          data: null,
          loading: false,
          error,
          isTokenExpired,
        });

        if (isTokenExpired && options.onTokenExpired) {
          options.onTokenExpired();
        }

        if (options.onError) {
          options.onError(error);
        }

        return null;
      }
    },
    [options]
  );

  return [state, execute];
}

/**
 * Hook for handling multiple sequential API calls
 */
export function useApiCallSequence<T = any>(
  options: UseApiCallOptions = {}
): [
  ApiCallState<T>,
  (apiCalls: Promise<T>[]) => Promise<T[]>
] {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    isTokenExpired: false,
  });

  const execute = useCallback(
    async (apiCalls: Promise<T>[]): Promise<T[]> => {
      setState({
        data: null,
        loading: true,
        error: null,
        isTokenExpired: false,
      });

      try {
        const results = await Promise.all(apiCalls);
        
        setState({
          data: results[results.length - 1],
          loading: false,
          error: null,
          isTokenExpired: false,
        });

        if (options.onSuccess) {
          options.onSuccess(results);
        }

        return results;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const isTokenExpired = (error as any).isTokenExpired || false;

        setState({
          data: null,
          loading: false,
          error,
          isTokenExpired,
        });

        if (isTokenExpired && options.onTokenExpired) {
          options.onTokenExpired();
        }

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      }
    },
    [options]
  );

  return [state, execute];
}
