import { backendAPI } from './backend';

export const incidentsApi = {
  list: () => backendAPI.incidents.list(),
  get: (id: string) => backendAPI.incidents.get(id),
  create: (data: any) => backendAPI.incidents.create(data),
  update: (id: string, data: any) => backendAPI.incidents.update(id, data),
  getTimeline: (id: string) => backendAPI.incidents.getTimeline(id),
  getCorrelations: (id: string) => backendAPI.incidents.getCorrelations(id),
};
