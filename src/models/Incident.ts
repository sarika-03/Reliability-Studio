export interface Incident {
  id: string;
  title: string;
  description?: string;
  service: string;
  service_id?: string;
  services?: any[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'active';
  started_at: string;
  resolved_at?: string;
  root_cause?: string;
  impact?: any;
  timeline?: any[];
  message?: string;
  timestamp?: string;
}
