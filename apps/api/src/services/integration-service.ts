import { integrations } from "../store";
import type { Integration } from "@trae/shared";

export const integrationService = {
  createIntegration(tenantId: string, type: Integration["type"], name: string, config: Record<string, unknown>): Integration {
    return integrations.create({
      tenantId,
      type,
      name,
      status: "not_configured",
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  getIntegration(id: string): Integration | undefined {
    return integrations.get(id);
  },

  getIntegrationsByTenant(tenantId: string): Integration[] {
    return integrations.findByTenantId(tenantId);
  },

  getIntegrationsByType(type: Integration["type"]): Integration[] {
    return integrations.findByType(type);
  },

  updateIntegration(id: string, updates: Partial<Integration>): Integration | undefined {
    return integrations.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteIntegration(id: string): boolean {
    return integrations.delete(id);
  },

  connectIntegration(id: string): Integration | undefined {
    return integrations.update(id, {
      status: "connected",
      lastSyncAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  disconnectIntegration(id: string): Integration | undefined {
    return integrations.update(id, {
      status: "not_configured",
      lastSyncAt: undefined,
      updatedAt: new Date().toISOString()
    });
  },

  syncIntegration(id: string): { status: string; integration: Integration | undefined } {
    const integration = integrations.get(id);
    if (!integration || integration.status !== "connected") {
      return { status: "failed", integration };
    }
    
    const updated = integrations.update(id, {
      lastSyncAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { status: "syncing", integration: updated };
  },

  getConnectedIntegrations(): Integration[] {
    return integrations.findConnected();
  },

  validateIntegrationConfig(type: Integration["type"], config: Record<string, unknown>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    switch (type) {
      case "slack":
        if (!config.webhookUrl) errors.push("webhookUrl is required");
        break;
      case "github":
        if (!config.repoUrl) errors.push("repoUrl is required");
        break;
      case "jira":
        if (!config.host) errors.push("host is required");
        if (!config.projectKey) errors.push("projectKey is required");
        break;
      case "zendesk":
        if (!config.subdomain) errors.push("subdomain is required");
        break;
      case "salesforce":
        if (!config.instanceUrl) errors.push("instanceUrl is required");
        break;
      case "webhook":
        if (!config.url) errors.push("url is required");
        break;
    }
    
    return { valid: errors.length === 0, errors };
  },

  /**
   * 测试集成的连接状态。
   * 模拟连接测试，返回连接结果、延迟和消息。
   */
  testConnection(integrationId: string): { success: boolean; latency: number; message: string } {
    const integration = integrations.get(integrationId);
    if (!integration) {
      return { success: false, latency: 0, message: "集成不存在" };
    }

    if (integration.status === "not_configured") {
      return { success: false, latency: 0, message: "集成未配置，请先完成配置" };
    }

    if (integration.status === "disabled") {
      return { success: false, latency: 0, message: "集成已禁用" };
    }

    // 模拟连接测试延迟（5-200ms）
    const latency = Math.floor(Math.random() * 195) + 5;

    // 根据集成类型模拟不同的连接结果
    const config = integration.config || {};
    const hasRequiredConfig = this.validateRequiredConfig(integration.type, config);

    if (!hasRequiredConfig) {
      return { success: false, latency, message: "连接失败：缺少必需的配置参数" };
    }

    // 模拟 90% 成功率
    const success = Math.random() > 0.1;

    if (success) {
      // 更新最后连接时间
      integrations.update(integrationId, {
        lastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, latency, message: `连接成功 (${integration.type})` };
    }

    return { success: false, latency, message: `连接超时 (${integration.type})` };
  },

  /**
   * 检查集成类型的必需配置是否完整。
   */
  validateRequiredConfig(type: Integration["type"], config: Record<string, unknown>): boolean {
    switch (type) {
      case "slack": return !!config.webhookUrl;
      case "github": return !!config.repoUrl;
      case "jira": return !!(config.host && config.projectKey);
      case "zendesk": return !!config.subdomain;
      case "salesforce": return !!config.instanceUrl;
      case "webhook": return !!config.url;
      case "stripe":
      case "custom":
      default: return true;
    }
  },

  /**
   * 获取集成的同步调度信息。
   * 包含同步频率、上次同步时间、下次同步时间和状态。
   */
  getSyncSchedule(integrationId: string): {
    frequency: string;
    lastSync: string;
    nextSync: string;
    status: string;
  } {
    const integration = integrations.get(integrationId);
    if (!integration) {
      return { frequency: "unknown", lastSync: "", nextSync: "", status: "not_found" };
    }

    // 根据集成类型确定同步频率
    const frequencyMap: Record<string, string> = {
      slack: "实时",
      github: "每 5 分钟",
      jira: "每 15 分钟",
      zendesk: "每 10 分钟",
      salesforce: "每小时",
      stripe: "每日",
      webhook: "事件驱动",
      custom: "手动"
    };

    const frequency = frequencyMap[integration.type] || "手动";
    const lastSync = integration.lastSyncAt || "";

    // 计算下次同步时间
    let nextSync = "";
    if (integration.status === "connected" && lastSync) {
      const intervalMinutes: Record<string, number> = {
        slack: 1,
        github: 5,
        jira: 15,
        zendesk: 10,
        salesforce: 60,
        stripe: 1440,
        webhook: 0,
        custom: 0
      };

      const interval = intervalMinutes[integration.type] || 0;
      if (interval > 0) {
        const lastSyncDate = new Date(lastSync);
        const nextSyncDate = new Date(lastSyncDate.getTime() + interval * 60 * 1000);
        nextSync = nextSyncDate.toISOString();
      } else {
        nextSync = "事件触发";
      }
    }

    const statusMap: Record<string, string> = {
      connected: "active",
      error: "paused",
      not_configured: "inactive",
      disabled: "disabled"
    };

    return {
      frequency,
      lastSync,
      nextSync,
      status: statusMap[integration.status] || "unknown"
    };
  },

  /**
   * 获取集成的健康状态。
   * 根据连接状态和最后同步时间判断健康度。
   */
  getIntegrationStatus(integrationId: string): {
    connected: boolean;
    lastConnected: string;
    health: "healthy" | "degraded" | "down";
  } {
    const integration = integrations.get(integrationId);
    if (!integration) {
      return { connected: false, lastConnected: "", health: "down" };
    }

    const connected = integration.status === "connected";
    const lastConnected = integration.lastSyncAt || "";

    // 根据最后同步时间判断健康状态
    if (!connected) {
      return { connected: false, lastConnected, health: "down" };
    }

    if (!lastConnected) {
      return { connected: true, lastConnected, health: "degraded" };
    }

    const now = new Date();
    const lastSyncDate = new Date(lastConnected);
    const hoursSinceLastSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    // 根据集成类型设置不同的健康阈值
    const thresholds: Record<string, number> = {
      slack: 1,
      github: 6,
      jira: 24,
      zendesk: 12,
      salesforce: 48,
      stripe: 72,
      webhook: 24,
      custom: 24
    };

    const threshold = thresholds[integration.type] || 24;

    if (hoursSinceLastSync > threshold * 2) {
      return { connected: true, lastConnected, health: "down" };
    }

    if (hoursSinceLastSync > threshold) {
      return { connected: true, lastConnected, health: "degraded" };
    }

    return { connected: true, lastConnected, health: "healthy" };
  },

  /**
   * 获取全局集成统计信息。
   * 包含总数、活跃数、按类型分组数和本月同步次数。
   */
  getIntegrationStats(): {
    total: number;
    active: number;
    byType: Record<string, number>;
    syncsThisMonth: number;
  } {
    const allIntegrations = integrations.getAll();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const total = allIntegrations.length;
    const active = allIntegrations.filter((i) => i.status === "connected").length;

    const byType: Record<string, number> = {};
    let syncsThisMonth = 0;

    for (const integration of allIntegrations) {
      // 按类型统计
      byType[integration.type] = (byType[integration.type] || 0) + 1;

      // 统计本月同步次数（基于 lastSyncAt）
      if (integration.lastSyncAt && integration.lastSyncAt >= startOfMonth) {
        syncsThisMonth++;
      }
    }

    return { total, active, byType, syncsThisMonth };
  }
};