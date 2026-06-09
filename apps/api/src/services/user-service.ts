import { store } from "../store";

import type { User } from "@trae/shared";

export function listUsers(tenantId?: string): User[] {
  if (!tenantId) return store.users;
  return store.users.filter((item) => item.tenantId === tenantId);
}

export function getUser(id: string): User | undefined {
  return store.users.find((item) => item.id === id);
}

export function addUser(user: User): User {
  store.users.push(user);
  return user;
}

export function updateUserRoles(id: string, roles: User["roles"]): User | undefined {
  const target = store.users.find((item) => item.id === id);
  if (!target) return undefined;
  target.roles = roles;
  return target;
}
