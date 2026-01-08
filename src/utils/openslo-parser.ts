/**
 * OpenSLO YAML Parser
 * Converts OpenSLO YAML format to internal SLO model
 * Based on: https://openslo.com/
 */

export interface SLOTarget {
  serviceName: string;
  metricName: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
}

export interface SLOWindow {
  type: 'rolling' | 'calendar';
  duration: string;
  step?: string;
}

export interface SLOBudget {
  initialBudget: number;
  timeWindow: SLOWindow;
  increaseRate: number;
  decreaseRate: number;
}

export interface InternalSLO {
  id?: string;
  name: string;
  description: string;
  service: string;
  target: SLOTarget;
  budget: SLOBudget;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Parse OpenSLO YAML to internal SLO model
 * Supports both string YAML and parsed YAML object
 */
export function parseOpenSLO(yamlContent: string | Record<string, any>): InternalSLO {
  let yaml: Record<string, any>;

  // Parse YAML string if provided
  if (typeof yamlContent === 'string') {
    try {
      // Use require for Node.js YAML parsing (works in tests)
      const jsYaml = require('js-yaml');
      yaml = jsYaml.load(yamlContent) as Record<string, any>;
    } catch (e) {
      // Fallback to simple parser
      yaml = parseYamlString(yamlContent);
    }
  } else {
    yaml = yamlContent;
  }

  // Validate required fields
  if (!yaml.metadata || !yaml.metadata.name) {
    throw new Error('Missing required field: metadata.name');
  }
  if (!yaml.spec) {
    throw new Error('Missing required field: spec.service');
  }
  
  // Handle both spec.service and spec.service.name formats
  let serviceName: string;
  if (typeof yaml.spec.service === 'string') {
    serviceName = yaml.spec.service;
  } else if (yaml.spec.service && yaml.spec.service.name) {
    serviceName = yaml.spec.service.name;
  } else {
    throw new Error('Missing required field: spec.service');
  }
  
  if (!yaml.spec.objectives || yaml.spec.objectives.length === 0) {
    throw new Error('Missing required field: spec.objectives');
  }

  const metadata = yaml.metadata;
  const spec = yaml.spec;
  const objective = spec.objectives[0]; // Use first objective

  // Validate objectives has goals
  if (!objective.goals || objective.goals.length === 0) {
    throw new Error('Missing objectives[0].goals');
  }

  // Parse metric/goal
  const goal = objective.goals[0];
  if (!goal) {
    throw new Error('Missing objectives[0].goals[0]');
  }

  // Extract metric target
  let metricName = 'availability';
  let threshold = 99.9;
  let operator: '>' | '<' | '>=' | '<=' | '==' | '!=' = '>';

  if (goal.displayName) {
    metricName = goal.displayName.toLowerCase().includes('availability')
      ? 'availability'
      : goal.displayName.toLowerCase();
  }

  if (goal.target !== undefined) {
    threshold = goal.target * 100; // Convert 0.999 to 99.9
  }

  // Parse time window
  const windowDuration = objective.timeWindow?.duration || '30d';
  const sloWindow: SLOWindow = {
    type: objective.timeWindow?.type === 'rolling' ? 'rolling' : 'calendar',
    duration: windowDuration,
  };

  // Parse budget
  const budgetPercent = threshold / 100;
  const slobudget: SLOBudget = {
    initialBudget: budgetPercent,
    timeWindow: sloWindow,
    increaseRate: 0.01, // 1% increase per day
    decreaseRate: 0.02, // 2% decrease per incident
  };

  return {
    name: metadata.name,
    description: metadata.description || '',
    service: serviceName,
    target: {
      serviceName: serviceName,
      metricName: metricName,
      threshold: threshold,
      operator: operator,
    },
    budget: slobudget,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Parse YAML string to object
 * Simple YAML parser supporting basic OpenSLO structure
 * For full YAML parsing, use 'js-yaml' library
 */
function parseYamlString(yamlStr: string): Record<string, any> {
  const lines = yamlStr.split('\n');
  const result: Record<string, any> = {};
  const stack: Array<{ indent: number; key: string; obj: any }> = [{ indent: -1, key: '', obj: result }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Get indentation level
    const indent = line.search(/\S/);

    // Remove from stack until we find the right parent
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.obj || result;

    // Check if this is a list item (starts with -)
    const listMatch = line.match(/^(\s*)-\s+(.+):\s*(.*)/);
    const keyMatch = line.match(/^(\s*)([\w.]+):\s*(.*)/);

    if (listMatch) {
      // List item with key-value
      const [, , key, value] = listMatch;
      const parentKey = stack[stack.length - 1]?.key;
      
      if (!parent[parentKey]) {
        parent[parentKey] = [];
      }

      const item: Record<string, any> = {};
      item[key] = value ? parseScalarValue(value) : null;

      parent[parentKey].push(item);
      
      // If there's a value, don't push to stack
      if (!value) {
        stack.push({ indent, key, obj: item });
      }
    } else if (keyMatch) {
      // Regular key-value
      const [, , key, value] = keyMatch;

      if (value) {
        // Scalar value
        parent[key] = parseScalarValue(value);
      } else {
        // Check if next non-empty line starts with - (list) or has more indentation (object)
        let nextNonEmptyIdx = i + 1;
        while (nextNonEmptyIdx < lines.length && !lines[nextNonEmptyIdx].trim()) {
          nextNonEmptyIdx++;
        }

        if (nextNonEmptyIdx < lines.length) {
          const nextLine = lines[nextNonEmptyIdx];
          const nextIndent = nextLine.search(/\S/);
          const isList = nextLine.trim().startsWith('-');

          if (isList) {
            parent[key] = [];
            stack.push({ indent, key, obj: parent });
          } else if (nextIndent > indent) {
            const obj: Record<string, any> = {};
            parent[key] = obj;
            stack.push({ indent, key, obj });
          }
        }
      }
    }
  }

  return result;
}

/**
 * Parse scalar value from YAML
 */
function parseScalarValue(value: string): any {
  const trimmed = value.trim();

  // Parse null
  if (trimmed === 'null' || trimmed === '') {
    return null;
  }

  // Parse boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Parse number
  const num = parseFloat(trimmed);
  if (!isNaN(num) && trimmed === num.toString()) {
    return num;
  }

  // Parse quoted strings
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Return as string
  return trimmed;
}

/**
 * Convert internal SLO back to OpenSLO YAML format
 */
export function convertToOpenSLO(slo: InternalSLO): string {
  const yaml = `apiVersion: openslo/v1
kind: SLO
metadata:
  name: ${slo.name}
  description: ${slo.description || ''}
spec:
  service:
    name: ${slo.service}
  objectives:
    - displayName: ${slo.target.metricName}
      goals:
        - displayName: ${slo.target.metricName}
          target: ${slo.target.threshold / 100}
      timeWindow:
        type: ${slo.budget.timeWindow.type}
        duration: ${slo.budget.timeWindow.duration}
`;
  return yaml;
}

/**
 * Validate OpenSLO YAML structure
 */
export function validateOpenSLO(yaml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const parsed = parseOpenSLO(yaml);
    if (!parsed.name) errors.push('SLO must have a name');
    if (!parsed.service) errors.push('SLO must have a service');
    if (!parsed.target) errors.push('SLO must have a target metric');
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'Invalid YAML format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Example OpenSLO YAML format
 */
export const EXAMPLE_OPENSLO_YAML = `apiVersion: openslo/v1
kind: SLO
metadata:
  name: my-service-availability
  description: Availability SLO for my service
spec:
  service:
    name: my-service
  objectives:
    - displayName: Availability
      goals:
        - displayName: Availability
          target: 0.999
      timeWindow:
        type: rolling
        duration: 30d
`;
