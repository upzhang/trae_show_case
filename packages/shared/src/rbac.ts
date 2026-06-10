import type { PermissionCode, RoleCode } from "./types";

export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  platform_admin: [
    "tenant:view",
    "tenant:edit",
    "tenant:read",
    "tenant:write",
    "tenant:delete",
    "user:view",
    "user:edit",
    "user:read",
    "user:write",
    "user:delete",
    "role:view",
    "role:edit",
    "role:read",
    "role:write",
    "role:delete",
    "approval:view",
    "approval:approve",
    "approval:read",
    "approval:write",
    "release:view",
    "release:deploy",
    "release:read",
    "release:write",
    "release:rollback",
    "audit:view",
    "audit:read",
    "audit:export",
    "risk:read",
    "risk:write",
    "activity:read",
    "billing:view",
    "billing:edit",
    "notification:view",
    "notification:manage",
    "notification:read",
    "webhook:manage",
    "webhook:read",
    "metric:view",
    "metric:read",
    "token:manage",
    "token:read",
    "team:manage",
    "team:read",
    "team:create",
    "integration:manage",
    "integration:read",
    "integration:create",
    "feature:manage",
    "feature:read",
    "ticket:view",
    "ticket:edit",
    "ticket:manage",
    "ticket:read",
    "subscription:read",
    "subscription:manage",
    "invoice:read",
    "invoice:manage"
  ],
  tenant_admin: [
    "tenant:view",
    "tenant:edit",
    "tenant:read",
    "tenant:write",
    "user:view",
    "user:edit",
    "user:read",
    "user:write",
    "role:view",
    "role:edit",
    "role:read",
    "role:write",
    "approval:view",
    "approval:approve",
    "approval:read",
    "approval:write",
    "release:view",
    "release:read",
    "release:write",
    "billing:view",
    "notification:view",
    "notification:manage",
    "notification:read",
    "webhook:manage",
    "webhook:read",
    "metric:view",
    "metric:read",
    "token:manage",
    "token:read",
    "team:manage",
    "team:read",
    "team:create",
    "integration:manage",
    "integration:read",
    "integration:create",
    "feature:read",
    "ticket:view",
    "ticket:edit",
    "ticket:manage",
    "ticket:read",
    "subscription:read",
    "invoice:read"
  ],
  auditor: [
    "tenant:view",
    "tenant:read",
    "user:view",
    "user:read",
    "role:view",
    "role:read",
    "approval:view",
    "approval:read",
    "release:view",
    "release:read",
    "audit:view",
    "audit:read",
    "audit:export",
    "billing:view",
    "notification:view",
    "notification:read",
    "metric:view",
    "metric:read",
    "ticket:view",
    "ticket:read",
    "invoice:read"
  ],
  release_manager: [
    "tenant:view",
    "tenant:read",
    "approval:view",
    "approval:approve",
    "approval:read",
    "release:view",
    "release:deploy",
    "release:read",
    "release:write",
    "release:rollback",
    "notification:view",
    "notification:read",
    "metric:view",
    "metric:read"
  ],
  member: [
    "tenant:view",
    "tenant:read",
    "user:view",
    "user:read",
    "approval:view",
    "approval:read",
    "release:view",
    "release:read",
    "notification:view",
    "notification:read",
    "ticket:view",
    "ticket:read"
  ]
};

export function getPermissionsForRoles(roles: RoleCode[]): PermissionCode[] {
  return [...new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []))];
}

export function hasPermission(
  roles: RoleCode[],
  permission: PermissionCode
): boolean {
  return getPermissionsForRoles(roles).includes(permission);
}

export function hasAnyPermission(
  roles: RoleCode[],
  permissions: PermissionCode[]
): boolean {
  const userPermissions = getPermissionsForRoles(roles);
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  roles: RoleCode[],
  permissions: PermissionCode[]
): boolean {
  const userPermissions = getPermissionsForRoles(roles);
  return permissions.every((p) => userPermissions.includes(p));
}

