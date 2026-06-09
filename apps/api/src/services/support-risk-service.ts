import { store } from "../store";

import type { SupportRisk } from "@trae/shared";

export function listSupportRisks(tenantId?: string, includeAllTenants = false): SupportRisk[] {
  const records = includeAllTenants || !tenantId
    ? store.supportRisks
    : store.supportRisks.filter((item) => item.tenantId === tenantId);
  return [...records].sort((a, b) => a.slaDueAt.localeCompare(b.slaDueAt));
}
