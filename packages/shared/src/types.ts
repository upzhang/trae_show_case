export type RoleCode =
  | "platform_admin"
  | "tenant_admin"
  | "auditor"
  | "release_manager"
  | "member";

export type PermissionCode =
  | "tenant:view"
  | "tenant:edit"
  | "user:view"
  | "user:edit"
  | "role:view"
  | "role:edit"
  | "approval:view"
  | "approval:approve"
  | "release:view"
  | "release:deploy"
  | "audit:view";

export interface Tenant {
  id: string;
  name: string;
  plan: "standard" | "enterprise";
  industry: string;
  healthScore: number;
  contractEndsAt: string;
  customerSuccessManager: string;
  seatsUsed: number;
  seatsLimit: number;
  monthlyActiveUsers: number;
  arr: number;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: RoleCode[];
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  decidedBy?: string;
}

export interface ReleaseRecord {
  id: string;
  tenantId: string;
  version: string;
  environment: "staging" | "production";
  status: "pending" | "deployed" | "rolled_back";
  operatorId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface SupportRisk {
  id: string;
  tenantId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting_customer" | "resolved";
  slaDueAt: string;
  ownerId: string;
  category: "support" | "security" | "adoption" | "billing" | "release";
  impact: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  tenantId: string;
  type: "user" | "approval" | "release" | "audit" | "risk";
  title: string;
  actorId: string;
  targetId?: string;
  createdAt: string;
}
