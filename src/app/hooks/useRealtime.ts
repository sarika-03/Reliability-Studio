/// <reference types="vite/client" />
import { useState, useEffect, useCallback } from 'react';

interface RealtimeMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface UseRealtimeOptions {
  url?: string;
  onIncidentCreated?: (incident: any) => void;
  onIncidentUpdated?: (incident: any) => void;
  onCorrelationFound?: (data: any) => void;
  onTimelineEvent?: (event: any) => void;
  onAlert?: (alert: any) => void;
}

/**
 * Hook for real-time incident updates via WebSocket
 * 
 * Usage:
 * ```tsx
 * const { connected, lastMessage } = useRealtime({
 *   onIncidentCreated: (incident) => console.log('New incident:', incident),
 *   onIncidentUpdated: (incident) => console.log('Incident updated:', incident),
 * });
 * ```
 */
export function useRealtime({
  url = import.meta.env.VITE_WS_URL || 'ws://reliability-backend:9000/api/realtime',
  onIncidentCreated,
  onIncidentUpdated,
  onCorrelationFound,
  onTimelineEvent,
  onAlert,
}: UseRealtimeOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cleanup = false;
    let socket: WebSocket;

    const connect = () => {
      if (cleanup) return;

      console.log(`[WebSocket] Connecting to ${url}...`);
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (cleanup) return;
        console.log('[WebSocket] Connected to realtime server');
        setConnected(true);
        setError(null);
        setRetryCount(0);
      };

      socket.onmessage = (event) => {
        if (cleanup) return;
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          setLastMessage(message);

          switch (message.type) {
            case 'incident_created': onIncidentCreated?.(message.payload); break;
            case 'incident_updated': onIncidentUpdated?.(message.payload); break;
            case 'correlation_found': onCorrelationFound?.(message.payload); break;
            case 'timeline_event': onTimelineEvent?.(message.payload); break;
            case 'alert': onAlert?.(message.payload); break;
            default: console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      socket.onerror = (event) => {
        if (cleanup) return;
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
        setConnected(false);
      };

      socket.onclose = (event) => {
        if (cleanup) return;
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setConnected(false);

        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`[WebSocket] Attempting reconnection in ${delay}ms...`);
        setTimeout(() => {
          if (!cleanup) {
            setRetryCount(prev => prev + 1);
            connect();
          }
        }, delay);
      };

      setWs(socket);
    };

    connect();

    return () => {
      cleanup = true;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [url, retryCount]);

  const send = useCallback((message: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  }, [ws]);

  return {
    connected,
    lastMessage,
    error,
    send,
  };
}
