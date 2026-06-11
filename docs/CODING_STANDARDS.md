# CODING_STANDARDS — 编码规范

> 本文档从现有代码中提炼，目的是让 AI 写出的新代码与存量风格一致。

## 命名约定

### 文件命名
- **kebab-case**：所有文件和目录名使用短横线分隔，如 `error-handler.ts`、`request-logger.ts`、`approval-service.ts`
- 路由文件与对应服务文件命名一致：`routes/tenants.ts` ↔ `services/tenant-service.ts`
- 测试文件命名：`*.test.ts`（Vitest）或 `*.spec.ts`（Playwright）

### 变量与函数命名
- **camelCase**：变量、函数、方法名，如 `getCurrentUserId`、`listTenants`、`requirePermission`
- **PascalCase**：类、接口、类型、React 组件，如 `AppError`、`SimpleCache`、`TenantsPage`
- **UPPER_SNAKE_CASE**：常量，如 `DEFAULT_PAGE_SIZE`、`MAX_PAGE_SIZE`
- 布尔函数以 `is`/`has`/`can` 开头：`isAppError`、`hasPermission`、`can`
- 事件处理函数以 `handle` 或 `on` 开头（前端）：`switchUserByEmail`

### 类型命名
- 接口/类型以名词命名：`Tenant`、`User`、`ApprovalRequest`
- 枚举/联合类型以描述性名称命名：`RoleCode`、`PermissionCode`、`ErrorCode`
- 视图类型（前端专用）加 `View` 后缀：`SessionView`、`ApprovalView`、`TenantView`

## 代码风格

### TypeScript
- 严格模式：`tsconfig.base.json` 中 `strict: true`
- 模块系统：ESM（`"type": "module"`），使用 `import/export` 语法
- 路径别名：`@trae/shared` 映射到 `packages/shared/src`
- 类型导入使用 `import type`：`import type { RoleCode } from "@trae/shared"`
- 不使用 `any`，必要时用 `unknown` 或 `Record<string, unknown>`

### 模块组织
- 每个文件导出一个主要模块（Router、类、函数集）
- 导入顺序：第三方库 → 内部模块 → 类型导入
- 相对路径导入使用 `../` 而非绝对路径（除 `@trae/shared` 别名外）

### Express 路由模式
```typescript
import { Router } from "express";
const router = Router();

router.get("/api/resource", requirePermission("resource:view"), (req, res) => {
  // 处理逻辑
});

export default router;
```

### React 组件模式
- 函数组件，使用 `export default function ComponentName()`
- 页面组件放在 `pages/`，通用组件放在 `components/`
- 使用 React Router 的 `NavLink` 进行导航

## 注释规范

- 代码中关键位置有中文注释说明业务逻辑
- 预置缺陷用多行注释标注：`// 预置缺陷 N — 描述`
- 新增函数有 JSDoc 风格注释（中文）：
  ```typescript
  /**
   * 构建审批链：根据租户的角色结构生成多级审批步骤
   */
  ```

## 错误处理模式

### 后端错误体系
- 自定义错误类层次：`AppError` → `AuthError`、`ForbiddenError`、`ValidationError`、`NotFoundError`、`ConflictError`、`LimitError`、`RateLimitError`
- 工厂函数创建错误：`errorFactory.notFound.user(id)`、`errorFactory.validation.required("name")`
- 路由中直接 try-catch 或使用 `wrapAsync` 包装异步处理
- 全局错误处理中间件 `errorHandler` 统一格式化错误响应

### 错误响应格式
```json
{
  "error": "错误描述",
  "errorCode": "NOT_FOUND_USER",
  "details": { "id": "xxx" }
}
```

### 前端错误处理
- API 调用失败时检查 `"error" in res` 判断是否为错误响应
- 使用 `window.alert()` 显示简单错误提示

## 日志规范

- 使用 `tracing.ts` 中的 `Logger` 类，支持 traceId/requestId 关联
- 日志级别：`debug`、`info`、`warn`、`error`
- 请求日志自动记录：method、path、statusCode、duration、ip
- 日志输出为 JSON 格式到 console

## 校验规范

- 使用 Zod 定义 schema，集中在 `lib/validators.ts`
- 路由中使用 `z.object().safeParse(req.body)` 进行内联校验
- 中间件 `validateSchema()` 支持 params/query/body 分别校验
- 校验失败返回 400 + issues 数组

## 提交信息规范

❓待确认：当前仓库未见明确的 commit message 规范（如 Conventional Commits）。建议后续统一为：

```
<type>(<scope>): <描述>

类型：feat / fix / refactor / test / docs / chore
范围：api / web-admin / shared / config
```

## 测试规范

- 单元测试：Vitest，文件与源码同目录或 `tests/` 目录
- API 集成测试：Vitest + Supertest，在 `tests/api/` 目录
- E2E 测试：Playwright，在 `tests/e2e/` 目录
- 每个 describe 块测试一个模块/端点
- 使用 `beforeEach(() => resetStore())` 重置数据
- 测试命名：`it("应该xxx", async () => {})`

## ❓待确认

- 是否有正式的 commit message 规范？
- 前端是否有组件测试要求？
- 是否有代码覆盖率目标？
- 是否有 Prettier 格式化配置？