export const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  "tenant:view": "查看租户信息",
  "tenant:edit": "编辑租户信息",
  "tenant:read": "读取租户数据",
  "tenant:write": "写入租户数据",
  "tenant:delete": "删除租户",
  "user:view": "查看用户信息",
  "user:edit": "编辑用户信息",
  "user:read": "读取用户数据",
  "user:write": "写入用户数据",
  "user:delete": "删除用户",
  "role:view": "查看角色定义",
  "role:edit": "编辑角色定义",
  "role:read": "读取角色数据",
  "role:write": "写入角色数据",
  "role:delete": "删除角色",
  "approval:view": "查看审批请求",
  "approval:approve": "审批请求",
  "approval:read": "读取审批数据",
  "approval:write": "写入审批数据",
  "release:view": "查看发布记录",
  "release:deploy": "部署发布",
  "release:read": "读取发布数据",
  "release:write": "写入发布数据",
  "release:rollback": "回滚发布",
  "audit:view": "查看审计日志",
  "audit:read": "读取审计数据",
  "audit:export": "导出审计日志",
  "risk:read": "读取风险数据",
  "risk:write": "写入风险数据",
  "activity:read": "读取活动事件",
  "billing:view": "查看计费信息",
  "billing:edit": "编辑计费信息",
  "notification:view": "查看通知",
  "notification:manage": "管理通知偏好",
  "notification:read": "读取通知数据",
  "webhook:manage": "管理 Webhook",
  "webhook:read": "读取 Webhook 数据",
  "metric:view": "查看指标数据",
  "metric:read": "读取指标数据",
  "token:manage": "管理 API Token",
  "token:read": "读取 Token 数据",
  "team:manage": "管理团队",
  "team:read": "读取团队数据",
  "team:create": "创建团队",
  "integration:manage": "管理集成",
  "integration:read": "读取集成数据",
  "integration:create": "创建集成",
  "feature:manage": "管理功能开关",
  "feature:read": "读取功能开关数据",
  "ticket:view": "查看工单",
  "ticket:edit": "编辑工单",
  "ticket:manage": "管理工单（含状态变更）",
  "ticket:read": "读取工单数据",
  "subscription:read": "读取订阅数据",
  "subscription:manage": "管理订阅",
  "invoice:read": "读取发票数据",
  "invoice:manage": "管理发票",
};

export const PERMISSION_GROUPS: { group: string; permissions: PermissionCode[] }[] = [
  {
    group: "租户管理",
    permissions: ["tenant:view", "tenant:edit", "tenant:read", "tenant:write", "tenant:delete"]
  },
  {
    group: "用户管理",
    permissions: ["user:view", "user:edit", "user:read", "user:write", "user:delete"]
  },
  {
    group: "角色权限",
    permissions: ["role:view", "role:edit", "role:read", "role:write", "role:delete"]
  },
  {
    group: "审批管理",
    permissions: ["approval:view", "approval:approve", "approval:read", "approval:write"]
  },
  {
    group: "发布管理",
    permissions: ["release:view", "release:deploy", "release:read", "release:write", "release:rollback"]
  },
  {
    group: "审计日志",
    permissions: ["audit:view", "audit:read", "audit:export"]
  },
  {
    group: "风险管理",
    permissions: ["risk:read", "risk:write"]
  },
  {
    group: "活动事件",
    permissions: ["activity:read"]
  },
  {
    group: "计费管理",
    permissions: ["billing:view", "billing:edit"]
  },
  {
    group: "通知管理",
    permissions: ["notification:view", "notification:manage", "notification:read"]
  },
  {
    group: "Webhook",
    permissions: ["webhook:manage", "webhook:read"]
  },
  {
    group: "数据分析",
    permissions: ["metric:view", "metric:read"]
  },
  {
    group: "API Token",
    permissions: ["token:manage", "token:read"]
  },
  {
    group: "团队管理",
    permissions: ["team:manage", "team:read", "team:create"]
  },
  {
    group: "集成管理",
    permissions: ["integration:manage", "integration:read", "integration:create"]
  },
  {
    group: "功能开关",
    permissions: ["feature:manage", "feature:read"]
  },
  {
    group: "工单管理",
    permissions: ["ticket:view", "ticket:edit", "ticket:manage", "ticket:read"]
  },
  {
    group: "订阅管理",
    permissions: ["subscription:read", "subscription:manage"]
  },
  {
    group: "发票管理",
    permissions: ["invoice:read", "invoice:manage"]
  },
];
