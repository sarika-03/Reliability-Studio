export interface SLO {
  id: string;
  service_id: string;
  name: string;
  description?: string;
  target_percentage: number;
  current_percentage?: number;
  error_budget_remaining?: number;
  window_days: number;
  sli_type?: string;
  query?: string;
  status?: string;
  created_at?: string;
  last_calculated_at?: string;
  // Legacy/alternative property names
  serviceName?: string;
  objective?: number;
  errorBudget?: number;
  burnRate?: number;
}
