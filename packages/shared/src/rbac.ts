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
    "audit:view"
  ],
  tenant_admin: [
    "tenant:view",
    "tenant:edit",
    "user:view",
    "user:edit",
    "role:view",
    "approval:view",
    "release:view"
  ],
  auditor: [
    "tenant:view",
    "user:view",
    "approval:view",
    "release:view",
    "audit:view"
  ],
  release_manager: [
    "tenant:view",
    "approval:view",
    "approval:approve",
    "release:view",
    "release:deploy"
  ],
  member: [
    "tenant:view",
    "user:view",
    "approval:view"
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
