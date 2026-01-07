export interface SLOData {
    id: string;
    name: string;
    current_percentage: number;
    target_percentage: number;
    error_budget_remaining: number;
    status: string;
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: string;
    service: string;
    started_at: string;
    resolved_at?: string;
}

export interface LogEntry {
    timestamp: string;
    message: string;
    level: string;
    service: string;
}
