export interface Service {
  id: string;
  name: string;
  description?: string;
  environment?: string;
  owner?: string;
  owner_team?: string;
  status?: string;
  repository_url?: string;
  labels?: Record<string, string>;
}
