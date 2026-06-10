import { store, auditLogs } from "../store";

import type { AuditLog } from "@trae/shared";

export function listAuditLogs(tenantId?: string): AuditLog[] {
  const logs = tenantId
    ? store.auditLogs.filter((item) => item.tenantId === tenantId)
    : store.auditLogs;
  return [...logs].reverse();
}

export function recordAuditLog(input: Omit<AuditLog, "id" | "createdAt">): AuditLog {
  const next: AuditLog = {
    ...input,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  store.auditLogs.push(next);
  return next;
}

/**
 * 获取审计日志的变更前后对比。
 * 通过查找同一 resourceType + resourceId 的前一条日志来构建 before/after 快照。
 */
export function getAuditDiff(logId: string): { before: object; after: object; changedFields: string[] } {
  const target = auditLogs.get(logId);
  if (!target) {
    return { before: {}, after: {}, changedFields: [] };
  }

  // 查找同一资源的前一条审计日志作为 "before"
  const allLogs = auditLogs.getAll();
  const sameResourceLogs = allLogs
    .filter((l) =>
      l.resourceType === target.resourceType &&
      l.resourceId === target.resourceId &&
      l.id !== target.id
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const previous = sameResourceLogs.length > 0
    ? sameResourceLogs[sameResourceLogs.length - 1]
    : null;

  const before: Record<string, unknown> = previous
    ? { action: previous.action, summary: previous.summary, details: previous.details ?? {}, actorId: previous.actorId }
    : {};

  const after: Record<string, unknown> = {
    action: target.action,
    summary: target.summary,
    details: target.details ?? {},
    actorId: target.actorId
  };

  // 对比字段差异
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    const beforeVal = JSON.stringify(before[key]);
    const afterVal = JSON.stringify(after[key]);
    if (beforeVal !== afterVal) {
      changedFields.push(key);
    }
  }

  return { before, after, changedFields };
}

/**
 * 导出审计日志为 CSV 或 JSON 格式字符串。
 */
export function exportAuditLogs(format: "csv" | "json", filters?: Record<string, unknown>): string {
  let logs = auditLogs.getAll();

  if (filters) {
    if (filters.tenantId) {
      logs = logs.filter((l) => l.tenantId === filters.tenantId);
    }
    if (filters.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters.actorId) {
      logs = logs.filter((l) => l.actorId === filters.actorId);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate as string).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate as string).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() <= end);
    }
  }

  // 按时间倒序
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (format === "json") {
    return JSON.stringify(logs, null, 2);
  }

  // CSV 格式
  const headers = ["id", "tenantId", "actorId", "action", "summary", "resourceType", "resourceId", "createdAt"];
  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
      return `"${str.replace(/"/g, "\"\"")}"`;
    }
    return str;
  };

  const rows = logs.map((l) =>
    headers.map((h) => escapeCsv((l as unknown as Record<string, unknown>)[h])).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * 获取审计日志统计聚合数据。
 */
export function getAuditStats(): {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byAction: Record<string, number>;
  byActor: Record<string, number>;
} {
  const allLogs = auditLogs.getAll();
  const now = new Date();

  // 今天 00:00:00
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // 本周一 00:00:00
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset).getTime();
  // 本月 1 号 00:00:00
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  const byAction: Record<string, number> = {};
  const byActor: Record<string, number> = {};

  for (const log of allLogs) {
    const logTime = new Date(log.createdAt).getTime();

    if (logTime >= todayStart) today++;
    if (logTime >= weekStart) thisWeek++;
    if (logTime >= monthStart) thisMonth++;

    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byActor[log.actorId] = (byActor[log.actorId] || 0) + 1;
  }

  return { today, thisWeek, thisMonth, byAction, byActor };
}

/**
 * 高级搜索审计日志。
 */
export function searchAuditLogs(query: {
  action?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  resourceType?: string;
  resourceId?: string;
  tenantId?: string;
}): AuditLog[] {
  let logs = auditLogs.getAll();

  if (query.tenantId) {
    logs = logs.filter((l) => l.tenantId === query.tenantId);
  }
  if (query.action) {
    logs = logs.filter((l) => l.action === query.action);
  }
  if (query.actorId) {
    logs = logs.filter((l) => l.actorId === query.actorId);
  }
  if (query.resourceType) {
    logs = logs.filter((l) => l.resourceType === query.resourceType);
  }
  if (query.resourceId) {
    logs = logs.filter((l) => l.resourceId === query.resourceId);
  }
  if (query.startDate) {
    const start = new Date(query.startDate).getTime();
    logs = logs.filter((l) => new Date(l.createdAt).getTime() >= start);
  }
  if (query.endDate) {
    const end = new Date(query.endDate).getTime();
    logs = logs.filter((l) => new Date(l.createdAt).getTime() <= end);
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
