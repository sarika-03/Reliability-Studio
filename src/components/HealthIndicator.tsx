import React, { useEffect, useState } from 'react';

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  responseTime: number;
  lastChecked?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  timestamp: number;
}

export interface HealthIndicatorProps {
  healthCheckInterval?: number; // milliseconds, default 60000
  healthEndpoint?: string; // default /api/health
  showDetails?: boolean; // show component details on hover
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  healthCheckInterval = 60000,
  healthEndpoint = '/api/health',
  showDetails = true,
}) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Fetch health status
  const checkHealth = async () => {
    try {
      const response = await fetch(healthEndpoint);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      const data: SystemHealth = await response.json();
      setSystemHealth(data);
      setLastCheckTime(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('[HealthIndicator] Failed to check health:', error);
      setSystemHealth({
        status: 'unhealthy',
        components: [
          {
            name: 'system',
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Unknown error',
            responseTime: 0,
          },
        ],
        timestamp: Date.now(),
      });
      setIsLoading(false);
    }
  };

  // Setup periodic health checks
  useEffect(() => {
    // Initial check
    checkHealth();

    // Periodic checks
    const interval = setInterval(checkHealth, healthCheckInterval);
    return () => clearInterval(interval);
  }, [healthCheckInterval, healthEndpoint]);

  if (!systemHealth) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#10b981'; // green
      case 'degraded':
        return '#f59e0b'; // amber
      case 'unhealthy':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'unhealthy':
        return '✕';
      default:
        return '?';
    }
  };

  const timeSinceLastCheck = lastCheckTime
    ? Math.round((Date.now() - lastCheckTime.getTime()) / 1000)
    : 'unknown';

  return (
    <div
      className="health-indicator-container"
      style={{
        position: 'relative',
        display: 'inline-block',
        marginRight: '16px',
      }}
    >
      {/* Status Indicator */}
      <div
        className="health-indicator"
        onClick={() => setShowPopup(!showPopup)}
        title={`System Status: ${systemHealth.status}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: `2px solid ${getStatusColor(systemHealth.status)}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }}
      >
        {/* Status Icon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(systemHealth.status),
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            position: 'relative',
          }}
        >
          {getStatusIcon(systemHealth.status)}
          {/* Pulse animation for degraded/unhealthy */}
          {(systemHealth.status === 'degraded' || systemHealth.status === 'unhealthy') && (
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: `2px solid ${getStatusColor(systemHealth.status)}`,
                opacity: 0.5,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          )}
        </div>

        {/* Status Text */}
        <span
          style={{
            fontSize: '13px',
            fontWeight: '500',
            textTransform: 'capitalize',
            color: '#1f2937',
          }}
        >
          {systemHealth.status}
        </span>

        {/* Last Check Time */}
        <span
          style={{
            fontSize: '11px',
            color: '#6b7280',
            marginLeft: '4px',
          }}
        >
          {timeSinceLastCheck}s ago
        </span>
      </div>

      {/* Details Popup */}
      {showDetails && showPopup && (
        <div
          className="health-popup"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '400px',
          }}
        >
          {/* Popup Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: '600',
              color: '#1f2937',
              fontSize: '14px',
            }}
          >
            System Health Status
          </div>

          {/* Components List */}
          <div style={{ padding: '8px 0' }}>
            {(systemHealth.components || []).map((component, idx) => (
              <div
                key={component.name}
                style={{
                  padding: '8px 16px',
                  borderBottom: idx < (systemHealth.components || []).length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {/* Component Status Dot */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(component.status),
                    flexShrink: 0,
                  }}
                />

                {/* Component Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937',
                      textTransform: 'capitalize',
                    }}
                  >
                    {component.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '2px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {component.message || component.status}
                  </div>
                  {component.responseTime > 0 && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        marginTop: '2px',
                      }}
                    >\n                      Response: {component.responseTime}ms
                    </div>
                  )}
                </div>

                {/* Component Status Badge */}
                <div
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: `${getStatusColor(component.status)}20`,
                    color: getStatusColor(component.status),
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {component.status === 'unknown' ? '?' : getStatusIcon(component.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Popup Footer */}
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid #e5e7eb',
              fontSize: '11px',
              color: '#6b7280',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Last checked: {lastCheckTime?.toLocaleTimeString()}</span>
            <button
              onClick={() => {
                checkHealth();
                setShowPopup(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                padding: 0,
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Pulse Animation Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HealthIndicator;
