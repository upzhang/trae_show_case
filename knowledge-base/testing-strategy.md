# 测试策略

## 分层

1. **共享层单元测试**（`packages/shared/src/**/*.test.ts`）：覆盖权限聚合与判断
2. **后端 API 测试**（`tests/api/**/*.test.ts`）：使用 Vitest + Supertest 覆盖接口
3. **前端组件测试**（`apps/web-admin/src/**/*.test.tsx`）：可选
4. **端到端测试**（`tests/e2e/*.spec.ts`）：使用 Playwright，覆盖主干链路

## 运行方式

- 全部：`pnpm test`
- 仅 API：`pnpm --filter api test`
- 仅共享包：`pnpm --filter shared test`
- E2E：`pnpm test:e2e`（需先启动 API 与前端开发服务器）

## 测试关注点

1. 权限边界：`requirePermission` 是否真正拦截越权请求
2. 状态一致性：重复审批、已回滚发布再次回滚
3. 请求校验：Zod schema 是否拒绝错误 body
4. 审计日志：写操作是否写入非空摘要
5. 接口契约：响应字段必须与 shared 类型一致

## 断言风格

- 使用 Vitest 默认 `expect(...)`
- API 测试中要同时断言 HTTP 状态码、返回字段类型与关键字段

## CI 约束

- CI 必须通过所有单元测试与 API 测试
- E2E 在 CI 环境如不稳定可标记 `test.skip` 或仅本地执行
