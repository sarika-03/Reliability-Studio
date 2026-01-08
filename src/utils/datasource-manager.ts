/**
 * Datasource Management System
 * Handles detection, validation, and health checking of available datasources
 * Supports: Prometheus, Loki, Tempo, Postgres, MySQL
 */

import { getDataSourceSrv } from '@grafana/runtime';

export type DatasourceType = 'prometheus' | 'loki' | 'tempo' | 'postgres' | 'mysql';

export interface Datasource {
  uid: string;
  name: string;
  type: DatasourceType;
  url: string;
  isDefault: boolean;
  isProvisioned: boolean;
}

export interface DatasourceHealth {
  datasourceUid: string;
  name: string;
  type: DatasourceType;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: number;
  error?: string;
}

export interface DatasourceConfig {
  prometheus?: Datasource;
  loki?: Datasource;
  tempo?: Datasource;
  postgres?: Datasource;
  mysql?: Datasource;
}

/**
 * Detect available datasources from Grafana
 * Returns only datasources matching supported types
 */
export async function detectDatasources(): Promise<DatasourceConfig> {
  const datasourceService = getDataSourceSrv();
  
  try {
    // Get all datasources from Grafana
    const allDatasources = await datasourceService.getList();
    
    const config: DatasourceConfig = {};
    
    for (const ds of allDatasources) {
      const type = ds.type as DatasourceType;
      
      switch (type) {
        case 'prometheus':
          if (!config.prometheus) {
            config.prometheus = {
              uid: ds.uid || '',
              name: ds.name || '',
              type: 'prometheus',
              url: ds.url || '',
              isDefault: ds.isDefault || false,
              isProvisioned: (ds as any).isProvisioned || false,
            };
          }
          break;
          
        case 'loki':
          if (!config.loki) {
            config.loki = {
              uid: ds.uid || '',
              name: ds.name || '',
              type: 'loki',
              url: ds.url || '',
              isDefault: ds.isDefault || false,
              isProvisioned: (ds as any).isProvisioned || false,
            };
          }
          break;
          
        case 'tempo':
          if (!config.tempo) {
            config.tempo = {
              uid: ds.uid || '',
              name: ds.name || '',
              type: 'tempo',
              url: ds.url || '',
              isDefault: ds.isDefault || false,
              isProvisioned: (ds as any).isProvisioned || false,
            };
          }
          break;
          
        case 'postgres':
          if (!config.postgres) {
            config.postgres = {
              uid: ds.uid || '',
              name: ds.name || '',
              type: 'postgres',
              url: ds.url || '',
              isDefault: ds.isDefault || false,
              isProvisioned: (ds as any).isProvisioned || false,
            };
          }
          break;
          
        case 'mysql':
          if (!config.mysql) {
            config.mysql = {
              uid: ds.uid || '',
              name: ds.name || '',
              type: 'mysql',
              url: ds.url || '',
              isDefault: ds.isDefault || false,
              isProvisioned: (ds as any).isProvisioned || false,
            };
          }
          break;
      }
    }
    
    console.log('[DatasourceDetector] Found datasources:', config);
    return config;
  } catch (error) {
    console.error('[DatasourceDetector] Error detecting datasources:', error);
    return {};
  }
}

/**
 * Check health of a specific datasource
 */
