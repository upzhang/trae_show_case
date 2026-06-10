import { store, releases, auditLogs } from "../store";

import type { ReleaseRecord, AuditLog } from "@trae/shared";

// 预置缺陷 2 — 接口契约漂移：shared/types.ts 声明 ReleaseRecord 返回 version,
// 但本服务响应额外拼了一个 "description" 字段（文档与前端均未预期），
// 同时 status 使用字符串字面量字段名保持一致。
export interface ReleaseWithDescription extends ReleaseRecord {
  description?: string;
}

export function listReleases(tenantId?: string): ReleaseWithDescription[] {
  const records = tenantId
    ? store.releases.filter((item) => item.tenantId === tenantId)
    : store.releases;
  return records.map((item) => ({
    ...item,
    description: `自动生成的发布记录 ${item.version}`
  }));
}

export function getRelease(id: string): ReleaseWithDescription | undefined {
  const target = store.releases.find((item) => item.id === id);
  if (!target) return undefined;
  return { ...target, description: `自动生成的发布记录 ${target.version}` };
}

export function deployRelease(id: string): ReleaseRecord | undefined {
  const target = store.releases.find((item) => item.id === id);
  if (!target) return undefined;
  target.status = "deployed";
  return target;
}

export function rollbackRelease(id: string): ReleaseRecord | undefined {
  const target = store.releases.find((item) => item.id === id);
  if (!target) return undefined;
  target.status = "rolled_back";
  return target;
}

export function createRelease(input: Omit<ReleaseRecord, "id">): ReleaseRecord {
  const next: ReleaseRecord = {
    ...input,
    id: `rel-${Date.now()}`
  };
  store.releases.push(next);
  return next;
}

// ========== 新增函数 ==========

/**
 * 部署历史：从审计日志中提取与指定 release 相关的部署记录
 */
export function getDeploymentHistory(releaseId: string): {
  version: string;
  environment: string;
  deployedAt: string;
  status: string;
}[] {
  const release = releases.get(releaseId);
  if (!release) return [];

  const history: {
    version: string;
    environment: string;
    deployedAt: string;
    status: string;
  }[] = [];

  // 从审计日志中查找该 release 的部署相关记录
  const deployLogs = auditLogs.items.filter(
    (log: AuditLog) =>
      log.resourceType === "release" &&
      log.resourceId === releaseId &&
      (log.action === "deploy" || log.action === "release.deployed")
  );

  for (const log of deployLogs) {
    history.push({
      version: release.version,
      environment: release.environment,
      deployedAt: log.createdAt,
      status: "deployed",
    });
  }

  // 如果当前 release 本身是 deployed 状态且有 deployedAt，也加入
  if (
    release.status === "deployed" &&
    release.deployedAt &&
    !history.some((h) => h.deployedAt === release.deployedAt)
  ) {
    history.push({
      version: release.version,
      environment: release.environment,
      deployedAt: release.deployedAt,
      status: "deployed",
    });
  }

  // 按部署时间降序
  history.sort(
    (a, b) =>
      new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
  );

  return history;
}

/**
 * 回滚历史：从审计日志中提取与指定 release 相关的回滚记录
 */
export function getRollbackHistory(releaseId: string): {
  fromVersion: string;
  toVersion: string;
  rolledBackAt: string;
  reason: string;
}[] {
  const release = releases.get(releaseId);
  if (!release) return [];

  const history: {
    fromVersion: string;
    toVersion: string;
    rolledBackAt: string;
    reason: string;
  }[] = [];

  // 从审计日志中查找回滚相关记录
  const rollbackLogs = auditLogs.items.filter(
    (log: AuditLog) =>
      log.resourceType === "release" &&
      log.resourceId === releaseId &&
      (log.action === "rollback" || log.action === "release.rolled_back")
  );

  for (const log of rollbackLogs) {
    history.push({
      fromVersion: release.version,
      toVersion:
        (log.details?.previousVersion as string) || "unknown",
      rolledBackAt: log.createdAt,
      reason: log.summary || (log.details?.reason as string) || "未指定原因",
    });
  }

  // 如果当前 release 本身是 rolled_back 状态且有 rolledBackAt，也加入
  if (
    release.status === "rolled_back" &&
    release.rolledBackAt &&
    !history.some((h) => h.rolledBackAt === release.rolledBackAt)
  ) {
    history.push({
      fromVersion: release.version,
      toVersion: "unknown",
      rolledBackAt: release.rolledBackAt,
      reason: "未指定原因",
    });
  }

  // 按回滚时间降序
  history.sort(
    (a, b) =>
      new Date(b.rolledBackAt).getTime() - new Date(a.rolledBackAt).getTime()
  );

  return history;
}

/**
 * 环境对比：对比 staging 和 production 环境的发布状态
 */
export function compareEnvironments(): {
  production: { releaseCount: number; deployedCount: number; rolledBackCount: number; latestVersion: string | null };
  staging: { releaseCount: number; deployedCount: number; rolledBackCount: number; latestVersion: string | null };
} {
  const allReleases = releases.getAll();

  const prodReleases = allReleases.filter(
    (r) => r.environment === "production"
  );
  const stagingReleases = allReleases.filter(
    (r) => r.environment === "staging"
  );

  const getLatestVersion = (items: ReleaseRecord[]): string | null => {
    if (items.length === 0) return null;
    const sorted = [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0].version;
  };

  return {
    production: {
      releaseCount: prodReleases.length,
      deployedCount: prodReleases.filter((r) => r.status === "deployed").length,
      rolledBackCount: prodReleases.filter((r) => r.status === "rolled_back").length,
      latestVersion: getLatestVersion(prodReleases),
    },
    staging: {
      releaseCount: stagingReleases.length,
      deployedCount: stagingReleases.filter((r) => r.status === "deployed").length,
      rolledBackCount: stagingReleases.filter((r) => r.status === "rolled_back").length,
      latestVersion: getLatestVersion(stagingReleases),
    },
  };
}

/**
 * 发布统计：总数、已部署、已回滚、待处理、按环境分布
 */
export function getReleaseStats(): {
  total: number;
  deployed: number;
  rolledBack: number;
  pending: number;
  byEnvironment: Record<string, number>;
} {
  const allReleases = releases.getAll();
  const total = allReleases.length;
  const deployed = allReleases.filter((r) => r.status === "deployed").length;
  const rolledBack = allReleases.filter((r) => r.status === "rolled_back").length;
  const pending = allReleases.filter((r) => r.status === "pending").length;

  const byEnvironment: Record<string, number> = {};
  for (const r of allReleases) {
    byEnvironment[r.environment] = (byEnvironment[r.environment] || 0) + 1;
  }

  return { total, deployed, rolledBack, pending, byEnvironment };
}
