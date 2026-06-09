import { store } from "../store";

import type { ActivityEvent } from "@trae/shared";

export function listActivityEvents(tenantId?: string, includeAllTenants = false): ActivityEvent[] {
  const records = includeAllTenants || !tenantId
    ? store.activityEvents
    : store.activityEvents.filter((item) => item.tenantId === tenantId);
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
