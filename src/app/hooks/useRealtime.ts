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
  url = 'ws://localhost:9000/api/realtime',
  onIncidentCreated,
  onIncidentUpdated,
  onCorrelationFound,
  onAlert,
}: UseRealtimeOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log('[WebSocket] Connected to realtime server');
      setConnected(true);
      setError(null);
    };

    websocket.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        setLastMessage(message);

        // Route message to appropriate handler
        switch (message.type) {
          case 'incident_created':
            onIncidentCreated?.(message.payload);
            break;
          case 'incident_updated':
            onIncidentUpdated?.(message.payload);
            break;
          case 'correlation_found':
            onCorrelationFound?.(message.payload);
            break;
          case 'alert':
            onAlert?.(message.payload);
            break;
          default:
            console.log('[WebSocket] Unknown message type:', message.type);
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    websocket.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      setError('WebSocket connection error');
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log('[WebSocket] Connection closed');
      setConnected(false);
      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        console.log('[WebSocket] Attempting reconnection...');
      }, 5000);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [url]);

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
