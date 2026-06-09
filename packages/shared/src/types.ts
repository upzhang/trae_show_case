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
