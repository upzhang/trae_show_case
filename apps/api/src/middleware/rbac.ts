import type { NextFunction, Request, Response } from "express";

import { store } from "../store";
import { hasPermission } from "@trae/shared";

import type { PermissionCode } from "@trae/shared";

// 预置缺陷 1 — 权限缺口：
// 对于 "role:edit" 权限，只有 platform_admin 在 shared 包中拥有，
// 但这里的 requirePermission 不会显式报错，tenant_admin 角色的用户
// 调用 PUT /api/users/:id/roles 时仍会成功通过（因为 RBAC 表中
// tenant_admin 实际上不包含 role:edit，本应拒绝）。
//
// 注意：下方实现本身是按 shared/rbac.ts 做正确校验，真正的"问题"在于：
// 前端（后续实现）会给 tenant_admin 展示"角色编辑"按钮，后端按 shared 规则
// 是会拒绝的。为了构成"可被修复的权限不一致"，我们在用户角色编辑接口
// 处显式绕过了 RBAC 校验。

export function requirePermission(permission: PermissionCode) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.currentUserId;
    if (!userId) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    const user = store.users.find((item) => item.id === userId);
    if (!user) {
      res.status(401).json({ error: "user not found" });
      return;
    }
    if (!hasPermission(user.roles, permission)) {
      res.status(403).json({ error: `missing permission ${permission}` });
      return;
    }
    next();
  };
}
