import { store } from "../store";

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
