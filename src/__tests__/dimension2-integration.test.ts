import { parseOpenSLO, validateOpenSLO, convertToOpenSLO, EXAMPLE_OPENSLO_YAML } from '../../src/utils/openslo-parser';
import { validateWebhookConfig, testWebhookConfig } from '../../src/utils/webhook-system';

describe('OpenSLO Parser', () => {
  describe('parseOpenSLO', () => {
    it('should parse valid OpenSLO YAML', () => {
      const result = parseOpenSLO(EXAMPLE_OPENSLO_YAML);

      expect(result.name).toBe('my-service-availability');
      expect(result.service).toBe('my-service');
      expect(result.target.metricName).toBe('availability');
      expect(result.target.threshold).toBe(99.9);
    });

    it('should throw on missing metadata.name', () => {
      const invalidYaml = `apiVersion: openslo/v1
kind: SLO
spec:
  service: my-service`;

      expect(() => parseOpenSLO(invalidYaml)).toThrow('Missing required field: metadata.name');
    });

    it('should throw on missing spec.service', () => {
      const invalidYaml = `apiVersion: openslo/v1
kind: SLO
metadata:
  name: test-slo`;

      expect(() => parseOpenSLO(invalidYaml)).toThrow('Missing required field: spec.service');
    });

    it('should throw on missing objectives', () => {
      const invalidYaml = `apiVersion: openslo/v1
kind: SLO
metadata:
  name: test-slo
spec:
  service: my-service`;

      expect(() => parseOpenSLO(invalidYaml)).toThrow('Missing required field: spec.objectives');
    });

    it('should parse YAML object', () => {
      const yamlObj = {
        apiVersion: 'openslo/v1',
        kind: 'SLO',
        metadata: {
          name: 'test-slo',
          description: 'Test SLO',
        },
        spec: {
          service: {
            name: 'my-service',
          },
          objectives: [
            {
              displayName: 'Availability',
              goals: [
                {
                  displayName: 'Availability',
                  target: 0.999,
                },
              ],
              timeWindow: {
                type: 'rolling',
                duration: '30d',
              },
            },
          ],
        },
      };

      const result = parseOpenSLO(yamlObj);
      expect(result.name).toBe('test-slo');
      expect(result.description).toBe('Test SLO');
    });

    it('should set default time window to 30d', () => {
      const yamlObj = {
        metadata: { name: 'test' },
        spec: {
          service: 'svc',
          objectives: [
            {
              goals: [{ target: 0.99 }],
            },
          ],
        },
      };

      const result = parseOpenSLO(yamlObj);
      expect(result.budget.timeWindow.duration).toBe('30d');
    });

    it('should set default operator to greater-than', () => {
      const result = parseOpenSLO(EXAMPLE_OPENSLO_YAML);
      expect(result.target.operator).toBe('>');
    });

    it('should set timestamps', () => {
      const result = parseOpenSLO(EXAMPLE_OPENSLO_YAML);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(typeof result.createdAt).toBe('number');
    });
  });

  describe('convertToOpenSLO', () => {
    it('should convert SLO back to YAML', () => {
      const slo = {
        name: 'test-slo',
        description: 'Test SLO',
        service: 'my-service',
        target: {
          serviceName: 'my-service',
          metricName: 'availability',
          threshold: 99.9,
          operator: '>' as const,
        },
        budget: {
          initialBudget: 0.999,
          timeWindow: {
            type: 'rolling' as const,
            duration: '30d',
          },
          increaseRate: 0.01,
          decreaseRate: 0.02,
        },
      };

      const yaml = convertToOpenSLO(slo);

      expect(yaml).toContain('apiVersion: openslo/v1');
      expect(yaml).toContain('name: test-slo');
      expect(yaml).toContain('my-service');
      expect(yaml).toContain('target: 0.999');
    });

    it('should be parseable back to SLO', () => {
      const slo = {
        name: 'test-slo',
        description: 'Test',
        service: 'svc',
        target: {
          serviceName: 'svc',
          metricName: 'latency',
          threshold: 95,
          operator: '>' as const,
        },
        budget: {
          initialBudget: 0.95,
          timeWindow: { type: 'rolling' as const, duration: '7d' },
          increaseRate: 0.01,
          decreaseRate: 0.02,
        },
      };

      const yaml = convertToOpenSLO(slo);
      const parsed = parseOpenSLO(yaml);

      expect(parsed.name).toBe(slo.name);
      expect(parsed.service).toBe(slo.service);
    });
  });

  describe('validateOpenSLO', () => {
    it('should validate correct YAML', () => {
      const result = validateOpenSLO(EXAMPLE_OPENSLO_YAML);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid YAML', () => {
      const result = validateOpenSLO('invalid: [yaml: format');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require SLO name', () => {
      const yaml = `
metadata:
  description: test
spec:
  service: svc
  objectives:
    - goals:
        - target: 0.99
`;

      const result = validateOpenSLO(yaml);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('should require service', () => {
      const yaml = `
metadata:
  name: test-slo
spec:
  objectives:
    - goals:
        - target: 0.99
`;

      const result = validateOpenSLO(yaml);
      expect(result.valid).toBe(false);
    });
  });
});

describe('Webhook System', () => {
  describe('validateWebhookConfig', () => {
    it('should validate correct config', () => {
      const config = {
        enabled: true,
        url: 'https://example.com/webhook',
        events: ['incident.created'] as const,
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require URL', () => {
      const config = {
        enabled: true,
        url: '',
        events: ['incident.created'] as const,
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('URL'))).toBe(true);
    });

    it('should require http/https URL', () => {
      const config = {
        enabled: true,
        url: 'ftp://example.com/webhook',
        events: ['incident.created'] as const,
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('http'))).toBe(true);
    });

    it('should require at least one event', () => {
      const config = {
        enabled: true,
        url: 'https://example.com/webhook',
        events: [] as const,
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('event'))).toBe(true);
    });

    it('should validate retry attempts range', () => {
      const config = {
        enabled: true,
        url: 'https://example.com/webhook',
        events: ['incident.created'] as const,
        retryAttempts: 20, // Too high
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Retry attempts'))).toBe(true);
    });

    it('should validate retry delay range', () => {
      const config = {
        enabled: true,
        url: 'https://example.com/webhook',
        events: ['incident.created'] as const,
        retryDelay: 500, // Too low
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Retry delay'))).toBe(true);
    });

    it('should accept valid retry settings', () => {
      const config = {
        enabled: true,
        url: 'https://example.com/webhook',
        events: ['incident.created'] as const,
        retryAttempts: 5,
        retryDelay: 5000,
      };

      const result = validateWebhookConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('testWebhookConfig', () => {
    it('should reject invalid config', async () => {
      const config = {
        enabled: true,
        url: '', // Invalid
        events: ['incident.created'] as const,
      };

      const result = await testWebhookConfig(config);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error message from validation', async () => {
      const config = {
        enabled: true,
        url: 'invalid-url',
        events: ['incident.created'] as const,
      };

      const result = await testWebhookConfig(config);
      expect(result.success).toBe(false);
      expect(result.error).toContain('http');
    });
  });
});
