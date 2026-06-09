import type { PermissionCode, RoleCode } from "./types";

export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  platform_admin: [
    "tenant:view",
    "tenant:edit",
    "user:view",
    "user:edit",
    "role:view",
    "role:edit",
    "approval:view",
    "approval:approve",
    "release:view",
    "release:deploy",
    "audit:view",
    "billing:view",
    "billing:edit",
    "notification:view",
    "notification:manage",
    "webhook:manage",
    "metric:view",
    "token:manage",
    "team:manage",
    "integration:manage",
    "feature:manage",
    "ticket:view",
    "ticket:edit",
    "ticket:manage"
  ],
  tenant_admin: [
    "tenant:view",
    "tenant:edit",
    "user:view",
    "user:edit",
    "role:view",
    "role:edit",
    "approval:view",
    "approval:approve",
    "release:view",
    "billing:view",
    "notification:view",
    "notification:manage",
    "webhook:manage",
    "metric:view",
    "token:manage",
    "team:manage",
    "integration:manage",
    "ticket:view",
    "ticket:edit",
    "ticket:manage"
  ],
  auditor: [
    "tenant:view",
    "user:view",
    "role:view",
    "approval:view",
    "release:view",
    "audit:view",
    "billing:view",
    "notification:view",
    "metric:view",
    "ticket:view"
  ],
  release_manager: [
    "tenant:view",
    "approval:view",
    "approval:approve",
    "release:view",
    "release:deploy",
    "notification:view",
    "metric:view"
  ],
  member: [
    "tenant:view",
    "user:view",
    "approval:view",
    "release:view",
    "notification:view",
    "ticket:view"
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
  "user:view": "查看用户信息",
  "user:edit": "编辑用户信息",
  "role:view": "查看角色定义",
  "role:edit": "编辑角色定义",
  "approval:view": "查看审批请求",
  "approval:approve": "审批请求",
  "release:view": "查看发布记录",
  "release:deploy": "部署发布",
  "audit:view": "查看审计日志",
  "billing:view": "查看计费信息",
  "billing:edit": "编辑计费信息",
  "notification:view": "查看通知",
  "notification:manage": "管理通知偏好",
  "webhook:manage": "管理 Webhook",
  "metric:view": "查看指标数据",
  "token:manage": "管理 API Token",
  "team:manage": "管理团队",
  "integration:manage": "管理集成",
  "feature:manage": "管理功能开关",
  "ticket:view": "查看工单",
  "ticket:edit": "编辑工单",
  "ticket:manage": "管理工单（含状态变更）"
};

export const PERMISSION_GROUPS: { group: string; permissions: PermissionCode[] }[] = [
  {
    group: "租户管理",
    permissions: ["tenant:view", "tenant:edit"]
  },
  {
    group: "用户管理",
    permissions: ["user:view", "user:edit"]
  },
  {
    group: "角色权限",
    permissions: ["role:view", "role:edit"]
  },
  {
    group: "审批管理",
    permissions: ["approval:view", "approval:approve"]
  },
  {
    group: "发布管理",
    permissions: ["release:view", "release:deploy"]
  },
  {
    group: "审计日志",
    permissions: ["audit:view"]
  },
  {
    group: "计费管理",
    permissions: ["billing:view", "billing:edit"]
  },
  {
    group: "通知管理",
    permissions: ["notification:view", "notification:manage"]
  },
  {
    group: "Webhook",
    permissions: ["webhook:manage"]
  },
  {
    group: "数据分析",
    permissions: ["metric:view"]
  },
  {
    group: "API Token",
    permissions: ["token:manage"]
  },
  {
    group: "团队管理",
    permissions: ["team:manage"]
  },
  {
    group: "集成管理",
    permissions: ["integration:manage"]
  },
  {
    group: "功能开关",
    permissions: ["feature:manage"]
  },
  {
    group: "工单管理",
    permissions: ["ticket:view", "ticket:edit", "ticket:manage"]
  }
];
