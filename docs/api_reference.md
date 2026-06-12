# API_REFERENCE — 接口文档

> 所有接口基于 Express 5，鉴权通过 `x-user-id` 请求头。

## 通用约定

### 鉴权方式
- 所有 `/api/*` 接口需要在请求头中携带 `x-user-id`，值为用户 ID（如 `u-platform`）
- 未携带或用户不存在时返回 401
- 权限不足时返回 403

### 通用响应格式
- 成功：直接返回数据对象或数组
- 错误：
  ```json
  { "error": "错误描述", "errorCode": "ERROR_CODE" }
  ```
- 分页：
  ```json
  {
    "data": [...],
    "meta": { "total": 100, "page": 1, "pageSize": 20, "totalPages": 5 }
  }
  ```

### 通用错误码
| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| AUTH_UNAUTHORIZED | 401 | 未授权 |
| RBAC_FORBIDDEN | 403 | 权限不足 |
| VALIDATION_ERROR | 400 | 参数校验失败 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 健康检查

### GET /health
- **权限**：无
- **响应**：`{ "status": "ok", "now": "2026-06-11T..." }`

---

## 会话

### GET /api/session/me
- **权限**：需 `x-user-id` 头
- **响应**：`SessionView` — `{ id, name, email, roles, tenantId }`
- **错误**：401（未提供 x-user-id）

---

## 租户

### GET /api/tenants
- **权限**：`tenant:view`
- **响应**：`Tenant[]`
- **说明**：非 platform_admin 用户仅返回自己租户的数据

### GET /api/tenants/:id
- **权限**：`tenant:view`
- **响应**：`Tenant`
- **错误**：404（租户不存在）

### PUT /api/tenants/:id/plan
- **权限**：`tenant:edit`
- **请求体**：`{ "plan": "standard" | "enterprise" }`
- **响应**：更新后的 `Tenant`
- **错误**：400（无效请求体）、404（租户不存在）

---

## 用户

### GET /api/users
- **权限**：`user:view`
- **响应**：`User[]`（按当前租户过滤）

### GET /api/users/:id
- **权限**：`user:view`
- **响应**：`User`
- **错误**：404

### POST /api/users
- **权限**：`user:edit`
- **请求体**：`{ "name": "string", "email": "string", "roles": ["member"] }`
- **响应**：201 + 创建的 `User`

### PUT /api/users/:id/roles
- **权限**：`user:edit`（⚠️ 预置缺陷 1：应为 `role:edit`）
- **请求体**：`{ "roles": ["member", "auditor"] }`
- **响应**：更新后的 `User`

### GET /api/users/by-email/:email
- **权限**：需 `x-user-id` 头
- **响应**：`SessionView` 或 `{ "error": "not found" }`

---

## 审批

### GET /api/approvals
- **权限**：`approval:view`
- **响应**：`ApprovalRequest[]`（按当前租户过滤）

### GET /api/approvals/:id
- **权限**：`approval:view`
- **响应**：`ApprovalRequest`

### POST /api/approvals
- **权限**：`approval:view`
- **请求体**：`{ "title": "string" }`
- **响应**：201 + 创建的 `ApprovalRequest`

### PUT /api/approvals/:id/approve
- **权限**：`approval:approve`
- **响应**：更新后的 `ApprovalRequest`（status = "approved"）
- ⚠️ 预置缺陷 3：不校验当前状态，可重复审批

### PUT /api/approvals/:id/reject
- **权限**：`approval:approve`
- **响应**：更新后的 `ApprovalRequest`（status = "rejected"）

---

## 发布

### GET /api/releases
- **权限**：`release:view`
- **响应**：`ReleaseRecord[]`（按当前租户过滤）

### GET /api/releases/:id
- **权限**：`release:view`
- **响应**：`ReleaseRecord`

### PUT /api/releases/:id/deploy
- **权限**：`release:deploy`
- **响应**：更新后的 `ReleaseRecord`（status = "deployed"）

### PUT /api/releases/:id/rollback
- **权限**：`release:deploy`
- **响应**：更新后的 `ReleaseRecord`（status = "rolled_back"）

---

## 审计日志

### GET /api/audit-logs
- **权限**：`audit:view`
- **响应**：`AuditLog[]`（按时间倒序）

---

## 风险工单

### GET /api/support-risks
- **权限**：`risk:read`
- **响应**：`SupportRisk[]`

---

## 活动事件

### GET /api/activity-events
- **权限**：`activity:read`
- **响应**：`ActivityEvent[]`

---

## Webhook

### GET /api/webhooks
- **权限**：`webhook:read`
- **响应**：`WebhookEndpoint[]`

### POST /api/webhooks
- **权限**：`webhook:manage`
- **请求体**：`{ "name": "string", "url": "https://...", "events": ["approvals.created"] }`
- **响应**：201 + 创建的 `WebhookEndpoint`

### PUT /api/webhooks/:id
- **权限**：`webhook:manage`
- **请求体**：部分更新字段
- **响应**：更新后的 `WebhookEndpoint`

