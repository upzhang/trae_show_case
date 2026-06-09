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
  }
};