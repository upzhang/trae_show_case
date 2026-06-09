# API 契约

## 基础

- 基础路径：所有接口均以 `/api/...` 开头
- 当前用户：请求头 `x-user-id`（演示用途），例如 `u-platform`
- 内容类型：`application/json`

## 认证与会话

- `GET /api/session/me`：返回当前用户信息（id、name、email、roles、tenantId）
- `GET /api/users/by-email/:email`：根据邮箱查找用户

## 租户

- `GET /api/tenants`：返回当前用户可见的租户列表
- `GET /api/tenants/:id`：租户详情
- `PUT /api/tenants/:id/plan`：修改租户计划（需 `tenant:edit`）
  - body: `{ "plan": "standard" | "enterprise" }`

## 用户

- `GET /api/users`：用户列表（需 `user:view`）
- `GET /api/users/:id`：用户详情
- `POST /api/users`：创建用户（需 `user:edit`）
  - body: `{ "name": string, "email": string, "roles": string[] }`
- `PUT /api/users/:id/roles`：更新用户角色（需 `role:edit`）
  - body: `{ "roles": string[] }`

## 审批

- `GET /api/approvals`：审批列表（需 `approval:view`）
- `GET /api/approvals/:id`：审批详情
- `POST /api/approvals`：创建审批（需 `approval:view`）
  - body: `{ "title": string }`
- `PUT /api/approvals/:id/approve`：通过审批（需 `approval:approve`）
- `PUT /api/approvals/:id/reject`：拒绝审批（需 `approval:approve`）

## 发布记录

- `GET /api/releases`：发布记录列表（需 `release:view`）
- `GET /api/releases/:id`：详情
- `PUT /api/releases/:id/deploy`：发布（需 `release:deploy`）
- `PUT /api/releases/:id/rollback`：回滚（需 `release:deploy`）

## 审计日志

- `GET /api/audit-logs`：审计日志列表（需 `audit:view`）

## 返回结构

接口返回结构对应 `packages/shared/src/types.ts` 中定义：

- `Tenant`
- `User`
- `ApprovalRequest`
- `ReleaseRecord`
- `AuditLog`

若权限不足，返回 HTTP 403，内容：`{ "error": "missing permission xxx" }`。