### DELETE /api/webhooks/:id
- **权限**：`webhook:manage`
- **响应**：204

---

## API Token

### GET /api/tokens
- **权限**：`token:read`
- **响应**：`ApiToken[]`

### POST /api/tokens
- **权限**：`token:manage`
- **请求体**：`{ "name": "string", "scopes": ["read", "write"], "expiresAt?": "ISO日期" }`
- **响应**：201 + 创建的 `ApiToken`（含 token 值）

### DELETE /api/tokens/:id
- **权限**：`token:manage`
- **响应**：204

---

## 团队

### GET /api/teams
- **权限**：`team:read`
- **响应**：`Team[]`

### POST /api/teams
- **权限**：`team:create`
- **请求体**：`{ "name": "string", "description?": "string" }`
- **响应**：201 + 创建的 `Team`

### PUT /api/teams/:id
- **权限**：`team:manage`
- **响应**：更新后的 `Team`

### DELETE /api/teams/:id
- **权限**：`team:manage`
- **响应**：204

### POST /api/teams/:id/members
- **权限**：`team:manage`
- **请求体**：`{ "userId": "string", "role?": "string" }`
- **响应**：201 + `TeamMember`

### DELETE /api/teams/:id/members/:userId
- **权限**：`team:manage`
- **响应**：204

---

## 集成

### GET /api/integrations
- **权限**：`integration:read`
- **响应**：`Integration[]`

### POST /api/integrations
- **权限**：`integration:create`
- **请求体**：`{ "type": "slack", "name": "string", "config": {} }`
- **响应**：201 + 创建的 `Integration`

### PUT /api/integrations/:id
- **权限**：`integration:manage`
- **响应**：更新后的 `Integration`

### DELETE /api/integrations/:id
- **权限**：`integration:manage`
- **响应**：204

---

## 功能开关

### GET /api/features
- **权限**：`feature:read`
- **响应**：`FeatureFlag[]`

### POST /api/features
- **权限**：`feature:manage`
- **请求体**：`{ "key": "string", "name": "string", "type": "boolean", "defaultValue": true }`
- **响应**：201 + 创建的 `FeatureFlag`

### PUT /api/features/:key
- **权限**：`feature:manage`
- **响应**：更新后的 `FeatureFlag`

### DELETE /api/features/:key
- **权限**：`feature:manage`
- **响应**：204

---

## 工单

### GET /api/tickets
- **权限**：`ticket:view`
- **响应**：`Ticket[]`

### POST /api/tickets
- **权限**：`ticket:manage`
- **请求体**：`{ "title": "string", "description": "string", "priority": "high", "category?": "support" }`
- **响应**：201 + 创建的 `Ticket`

### PUT /api/tickets/:id
- **权限**：`ticket:edit`
- **响应**：更新后的 `Ticket`

### PUT /api/tickets/:id/status
- **权限**：`ticket:manage`
- **请求体**：`{ "status": "in_progress", "comment?": "string" }`
- **响应**：更新后的 `Ticket`

### GET /api/tickets/:id/conversations
- **权限**：`ticket:view`
- **响应**：`TicketConversation[]`

### POST /api/tickets/:id/conversations
- **权限**：`ticket:view`
- **请求体**：`{ "message": "string", "isInternal?": false }`
- **响应**：201 + `TicketConversation`

---

## 订阅

### GET /api/subscriptions
- **权限**：`subscription:read`
- **响应**：`Subscription[]`

---

## 发票

### GET /api/invoices
- **权限**：`invoice:read`
- **响应**：`Invoice[]`

---

## 通知

### GET /api/notifications
- **权限**：`notification:view`
- **响应**：`Notification[]`

### PUT /api/notifications/:id/read
- **权限**：`notification:view`
- **响应**：更新后的 `Notification`

### PUT /api/notifications/read-all
- **权限**：`notification:view`
- **响应**：`{ "success": true }`

### GET /api/notifications/preferences
- **权限**：`notification:view`
- **响应**：`NotificationPreference`

### PUT /api/notifications/preferences
- **权限**：`notification:manage`
- **请求体**：`{ "preferences": { "approval_request": true, ... } }`
- **响应**：更新后的 `NotificationPreference`

---

## 指标

### GET /api/metrics
- **权限**：`metric:view`
- **响应**：`PlatformMetrics`

---

## 角色

### GET /api/roles
- **权限**：`role:view`
- **响应**：`RoleDefinition[]`

### POST /api/roles
- **权限**：`role:edit`
- **请求体**：`{ "name": "string", "description?": "string", "permissions": ["ticket:view"] }`
- **响应**：201 + 创建的 `RoleDefinition`

### PUT /api/roles/:id
- **权限**：`role:edit`
- **响应**：更新后的 `RoleDefinition`

### DELETE /api/roles/:id
- **权限**：`role:delete`
- **响应**：204

---

## ❓待确认

- 是否有 OpenAPI/Swagger 规范文件？
- 分页接口的具体查询参数（page、pageSize、sortBy、sortOrder）是否在所有列表接口中统一支持？
- 是否有接口版本化计划？
