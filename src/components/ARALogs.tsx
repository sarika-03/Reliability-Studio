import React, { useState, useEffect, useRef } from 'react';
import { css, keyframes } from '@emotion/css';
import { backendAPI } from '../app/api/backend';

const scanLine = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`;

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const styles = {
    container: css`
    background: #0b0c10;
    border: 1px solid #1f2937;
    border-radius: 12px;
    height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    
    &::after {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      z-index: 2;
      background-size: 100% 2px, 3px 100%;
      pointer-events: none;
    }
  `,
    header: css`
    background: #1f2937;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #00d2ff;
  `,
    title: css`
    color: #00d2ff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
    statusDot: css`
    width: 8px;
    height: 8px;
    background: #00d2ff;
    border-radius: 50%;
    box-shadow: 0 0 10px #00d2ff;
    animation: ${pulse} 1.5s infinite;
  `,
    logArea: css`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-family: 'JetBrains Mono', monospace;
    scrollbar-width: thin;
    scrollbar-color: #374151 #0b0c10;
  `,
    logEntry: css`
    font-size: 13px;
    line-height: 1.5;
    animation: fadeIn 0.3s ease-out;
    display: flex;
    gap: 12px;
  `,
    timestamp: css`
    color: #4b5563;
    white-space: nowrap;
  `,
    message: css`
    color: #e5e7eb;
  `,
    agentPrefix: css`
    color: #00d2ff;
    font-weight: bold;
  `,
    systemPrefix: css`
    color: #9ca3af;
  `,
    scanner: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(to bottom, transparent, rgba(0, 210, 255, 0.1), transparent);
      animation: ${scanLine} 3s linear infinite;
    }
  `
};

interface ARALogsProps {
    incidentId: string;
}

export function ARALogs({ incidentId }: ARALogsProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadLogs();

        // Periodically poll for log updates (we'll also handle via WebSocket if possible)
        const interval = setInterval(loadLogs, 3000);
        return () => clearInterval(interval);
    }, [incidentId]);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const loadLogs = async () => {
        try {
            const data = await backendAPI.investigation.getLogs(incidentId);
            setLogs(data);
        } catch (err) {
            console.error("Failed to load ARA logs", err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.scanner} />
            <div className={styles.header}>
                <div className={styles.title}>
                    <div className={styles.statusDot} />
                    <span>AUTONOMOUS RELIABILITY AGENT (ARA) v1.0</span>
                </div>
                <div style={{ color: '#4b5563', fontSize: '12px' }}>LIVE_UPLINK_ESTABLISHED</div>
            </div>
            <div className={styles.logArea} ref={logRef}>
                {logs.length === 0 ? (
                    <div className={styles.logEntry}>
                        <span className={styles.systemPrefix}>[SYSTEM]</span>
                        <span className={styles.message}>Standing by for incident events...</span>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={log.id || idx} className={styles.logEntry}>
                            <span className={styles.timestamp}>[{new Date(log.created_at).toLocaleTimeString()}]</span>
                            <span className={log.message.includes('🤖') ? styles.agentPrefix : styles.systemPrefix}>
                                {log.message.includes('🤖') ? '[AGENT]' : '[SYSTEM]'}
                            </span>
                            <span className={styles.message}>{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
