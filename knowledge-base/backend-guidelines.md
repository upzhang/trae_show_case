# 后端开发规范

## 技术栈

- Node.js + Express
- TypeScript
- Zod（请求校验）

## 目录

- `apps/api/src/app.ts` — Express 应用装配
- `apps/api/src/server.ts` — 服务器启动入口
- `apps/api/src/routes/*.ts` — 路由层（解析请求、调用服务、返回响应）
- `apps/api/src/services/*.ts` — 业务服务
- `apps/api/src/middleware/*.ts` — 鉴权、RBAC、审计日志中间件
- `apps/api/src/data/seed.ts` — 内存种子数据
- `apps/api/src/store.ts` — 内存存储 + 重置工具

## 请求处理流程

1. `cors` → `json` → `resolveCurrentUser`（注入当前用户）
2. 路由匹配
3. 权限中间件 `requirePermission(code)`
4. 若为写操作，使用 `audit(action)` 记录日志
5. 业务服务返回对象后由路由层序列化为 JSON

## 权限与审计

- 使用 `requirePermission(code)` 进行强制校验
- 关键写操作必须使用 `audit(action)` 并传递人类可读摘要（非空字符串）
- 错误返回应包含 `{ "error": "xxx" }` 与合适 HTTP 状态码

## 数据一致性

- 避免在服务层直接写入未校验字段
- 审批状态机应校验：pending → approved/rejected，不可重复审批
- 用户角色修改需区分 `user:edit`（基本信息）与 `role:edit`（角色调整）

## 接口契约

- 新增或修改接口必须同步更新 `knowledge-base/api-contract.md`
- 响应字段必须与 `packages/shared/src/types.ts` 一致，不要擅自新增非共享字段
- 若需要新增响应字段，请先更新 shared 类型

## 测试约定

- 单元测试优先覆盖服务层与权限判断
- API 测试使用 Vitest + Supertest，位于项目根 `tests/api`
- 每个 API 至少覆盖"权限不足"与"成功"两类用例
