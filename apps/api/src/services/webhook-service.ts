import { webhooks, webhookDeliveryLogs } from "../store";
import type { WebhookEndpoint, WebhookDeliveryLog } from "@trae/shared";

export const webhookService = {
  createWebhook(tenantId: string, name: string, url: string, events: string[]): WebhookEndpoint {
    const secret = webhooks.generateSecret();
    return webhooks.create({
      tenantId,
      name,
      url,
      events,
      secret,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  getWebhook(id: string): WebhookEndpoint | undefined {
    return webhooks.get(id);
  },

  getWebhooksByTenant(tenantId: string): WebhookEndpoint[] {
    return webhooks.findByTenantId(tenantId);
  },

  updateWebhook(id: string, updates: Partial<WebhookEndpoint>): WebhookEndpoint | undefined {
    return webhooks.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteWebhook(id: string): boolean {
    return webhooks.delete(id);
  },

  regenerateSecret(id: string): { secret: string; webhook: WebhookEndpoint | undefined } {
    const secret = webhooks.generateSecret();
    const webhook = webhooks.update(id, { secret, updatedAt: new Date().toISOString() });
    return { secret, webhook };
  },

  getDeliveryLogs(webhookId: string): WebhookDeliveryLog[] {
    return webhookDeliveryLogs.findByWebhookId(webhookId);
  },

  recordDelivery(webhookId: string, eventType: string, statusCode: number, responseTime: number, response?: string): WebhookDeliveryLog {
    return webhookDeliveryLogs.create({
      webhookId,
      eventType,
      statusCode,
      responseTime,
      response,
      deliveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  },

  getRecentDeliveryLogs(limit: number = 50): WebhookDeliveryLog[] {
    return webhookDeliveryLogs.findRecent(limit);
  }
};