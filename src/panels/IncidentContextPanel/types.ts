export interface PanelData {
  series: any[];
  state: string;
  timeRange: {
    from: string;
    to: string;
  };
}

export interface IncidentContextOptions {
  incidentId?: string;
  serviceId?: string;
}

export interface IncidentQuery {
  incidentId?: string;
}
