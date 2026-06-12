# AI_CODING_GUIDE — AI 编码协作指南

> 本文档是 AI 辅助编码的核心参考。在修改任何代码之前，AI 必须先阅读本文档。

## 改动红线（绝对不能动）

### 1. 共享类型包的结构
- `packages/shared/src/types.ts` 中的类型定义是前后端的契约基础
- **修改类型时必须同步更新前后端所有引用处**
- 新增字段用可选（`?`），不要删除已有字段（除非确认无引用）

### 2. RBAC 权限矩阵
- `packages/shared/src/rbac.ts` 中的 `ROLE_PERMISSIONS` 是权限判断的唯一真相源
- 修改权限映射时，必须同时检查：
  - 后端 `middleware/rbac.ts` 中的 `requirePermission()` 调用
  - 前端 `lib/session.ts` 中的 `can()` 调用
  - 前端页面中的按钮可见性逻辑

### 3. 中间件执行顺序
- `app.ts` 中的中间件注册顺序不可随意调整
- 顺序为：cors → json → requestLogger → resolveCurrentUser → rateLimit → 路由 → errorHandler
- `resolveCurrentUser` 必须在 `requirePermission` 之前

### 4. Repository 基类接口
- `store.ts` 中的 `Repository<T>` 基类是所有数据操作的底层抽象
- 修改基类会影响所有 24 个 Repository 子类
- 如需扩展，优先在子类中添加方法

## 推荐改动范围

### 安全改动（低风险）
- 新增路由文件（在 `routes/` 下创建新文件，在 `app.ts` 中注册）
- 新增服务文件（在 `services/` 下创建新文件）
- 新增前端页面（在 `pages/` 下创建，在 `App.tsx` 中添加路由）
- 新增 UI 组件（在 `components/` 下创建）
- 新增 Zod schema（在 `validators.ts` 中添加）
- 新增工具函数（在 `lib/utils.ts` 中添加）
- 修改种子数据（在 `data/seed.ts` 中调整）

### 需谨慎改动（中风险）
- 修改现有路由的权限要求
- 修改 Repository 子类的方法
- 修改前端 API 封装（`lib/api.ts`）
- 修改错误处理逻辑（`lib/errors.ts`）

### 高风险改动（需全面测试）
- 修改 `types.ts` 中的类型定义
- 修改 `rbac.ts` 中的权限矩阵
- 修改 `store.ts` 中的 Repository 基类
- 修改中间件执行顺序
- 修改 `app.ts` 中的路由注册

## 常见任务标准做法

### 新增 API 接口

1. 在 `packages/shared/src/types.ts` 中定义类型（如需要）
2. 在 `apps/api/src/services/` 下创建或扩展服务文件
3. 在 `apps/api/src/routes/` 下创建路由文件：
   ```typescript
   import { Router } from "express";
   import { requirePermission } from "../middleware/rbac";
   import { audit } from "../middleware/audit";

   const router = Router();

   router.get("/api/xxx", requirePermission("xxx:view"), (req, res) => {
     // 实现
   });

   export default router;
   ```
4. 在 `apps/api/src/app.ts` 中注册路由
5. 在 `tests/api/` 下添加测试

### 新增数据实体

1. 在 `types.ts` 中定义实体接口
2. 在 `store.ts` 中创建 Repository 子类（参考现有子类模式）
3. 在 `store.ts` 底部导出单例并加入 `resetStore()` 和 `store` 对象
4. 在 `data/seed.ts` 中生成种子数据（如需要）

### 新增前端页面

1. 在 `pages/` 下创建页面组件：
   ```tsx
   import { useEffect, useState } from "react";
   import { api } from "../lib/api";

   export default function XxxPage() {
     const [data, setData] = useState([]);
     useEffect(() => { api.get("/api/xxx").then(setData); }, []);
     return (/* JSX */);
   }
   ```
2. 在 `App.tsx` 中导入并添加 `<Route>`
3. 在侧边栏添加 `<NavLink>`

### 新增权限

1. 在 `types.ts` 的 `PermissionCode` 联合类型中添加新权限码
2. 在 `rbac.ts` 的 `ROLE_PERMISSIONS` 中为相应角色分配权限
3. 在 `rbac.ts` 的 `PERMISSION_DESCRIPTIONS` 中添加中文描述
4. 在 `rbac.ts` 的 `PERMISSION_GROUPS` 中归入合适的权限组

### 新增配置项

1. 如需环境变量：在 `server.ts` 中通过 `process.env` 读取
2. 如需功能开关：在 `store.ts` 的 `FeatureFlagRepository.seedFlags` 中添加

## 测试要求

### 必须测试
- 新增的 API 端点（在 `tests/api/` 下添加）
- 修改的权限逻辑（验证 200/401/403 状态码）
- 新增的数据校验（验证 400 错误响应）

### 测试模式
```typescript
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../apps/api/src/app";
import { resetStore } from "../../apps/api/src/store";

beforeEach(() => resetStore());

describe("新功能", () => {
  it("正常情况", async () => {
    const request = (await import("supertest")).default(app);
    const res = await request.get("/api/xxx").set("x-user-id", "u-platform");
    expect(res.status).toBe(200);
  });
});
```

### 验证方式
```bash
pnpm typecheck        # 类型检查必须通过
pnpm test             # 所有测试必须通过
pnpm dev:api          # 手动验证 API 响应
pnpm dev:web          # 手动验证前端页面
```

## 已知坑点与易错点

### 1. 权限码不一致
- 后端 `requirePermission("user:edit")` 控制的是 `PUT /api/users/:id/roles`
- 但按 RBAC 矩阵，角色编辑应该是 `role:edit` 而非 `user:edit`
- **新增权限校验时，确保权限码与操作语义匹配**

### 2. 审批状态机
- `approveApproval()` 和 `rejectApproval()` 不校验当前状态
- 已通过的审批可以被再次通过或驳回
- **修改审批逻辑时，应先检查当前状态是否为 "pending"**

### 3. 审计日志摘要
- `middleware/audit.ts` 中的 `audit()` 函数写入空 `summary: ""`
- **新增审计记录时，应写入有意义的摘要**

### 4. shared 类型与 API 返回不一致
- `ReleaseRecord` 的 `description` 字段在 shared types 中未定义，但 API 实际返回了该字段
- **修改 shared types 时，需确保与实际 API 返回一致**

### 5. 前端权限判断
- 前端 `can()` 函数基于 `localStorage` 中的角色做权限判断
- 如果后端 RBAC 矩阵变更，前端可能显示不该显示的操作按钮
- **修改 RBAC 矩阵后，检查前端对应页面的按钮可见性**

### 6. 数据重置
- 所有测试共享同一个 app 实例和 store
- 每个测试前必须 `resetStore()`，否则测试间数据会互相污染
- 新增测试务必在 `beforeEach` 中调用 `resetStore()`

### 7. TypeScript 严格模式
- 项目启用了 `strict: true`
- 所有函数参数和返回值必须有明确类型
- 避免使用 `any`，优先使用 `unknown` 或具体类型

### 8. Express 5 特性
- Express 5 中路由参数类型可能为 `string | string[]`
- 使用 `paramAsString()` 等工具函数安全获取参数值

## ❓待确认

- 是否有代码审查（Code Review）流程？
- 是否有分支管理策略（Git Flow / Trunk Based）？
- 新增功能是否需要先创建 PRD 或技术方案？
- 是否有性能基准测试要求？
