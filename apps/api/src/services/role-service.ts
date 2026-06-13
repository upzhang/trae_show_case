import { roleDefinitions } from "../store";
import type { RoleDefinition } from "@trae/shared";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../lib/errors";

/** 所有可用权限码 */
const ALL_PERMISSIONS = [
  "tenant:read", "tenant:write", "tenant:delete",
  "user:read", "user:write", "user:delete",
  "role:read", "role:write", "role:delete",
  "approval:read", "approval:write", "approval:approve",
  "release:read", "release:write", "release:deploy", "release:rollback",
  "audit:read", "audit:export",
  "risk:read", "risk:write",
  "activity:read",
  "webhook:read", "webhook:manage",
  "token:read", "token:manage",
  "team:read", "team:manage",
  "integration:read", "integration:manage",
  "feature:read", "feature:manage",
  "ticket:read", "ticket:manage",
  "subscription:read", "subscription:manage",
  "invoice:read", "invoice:manage",
  "notification:read", "notification:manage",
  "metric:read",
];

/** 按模块分组权限 */
const PERMISSION_GROUPS: Record<string, string[]> = {
  "租户管理": ["tenant:read", "tenant:write", "tenant:delete"],
  "用户管理": ["user:read", "user:write", "user:delete"],
  "角色管理": ["role:read", "role:write", "role:delete"],
  "审批中心": ["approval:read", "approval:write", "approval:approve"],
  "发布中心": ["release:read", "release:write", "release:deploy", "release:rollback"],
  "审计日志": ["audit:read", "audit:export"],
  "风险管理": ["risk:read", "risk:write"],
  "活动事件": ["activity:read"],
  "Webhook": ["webhook:read", "webhook:manage"],
  "API Token": ["token:read", "token:manage"],
  "团队管理": ["team:read", "team:manage"],
  "系统集成": ["integration:read", "integration:manage"],
  "功能开关": ["feature:read", "feature:manage"],
  "工单管理": ["ticket:read", "ticket:manage"],
  "订阅管理": ["subscription:read", "subscription:manage"],
  "发票管理": ["invoice:read", "invoice:manage"],
  "通知中心": ["notification:read", "notification:manage"],
  "数据分析": ["metric:read"],
};

/** 获取所有权限码 */
export function getAllPermissions(): string[] {
  return [...ALL_PERMISSIONS];
}

/** 获取权限分组 */
export function getPermissionGroups(): Record<string, string[]> {
  return { ...PERMISSION_GROUPS };
}

/** 创建自定义角色 */
export function createRole(data: { name: string; description?: string; permissions: string[] }): RoleDefinition {
  const existing = roleDefinitions.getAll().find((r) => r.name === data.name);
  if (existing) {
    throw new ConflictError("CONFLICT_ROLE_NAME_EXISTS", "角色名称已存在");
  }

  const validPermissions = data.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
  const role = roleDefinitions.create({
    name: data.name,
    description: data.description ?? "",
    permissions: validPermissions as RoleDefinition["permissions"],
    type: "custom" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return role;
}

/** 更新角色 */
export function updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }): RoleDefinition {
  const role = roleDefinitions.get(id);
  if (!role) {
    throw new NotFoundError("NOT_FOUND_ROLE", "角色不存在", { id });
  }
  if (role.type === "system") {
    throw new ForbiddenError("系统角色不可编辑", { id, type: "system" });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.permissions !== undefined) {
    updates.permissions = data.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
  }

  const updated = roleDefinitions.update(id, updates);
  return updated!;
}

/** 克隆角色 */
export function cloneRole(id: string, newName: string): RoleDefinition {
  const role = roleDefinitions.get(id);
  if (!role) {
    throw new NotFoundError("NOT_FOUND_ROLE", "角色不存在", { id });
  }

  const cloned = roleDefinitions.create({
    name: newName,
    description: `${role.description} (副本)`,
    permissions: [...role.permissions],
    type: "custom" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return cloned;
}

/** 删除角色 */
export function deleteRole(id: string): void {
  const role = roleDefinitions.get(id);
  if (!role) {
    throw new NotFoundError("NOT_FOUND_ROLE", "角色不存在", { id });
  }
  if (role.type === "system") {
    throw new ForbiddenError("系统角色不可删除", { id, type: "system" });
  }
  roleDefinitions.delete(id);
}
