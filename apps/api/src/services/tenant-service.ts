import { store } from "../store";

import type { Tenant } from "@trae/shared";

export function listTenants(): Tenant[] {
  return store.tenants;
}

export function getTenant(id: string): Tenant | undefined {
  return store.tenants.find((item) => item.id === id);
}

export function updateTenantPlan(id: string, plan: Tenant["plan"]): Tenant | undefined {
  const target = store.tenants.find((item) => item.id === id);
  if (!target) return undefined;
  target.plan = plan;
  return target;
}
