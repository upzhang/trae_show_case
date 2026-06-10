import { getPermissionsForRoles, hasPermission } from "@trae/shared";

import type { PermissionCode, RoleCode } from "@trae/shared";

let currentUserId = localStorage.getItem("demo:current-user-id") ?? "u-platform";
let currentRoles: RoleCode[] = [];

export function getCurrentUserId(): string {
  return currentUserId;
}

export function setCurrentUserId(id: string, roles: string[]): void {
  currentUserId = id;
  currentRoles = roles as RoleCode[];
  localStorage.setItem("demo:current-user-id", id);
}

export function getCurrentRoles(): RoleCode[] {
  return currentRoles;
}

export function getCurrentPermissions(): PermissionCode[] {
  return getPermissionsForRoles(currentRoles);
}

export function can(permission: PermissionCode): boolean {
  return hasPermission(currentRoles, permission);
}

export function fetchHeaders(): Record<string, string> {
  return { "x-user-id": currentUserId };
}
