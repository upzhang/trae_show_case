import { approvals as seedApprovals, auditLogs as seedAuditLogs, releases as seedReleases, tenants as seedTenants, users as seedUsers } from "./data/seed";

import type { ApprovalRequest, AuditLog, ReleaseRecord, Tenant, User } from "@trae/shared";

const _tenants: Tenant[] = JSON.parse(JSON.stringify(seedTenants));
const _users: User[] = JSON.parse(JSON.stringify(seedUsers));
const _approvals: ApprovalRequest[] = JSON.parse(JSON.stringify(seedApprovals));
const _releases: ReleaseRecord[] = JSON.parse(JSON.stringify(seedReleases));
const _auditLogs: AuditLog[] = JSON.parse(JSON.stringify(seedAuditLogs));

export const store = {
  tenants: _tenants,
  users: _users,
  approvals: _approvals,
  releases: _releases,
  auditLogs: _auditLogs
};

export function resetStore(): void {
  store.tenants.splice(0, store.tenants.length, ...JSON.parse(JSON.stringify(seedTenants)));
  store.users.splice(0, store.users.length, ...JSON.parse(JSON.stringify(seedUsers)));
  store.approvals.splice(0, store.approvals.length, ...JSON.parse(JSON.stringify(seedApprovals)));
  store.releases.splice(0, store.releases.length, ...JSON.parse(JSON.stringify(seedReleases)));
  store.auditLogs.splice(0, store.auditLogs.length, ...JSON.parse(JSON.stringify(seedAuditLogs)));
}
