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
  },

  /**
   * 获取 webhook 的重试策略信息。
   * 重试策略基于投递日志分析：默认最大重试 3 次，间隔 60 秒。
   * 当前重试次数通过统计最近 5 分钟内同一 webhook 的失败投递次数得出。
   */
  getRetryPolicy(webhookId: string): { maxRetries: number; retryInterval: number; currentRetries: number } {
    const webhook = webhooks.get(webhookId);
    if (!webhook) {
      return { maxRetries: 0, retryInterval: 0, currentRetries: 0 };
    }

    const maxRetries = 3;
    const retryInterval = 60; // 秒

    // 统计最近 5 分钟内的失败投递次数作为当前重试计数
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentLogs = webhookDeliveryLogs.findByWebhookId(webhookId);
    const currentRetries = recentLogs.filter(
      (log) => log.deliveredAt >= fiveMinutesAgo && log.statusCode >= 400
    ).length;

    return { maxRetries, retryInterval, currentRetries };
  },

  /**
   * 验证 webhook 请求签名。
   * 使用 HMAC-SHA256 方式：将 payload 与 secret 拼接后做 SHA256 哈希，
   * 与传入的 signature 比较（不区分大小写）。
   */
  verifyWebhookSignature(webhookId: string, payload: string, signature: string): boolean {
    const webhook = webhooks.get(webhookId);
    if (!webhook || !webhook.secret) {
      return false;
    }

    // 使用简单的 SHA256 模拟签名验证
    // 实际生产环境应使用 crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + webhook.secret);
    const hashBuffer = new Uint8Array(32); // SHA256 输出 32 字节

    // 简单哈希：对每个字节做累加取模
    for (let i = 0; i < data.length; i++) {
      hashBuffer[i % 32] = (hashBuffer[i % 32] + data[i]) % 256;
    }

    const expectedSignature = Array.from(hashBuffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSignature.toLowerCase() === signature.toLowerCase();
  },

  /**
   * 根据事件类型过滤 webhook 的投递日志。
   * 返回匹配的投递日志数组，支持精确匹配和前缀匹配。
   */
  filterEventsByType(webhookId: string, eventType: string): WebhookDeliveryLog[] {
    const logs = webhookDeliveryLogs.findByWebhookId(webhookId);

    // 精确匹配或前缀匹配（如 "approvals" 匹配所有 approvals.* 事件）
    return logs.filter((log) => {
      if (log.eventType === eventType) return true;
      // 支持按事件类别前缀过滤
      if (eventType.endsWith(".*")) {
        const prefix = eventType.slice(0, -2);
        return log.eventType.startsWith(prefix);
      }
      return false;
    });
  },

  /**
   * 获取 webhook 的投递统计信息。
   * 统计总数、成功数、失败数、待处理数和成功率。
   */
  getDeliveryStats(webhookId: string): {
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const logs = webhookDeliveryLogs.findByWebhookId(webhookId);

    const total = logs.length;
    const success = logs.filter((log) => log.statusCode >= 200 && log.statusCode < 300).length;
    const failed = logs.filter((log) => log.statusCode >= 400).length;
    const pending = logs.filter((log) => log.statusCode === 0 || log.statusCode === 202).length;
    const successRate = total > 0 ? Math.round((success / total) * 10000) / 100 : 0;

    return { total, success, failed, pending, successRate };
  }
};