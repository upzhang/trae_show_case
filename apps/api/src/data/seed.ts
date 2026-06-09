import type {
  ApprovalRequest,
  AuditLog,
  ReleaseRecord,
  Tenant,
  User
} from "@trae/shared";

export const tenants: Tenant[] = [
  {
    id: "tenant-acme",
    name: "Acme SaaS",
    plan: "enterprise"
  },
  {
    id: "tenant-orbit",
    name: "Orbit Labs",
    plan: "standard"
  }
];

export const users: User[] = [
  {
    id: "u-platform",
    tenantId: "tenant-acme",
    name: "平台管理员",
    email: "platform@example.com",
    roles: ["platform_admin"]
  },
  {
    id: "u-tenant-admin",
    tenantId: "tenant-acme",
    name: "租户管理员",
    email: "tenant.admin@example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-auditor",
    tenantId: "tenant-acme",
    name: "审计员",
    email: "audit@example.com",
    roles: ["auditor"]
  },
  {
    id: "u-release",
    tenantId: "tenant-acme",
    name: "发布经理",
    email: "release@example.com",
    roles: ["release_manager"]
  }
];

export const approvals: ApprovalRequest[] = [
  {
    id: "ap-1001",
    tenantId: "tenant-acme",
    title: "开通生产环境单点登录",
    status: "pending",
    requestedBy: "u-tenant-admin"
  },
  {
    id: "ap-1002",
    tenantId: "tenant-acme",
    title: "调整审批流超时时间",
    status: "approved",
    requestedBy: "u-platform",
    decidedBy: "u-release"
  }
];

export const releases: ReleaseRecord[] = [
  {
    id: "rel-20260601",
    tenantId: "tenant-acme",
    version: "2026.06.01",
    environment: "production",
    status: "deployed",
    operatorId: "u-release",
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "rel-20260605",
    tenantId: "tenant-acme",
    version: "2026.06.05",
    environment: "staging",
    status: "pending",
    operatorId: "u-release",
    createdAt: "2026-06-05T15:00:00.000Z"
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: "log-1",
    tenantId: "tenant-acme",
    actorId: "u-platform",
    action: "approval.approved",
    summary: "审批 ap-1002 已通过",
    createdAt: "2026-06-02T08:30:00.000Z"
  }
];
