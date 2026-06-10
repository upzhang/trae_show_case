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
  },

  /**
   * 灰度计算：返回目标百分比、当前覆盖范围、符合条件的租户数
   */
  calculateRolloutPercentage(featureKey: string): { targetPercentage: number; currentCoverage: number; eligibleTenants: number } {
    const flag = featureFlags.findByKey(featureKey);
    if (!flag) {
      return { targetPercentage: 0, currentCoverage: 0, eligibleTenants: 0 };
    }

    const targetPercentage = flag.rolloutPercentage ?? 0;
    const allFlags = featureFlags.getAll();
    const totalFlags = allFlags.length || 1;

    // 当前覆盖：已启用且有覆盖的开关数 / 总开关数
    const enabledFlags = allFlags.filter((f) => f.isEnabled);
    const flagsWithOverrides = enabledFlags.filter((f) => f.tenantOverrides && f.tenantOverrides.length > 0);
    const currentCoverage = Math.round((flagsWithOverrides.length / totalFlags) * 100);

    // 符合条件的租户数：有 tenantOverrides 的租户去重计数
    const tenantSet = new Set<string>();
    for (const f of enabledFlags) {
      if (f.tenantOverrides) {
        for (const override of f.tenantOverrides) {
          tenantSet.add(override.tenantId);
        }
      }
    }

    return {
      targetPercentage,
      currentCoverage,
      eligibleTenants: tenantSet.size
    };
  },

  /**
   * 依赖检查：检查功能开关之间的依赖与冲突关系
   */
  checkDependencies(featureKey: string): { dependsOn: string[]; conflictsWith: string[]; allSatisfied: boolean } {
    const flag = featureFlags.findByKey(featureKey);
    if (!flag) {
      return { dependsOn: [], conflictsWith: [], allSatisfied: false };
    }

    // 从描述中解析依赖关系（约定格式：depends:xxx 或 conflicts:xxx）
    const dependsOn: string[] = [];
    const conflictsWith: string[] = [];

    if (flag.description) {
      const depMatch = flag.description.match(/depends:([\w,]+)/);
      if (depMatch) {
        dependsOn.push(...depMatch[1].split(",").map((s) => s.trim()));
      }
      const conflictMatch = flag.description.match(/conflicts:([\w,]+)/);
      if (conflictMatch) {
        conflictsWith.push(...conflictMatch[1].split(",").map((s) => s.trim()));
      }
    }

    // 检查所有依赖是否已启用
    const allSatisfied = dependsOn.every((depKey) => {
      const depFlag = featureFlags.findByKey(depKey);
      return depFlag !== undefined && depFlag.isEnabled;
    });

    return { dependsOn, conflictsWith, allSatisfied };
  },

  /**
   * 回滚策略：判断功能开关是否可以回滚，返回最近稳定值及受影响租户数
   */
  getRollbackStrategy(featureKey: string): { canRollback: boolean; lastStableValue: unknown; affectedTenants: number } {
    const flag = featureFlags.findByKey(featureKey);
    if (!flag) {
      return { canRollback: false, lastStableValue: null, affectedTenants: 0 };
    }

    // 从审计日志中查找最近一次更新前的值作为稳定值
    const audits = featureFlagAudits.findByFeatureKey(featureKey);
    const updateAudits = audits
      .filter((a) => a.changeType === "updated")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const lastStableValue = updateAudits.length > 0 ? updateAudits[0].oldValue : flag.defaultValue;

    // 受影响的租户数
    const affectedTenants = flag.tenantOverrides ? flag.tenantOverrides.length : 0;

    // 可以回滚的条件：开关已启用且有历史变更记录
    const canRollback = flag.isEnabled && updateAudits.length > 0;

    return { canRollback, lastStableValue, affectedTenants };
  },

  /**
   * 功能开关统计：汇总所有开关的状态分布
   */
  getFeatureStats(): { total: number; enabled: number; disabled: number; inRollout: number; withOverrides: number } {
    const allFlags = featureFlags.getAll();
    const total = allFlags.length;
    const enabled = allFlags.filter((f) => f.isEnabled).length;
    const disabled = total - enabled;
    const inRollout = allFlags.filter((f) => f.rolloutPercentage !== undefined && f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length;
    const withOverrides = allFlags.filter((f) => f.tenantOverrides && f.tenantOverrides.length > 0).length;

    return { total, enabled, disabled, inRollout, withOverrides };
  }
};