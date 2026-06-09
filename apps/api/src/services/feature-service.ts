import { featureFlags, featureFlagAudits } from "../store";
import type { FeatureFlag, FeatureFlagAudit } from "@trae/shared";

export const featureService = {
  createFlag(key: string, name: string, description: string, type: FeatureFlag["type"], defaultValue: unknown, actorId: string): FeatureFlag {
    const flag = featureFlags.create({
      key,
      name,
      description,
      type,
      defaultValue,
      isEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    featureFlagAudits.recordChange(key, actorId, "created", undefined, defaultValue);
    return flag;
  },

  getFlag(key: string): FeatureFlag | undefined {
    return featureFlags.findByKey(key);
  },

  getAllFlags(): FeatureFlag[] {
    return featureFlags.getAll();
  },

  updateFlag(key: string, updates: Partial<FeatureFlag>, actorId: string): FeatureFlag | undefined {
    const flag = featureFlags.findByKey(key);
    if (!flag) return undefined;
    
    const oldValue = flag.defaultValue;
    
    const updated = featureFlags.update(flag.id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    featureFlagAudits.recordChange(key, actorId, "updated", oldValue, updates.defaultValue);
    return updated;
  },

  deleteFlag(key: string, actorId: string): boolean {
    const flag = featureFlags.findByKey(key);
    if (!flag) return false;
    
    const oldValue = flag.defaultValue;
    featureFlags.delete(flag.id);
    featureFlagAudits.recordChange(key, actorId, "deleted", oldValue, undefined);
    return true;
  },

  getValue(key: string, tenantId?: string): unknown {
    return featureFlags.getValue(key, tenantId);
  },

  addTenantOverride(key: string, tenantId: string, value: unknown, actorId: string): void {
    featureFlags.addTenantOverride(key, tenantId, value);
    featureFlagAudits.recordChange(key, actorId, "override_added", undefined, { tenantId, value });
  },

  removeTenantOverride(key: string, tenantId: string, actorId: string): void {
    featureFlags.removeTenantOverride(key, tenantId);
    featureFlagAudits.recordChange(key, actorId, "override_removed", { tenantId, value: null }, undefined);
  },

  getAuditLogs(key: string): FeatureFlagAudit[] {
    return featureFlagAudits.findByFeatureKey(key);
  },

  getActorAuditLogs(actorId: string): FeatureFlagAudit[] {
    return featureFlagAudits.findByActorId(actorId);
  },

  isEnabled(key: string, tenantId?: string): boolean {
    const flag = featureFlags.findByKey(key);
    if (!flag || !flag.isEnabled) return false;
    
    const value = this.getValue(key, tenantId);
    return value === true;
  },

  getPercentage(key: string): number {
    const flag = featureFlags.findByKey(key);
    return flag?.rolloutPercentage ?? 0;
  },

  isUserInRollout(key: string, userId: string): boolean {
    const percentage = this.getPercentage(key);
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 100) < percentage;
  }
};