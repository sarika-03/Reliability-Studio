// Mock data service for development when backend is unavailable
export const mockData = {
  incidents: [
    {
      id: "incident-1",
      name: "Database connection timeout",
      service_id: "api-server",
      severity: "high",
      status: "open",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "incident-2", 
      name: "High memory usage in worker pods",
      service_id: "background-worker",
      severity: "medium",
      status: "acknowledged",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    }
  ],
  
  services: [
    { id: "api-server", name: "API Server" },
    { id: "background-worker", name: "Background Worker" },
    { id: "web-frontend", name: "Web Frontend" }
  ],
  
  timeline: [
    {
      id: "event-1",
      type: "alert",
      title: "Alert triggered",
      description: "Database connection timeout detected",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      metadata: { threshold: "30s", actual: "45s" }
    },
    {
      id: "event-2",
      type: "mitigation",
      title: "Auto-restart initiated",
      description: "Database connection pool reset",
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      metadata: { action: "pool_reset", status: "completed" }
    }
  ],
  
  metrics: {
    errorRate: { value: 2.4, trend: "up" },
    latency: { value: 0.845, trend: "stable" }
  },
  
  logs: [
    {
      level: "error",
      message: "Connection timeout: unable to connect to database",
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      level: "warn", 
      message: "High memory usage detected: 85% of threshold",
      timestamp: new Date(Date.now() - 900000).toISOString()
    }
  ],
  
  kubernetes: [
    { name: "api-server-7d6f8c9c-xyz", status: "Running" },
    { name: "api-server-7d6f8c9c-abc", status: "Running" },
    { name: "worker-5e2a3b4d-def", status: "Pending" }
  ]
};