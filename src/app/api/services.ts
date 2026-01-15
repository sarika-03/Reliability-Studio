import { backendAPI } from './backend';

export const servicesApi = {
  list: () => backendAPI.services.list(),
  get: (id: string) => backendAPI.services.get(id),
};
