import { useState, useEffect, useCallback, useRef } from 'react';
import { UIState } from './state-renderer';

interface PollingOptions {
  interval?: number;  // ms between polls
  enabled?: boolean;  // start polling immediately
  retryCount?: number;
  backoffMultiplier?: number;
}

interface UsePolledDataState<T> {
  state: UIState;
  data: T | null;
  error: { message: string; code?: string; traceId?: string } | null;
  isPolling: boolean;
  lastUpdated: number | null;
}

/**
 * Hook for polling backend API with exponential backoff on errors
 * 
 * Usage:
 * ```tsx
 * const { state, data, error, refetch } = usePolledData(
 *   async () => backendAPI.incidents.list(),
 *   { interval: 5000, enabled: true }
 * );
 * ```
 */
export function usePolledData<T>(
  fetchFn: () => Promise<T>,
  options: PollingOptions = {}
) {
  const {
    interval = 5000,
    enabled = true,
    retryCount = 3,
    backoffMultiplier = 2,
  } = options;

  const [state, setState] = useState<UIState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<UsePolledDataState<T>['error']>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    try {
      setState('loading');
      const result = await fetchFn();

      if (result === null || result === undefined) {
        setState('empty');
        setData(null);
        setError(null);
      } else if (Array.isArray(result) && result.length === 0) {
        setState('empty');
        setData(result);
        setError(null);
      } else {
        setState('success');
        setData(result);
        setError(null);
        retryRef.current = 0;  // Reset retry count on success
      }

      setLastUpdated(Date.now());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const code = (err as any)?.status ? `HTTP ${(err as any).status}` : undefined;
      const traceId = (err as any)?.traceId;

      setError({ message: errorMsg, code, traceId });
      setState('error');

      // Exponential backoff
      retryRef.current = Math.min(retryRef.current + 1, retryCount);

      console.error(
        `[usePolledData] Fetch failed (attempt ${retryRef.current}/${retryCount}):`,
        errorMsg
      );
    }
  }, [fetchFn, retryCount]);

  // Initial fetch
  useEffect(() => {
    if (enabled && state === 'idle') {
      fetchData();
    }
  }, [enabled, state, fetchData]);

  // Setup polling
  useEffect(() => {
    if (!isPolling || !enabled) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Calculate delay with exponential backoff
    const delay = state === 'error'
      ? Math.min(interval * Math.pow(backoffMultiplier, retryRef.current - 1), 60000)
      : interval;

    pollingRef.current = setInterval(fetchData, delay);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isPolling, enabled, interval, backoffMultiplier, state, fetchData]);

  const refetch = useCallback(() => {
    retryRef.current = 0;
    fetchData();
  }, [fetchData]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    retryRef.current = 0;
  }, []);

  return {
    state,
    data,
    error,
    isPolling,
    lastUpdated,
    refetch,
    stopPolling,
    startPolling,
  };
}

/**
 * Hook for one-time data fetch with state management
 */
export function useFetchData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UIState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<UsePolledDataState<T>['error']>(null);

  const fetchData = useCallback(async () => {
    try {
      setState('loading');
      const result = await fetchFn();

      if (result === null || result === undefined) {
        setState('empty');
        setData(null);
      } else if (Array.isArray(result) && result.length === 0) {
        setState('empty');
        setData(result);
      } else {
        setState('success');
        setData(result);
      }

      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError({
        message: errorMsg,
        code: (err as any)?.status ? `HTTP ${(err as any).status}` : undefined,
        traceId: (err as any)?.traceId,
      });
      setState('error');
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    state,
    data,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for creating/updating with optimistic UI updates
 */
export function useMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>
) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<UsePolledDataState<TOutput>['error']>(null);

  const mutate = useCallback(
    async (input: TInput) => {
      try {
        setState('loading');
        const result = await mutationFn(input);
        setState('success');
        setData(result);
        setError(null);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError({
          message: errorMsg,
          code: (err as any)?.status ? `HTTP ${(err as any).status}` : undefined,
          traceId: (err as any)?.traceId,
        });
        setState('error');
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState('idle');
    setData(null);
    setError(null);
  }, []);

  return {
    state,
    data,
    error,
    mutate,
    reset,
  };
}
