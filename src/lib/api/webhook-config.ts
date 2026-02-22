import { apiClient } from './client';
import type { WebhookConfig } from '@/types/signal-channel';

const base = '/v1/webhook-config';

export async function createWebhookConfig(body: {
  name: string;
  url: string;
  headers?: Record<string, string>;
}): Promise<{ result: WebhookConfig; secret: string }> {
  return apiClient<{ result: WebhookConfig; secret: string }>(base, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchWebhookConfigs(): Promise<WebhookConfig[]> {
  return apiClient<WebhookConfig[]>(base);
}

export async function updateWebhookConfig(
  no: number,
  body: { name?: string; url?: string; headers?: Record<string, string> },
): Promise<WebhookConfig> {
  return apiClient<WebhookConfig>(`${base}/${no}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteWebhookConfig(no: number): Promise<void> {
  await apiClient<void>(`${base}/${no}`, { method: 'DELETE' });
}

export async function regenerateSecret(no: number): Promise<{ secret: string }> {
  return apiClient<{ secret: string }>(`${base}/${no}/regenerate-secret`, {
    method: 'POST',
  });
}

export async function testWebhook(no: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`${base}/${no}/test`, {
    method: 'POST',
  });
}
