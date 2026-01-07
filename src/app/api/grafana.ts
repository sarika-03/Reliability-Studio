import { getBackendSrv } from '@grafana/runtime';

export const queryGrafana = (url: string) => {
  return getBackendSrv().get(url);
};
