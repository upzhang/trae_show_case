# RBAC 矩阵

本项目使用共享的角色/权限枚举与映射，位于 `packages/shared/src/rbac.ts`，定义于 `packages/shared/src/types.ts`。

## 权限枚举

- `tenant:view` — 查看租户
- `tenant:edit` — 修改租户计划
- `user:view` — 查看用户
- `user:edit` — 创建/修改用户
- `role:view` — 查看角色配置
- `role:edit` — 修改用户角色（注意：与 `user:edit` 不同，只有 `platform_admin` 拥有此权限）
- `approval:view` — 查看审批
- `approval:approve` — 通过或拒绝审批
- `release:view` — 查看发布记录
- `release:deploy` — 发布/回滚
- `audit:view` — 查看审计日志

## 角色 → 权限映射

| 权限 | platform_admin | tenant_admin | auditor | release_manager | member |
| --- | --- | --- | --- | --- | --- |
| tenant:view | ✅ | ✅ | ✅ | ✅ | ✅ |
| tenant:edit | ✅ | ✅ |  |  |  |
| user:view | ✅ | ✅ | ✅ |  | ✅ |
| user:edit | ✅ | ✅ |  |  |  |
| role:view | ✅ | ✅ |  |  |  |
| role:edit | ✅ |  |  |  |  |
| approval:view | ✅ | ✅ | ✅ | ✅ | ✅ |
| approval:approve | ✅ |  |  | ✅ |  |
| release:view | ✅ | ✅ | ✅ | ✅ |  |
| release:deploy | ✅ |  |  | ✅ |  |
| audit:view | ✅ |  | ✅ |  |  |

## 重要提示

- `user:edit` 与 `role:edit` 不同：`user:edit` 代表"编辑用户信息（包含角色）"，`role:edit` 代表"编辑角色定义/显式调整角色"。
- 当判断前端按钮/后端接口权限时，以"最小必要权限"为准：
  - 修改用户角色需要 `role:edit`；
  - 修改用户基本信息只需 `user:edit`。
- 后端中间件位于 `apps/api/src/middleware/rbac.ts`，使用 `requirePermission(code)`。
- 前端权限工具位于 `apps/web-admin/src/lib/session.ts`，`can(code)` 返回布尔值。