export async function checkDatasourceHealth(datasource: Datasource): Promise<DatasourceHealth> {
  const startTime = Date.now();
  
  try {
    const datasourceService = getDataSourceSrv();
    const testDatasource = datasourceService.getInstanceSettings(datasource.uid);
    
    if (!testDatasource) {
      return {
        datasourceUid: datasource.uid,
        name: datasource.name,
        type: datasource.type,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
        error: 'Datasource not found in Grafana',
      };
    }
    
    // Attempt to query each datasource type
    let isHealthy = false;
    let error: string | undefined;
    
    try {
      switch (datasource.type) {
        case 'prometheus':
          // Check Prometheus API endpoint
          const promResponse = await fetch(`${datasource.url}/api/v1/query?query=up`);
          isHealthy = promResponse.ok;
          if (!isHealthy) error = `Prometheus returned ${promResponse.status}`;
          break;
          
        case 'loki':
          // Check Loki API endpoint
          const lokiResponse = await fetch(`${datasource.url}/loki/api/v1/label`);
          isHealthy = lokiResponse.ok;
          if (!isHealthy) error = `Loki returned ${lokiResponse.status}`;
          break;
          
        case 'tempo':
          // Check Tempo API endpoint
          const tempoResponse = await fetch(`${datasource.url}/api/v2/version`);
          isHealthy = tempoResponse.ok;
          if (!isHealthy) error = `Tempo returned ${tempoResponse.status}`;
          break;
          
        case 'postgres':
        case 'mysql':
          // Database health checks are done server-side
          // Frontend cannot directly check database connectivity
          // Return unknown until backend confirms
          return {
            datasourceUid: datasource.uid,
            name: datasource.name,
            type: datasource.type,
            status: 'unknown',
            responseTime: Date.now() - startTime,
            lastChecked: Date.now(),
            error: 'Database health checked by backend',
          };
      }
    } catch (e) {
      isHealthy = false;
      error = e instanceof Error ? e.message : 'Connection failed';
    }
    
    return {
      datasourceUid: datasource.uid,
      name: datasource.name,
      type: datasource.type,
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: Date.now(),
      error: error,
    };
  } catch (error) {
    return {
      datasourceUid: datasource.uid,
      name: datasource.name,
      type: datasource.type,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check health of all configured datasources
 */
export async function checkAllDatasourceHealth(config: DatasourceConfig): Promise<DatasourceHealth[]> {
  const checks: Promise<DatasourceHealth>[] = [];
  
  if (config.prometheus) {
    checks.push(checkDatasourceHealth(config.prometheus));
  }
  if (config.loki) {
    checks.push(checkDatasourceHealth(config.loki));
  }
  if (config.tempo) {
    checks.push(checkDatasourceHealth(config.tempo));
  }
  if (config.postgres) {
    checks.push(checkDatasourceHealth(config.postgres));
  }
  if (config.mysql) {
    checks.push(checkDatasourceHealth(config.mysql));
  }
  
  const results = await Promise.all(checks);
  return results;
}

/**
 * Get a datasource by type, with fallback
 */
export function getDatasourceByType(
  config: DatasourceConfig,
  type: DatasourceType
): Datasource | undefined {
  return config[type];
}

/**
 * Validate that required datasources are configured
 * Prometheus is always required
 * Others are optional and features degrade gracefully
 */
export function validateRequiredDatasources(config: DatasourceConfig): {
  valid: boolean;
  missingRequired: DatasourceType[];
  missingOptional: DatasourceType[];
} {
  const missingRequired: DatasourceType[] = [];
  const missingOptional: DatasourceType[] = [];
  
  // Prometheus is required
  if (!config.prometheus) {
    missingRequired.push('prometheus');
  }
  
  // Others are optional but preferred
  if (!config.loki) {
    missingOptional.push('loki');
  }
  if (!config.tempo) {
    missingOptional.push('tempo');
  }
  if (!config.postgres && !config.mysql) {
    missingOptional.push('postgres');
  }
  
  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
  };
}

/**
 * Format datasource for display
 */
export function formatDatasource(ds: Datasource | undefined): string {
  if (!ds) return 'Not configured';
  return `${ds.name} (${ds.type})`;
}

/**
 * Get datasource by UID
 */
export async function getDatasourceByUid(uid: string): Promise<Datasource | undefined> {
  const datasourceService = getDataSourceSrv();
  
  try {
    const settings = datasourceService.getInstanceSettings(uid);
    if (!settings) return undefined;
    
    return {
      uid: settings.uid,
      name: settings.name,
      type: settings.type as DatasourceType,
      url: settings.url || '',
      isDefault: settings.isDefault || false,
      isProvisioned: (settings as any).isProvisioned || false,
    };
  } catch (error) {
    console.error('[DatasourceDetector] Error getting datasource by UID:', error);
    return undefined;
  }
}
