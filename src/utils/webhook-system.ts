/**
 * Webhook Notification System
 * Sends JSON notifications to external systems when incidents change
 */

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  events: readonly WebhookEvent[];
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

export type WebhookEvent = 'incident.created' | 'incident.updated' | 'incident.resolved' | 'slo.breached';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: number;
  data: Record<string, any>;
  sourceId?: string;
  version: '1.0';
}

/**
 * Send webhook notification
 */
export async function sendWebhook(
  config: WebhookConfig,
  event: WebhookEvent,
  data: Record<string, any>,
  retryAttempt: number = 0
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled || !config.url) {
    return { success: false, error: 'Webhook not configured' };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: Date.now(),
    data,
    version: '1.0',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Reliability-Studio/1.0',
        ...config.headers,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[Webhook] Successfully sent ${event} to ${config.url}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const maxRetries = config.retryAttempts || 3;
    const retryDelay = config.retryDelay || 5000;

    // Retry on failure
    if (retryAttempt < maxRetries) {
      console.warn(
        `[Webhook] Failed to send ${event}, retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries}):`,
        errorMessage
      );

      // Retry after delay
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return sendWebhook(config, event, data, retryAttempt + 1);
    }

    console.error(`[Webhook] Failed to send ${event} after ${maxRetries} attempts:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send incident created webhook
 */
export async function notifyIncidentCreated(
  webhookConfig: WebhookConfig,
  incident: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!webhookConfig.events.includes('incident.created')) {
    return { success: false, error: 'Event not enabled' };
  }

  return sendWebhook(webhookConfig, 'incident.created', {
    incident,
    action: 'created',
  });
}

/**
 * Send incident updated webhook
 */
export async function notifyIncidentUpdated(
  webhookConfig: WebhookConfig,
  incident: Record<string, any>,
  changes: Record<string, { old: any; new: any }>
): Promise<{ success: boolean; error?: string }> {
  if (!webhookConfig.events.includes('incident.updated')) {
    return { success: false, error: 'Event not enabled' };
  }

  return sendWebhook(webhookConfig, 'incident.updated', {
    incident,
    changes,
    action: 'updated',
  });
}

/**
 * Send incident resolved webhook
 */
export async function notifyIncidentResolved(
  webhookConfig: WebhookConfig,
  incident: Record<string, any>,
  duration: number // milliseconds
): Promise<{ success: boolean; error?: string }> {
  if (!webhookConfig.events.includes('incident.resolved')) {
    return { success: false, error: 'Event not enabled' };
  }

  return sendWebhook(webhookConfig, 'incident.resolved', {
    incident,
    duration,
    action: 'resolved',
  });
}

/**
 * Send SLO breached webhook
 */
export async function notifySLOBreached(
  webhookConfig: WebhookConfig,
  slo: Record<string, any>,
  currentValue: number,
  threshold: number
): Promise<{ success: boolean; error?: string }> {
  if (!webhookConfig.events.includes('slo.breached')) {
    return { success: false, error: 'Event not enabled' };
  }

  return sendWebhook(webhookConfig, 'slo.breached', {
    slo,
    currentValue,
    threshold,
    breach: currentValue < threshold,
  });
}

/**
 * Example webhook configurations for popular services
 */
export const WEBHOOK_TEMPLATES = {
  slack: {
    url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    events: ['incident.created', 'incident.resolved', 'slo.breached'] as WebhookEvent[],
    headers: {
      'Content-Type': 'application/json',
    },
  },
  pagerduty: {
    url: 'https://events.pagerduty.com/v2/enqueue',
    events: ['incident.created', 'slo.breached'] as WebhookEvent[],
    headers: {
      'Content-Type': 'application/json',
    },
  },
  github: {
    url: 'https://api.github.com/repos/OWNER/REPO/dispatches',
    events: ['incident.created', 'incident.resolved'] as WebhookEvent[],
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token YOUR_GITHUB_TOKEN',
    },
  },
  generic: {
    url: 'https://example.com/webhook',
    events: [] as WebhookEvent[],
    headers: {},
  },
};

/**
 * Validate webhook configuration
 */
export function validateWebhookConfig(config: WebhookConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.url) {
    errors.push('Webhook URL is required');
  } else if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    errors.push('Webhook URL must start with http:// or https://');
  }

  if (!config.events || config.events.length === 0) {
    errors.push('At least one webhook event must be selected');
  }

  if (config.retryAttempts && (config.retryAttempts < 1 || config.retryAttempts > 10)) {
    errors.push('Retry attempts must be between 1 and 10');
  }

  if (config.retryDelay && (config.retryDelay < 1000 || config.retryDelay > 60000)) {
    errors.push('Retry delay must be between 1000 and 60000 milliseconds');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test webhook configuration
 */
export async function testWebhookConfig(config: WebhookConfig): Promise<{
  success: boolean;
  error?: string;
}> {
  const validation = validateWebhookConfig(config);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return sendWebhook(config, 'incident.created', {
    test: true,
    message: 'This is a test webhook',
    timestamp: new Date().toISOString(),
  });
}
