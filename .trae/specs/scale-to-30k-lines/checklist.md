# Nexus 客户运营管理台深化方案 - 验证清单

## 代码量验证
- [ ] 项目总源代码行数（排除 node_modules/dist/build/coverage/.git）达到 27,000—33,000 行
- [ ] TypeScript/TSX 代码占比 ≥ 70%（≥ 21,000 行）
- [ ] 单文件最大不超过 400 行（组件不超过 300 行）

## 功能模块完整性
- [ ] 后端新增至少 10 个路由模块：billing、notifications、webhooks、metrics、tokens、teams、integrations、features、roles、tickets
- [ ] 每个路由模块配套至少 1 个 service 文件
- [ ] 前端新增至少 10 个页面，与后端模块一一对应
- [ ] 所有页面能在前端侧边栏找到入口并正常渲染

## 架构分层
- [ ] packages/shared 包含：types.ts（≥1,000 行）、errors.ts、constants.ts、formatters.ts、rbac.ts
- [ ] apps/api/src/lib/ 包含：errors.ts、pagination.ts、validators.ts、cache.ts、tracing.ts、http.ts
- [ ] apps/api/src/middleware/ 包含：auth.ts、rbac.ts、audit.ts、error-handler.ts、rate-limit.ts、request-logger.ts、validate.ts
- [ ] apps/api/src/services/ 包含所有 17+ 实体的服务
- [ ] apps/api/src/routes/ 包含所有 17+ 实体的路由
- [ ] apps/web-admin/src/components/ 包含至少 15 个独立组件文件
- [ ] apps/web-admin/src/lib/ 包含：api.ts（SDK）、session.ts、hooks.ts、formatters.ts

## 数据完整性
- [ ] seed 数据覆盖所有模块，每个模块至少 5-20 条数据
- [ ] 用户数据 ≥ 50 条，分布在 7 个租户
- [ ] 审批数据 ≥ 50 条、发布数据 ≥ 30 条
- [ ] 工单数据 ≥ 30 条、评论 ≥ 50 条
- [ ] 通知数据 ≥ 50 条、活动流 ≥ 100 条
- [ ] 所有列表 API 能返回分页数据

## 测试体系
- [ ] tests/api/ 目录下至少 8 个测试文件
- [ ] 每个新模块至少有一个测试文件
- [ ] 测试覆盖正向 CRUD、权限拒绝（403）、参数校验失败（400）、资源不存在（404）
- [ ] tests/e2e/ 目录下至少 2 个 Playwright 测试文件
- [ ] packages/shared/src/ 至少有 rbac 和 formatters 测试
- [ ] 执行 `pnpm test` 全部通过

## 类型安全
- [ ] 执行 `pnpm typecheck` 无类型错误
- [ ] 前后端类型通过 `@trae/shared` 共享，不重复定义
- [ ] 不出现 `any` 类型（允许 `unknown` 和显式断言）

## 错误处理与响应格式
- [ ] 所有 API 错误响应格式统一为 `{ error, errorCode, details? }`
- [ ] 覆盖 HTTP 状态码：400/401/403/404/409/429/500
- [ ] 至少定义 50 个错误码
- [ ] 全局错误处理中间件能正确捕获 AppError

## 前端体验
- [ ] 所有页面使用公共组件（Button/Card/Table/Badge 等）
- [ ] 表格支持分页（每页 20 条）
- [ ] 加载状态和空状态有明确展示
- [ ] 危险操作有确认弹窗
- [ ] 权限不足的操作按钮隐藏或禁用

## 权限体系（含预置缺陷可验证）
- [ ] 新模块的权限检查遵循现有模式（保持一致的缺陷模式）
- [ ] 权限码总数 ≥ 30 个
- [ ] 5 个角色的权限矩阵完整定义
- [ ] 前端 can() 函数能正确判断权限

## 文档与知识库
- [ ] knowledge-base/ 新增 billing-module.md、webhook-module.md、api-token-guide.md、feature-flag-guide.md
- [ ] knowledge-base/api-contract.md 更新为覆盖所有新增接口
- [ ] verification/trae-enterprise-checklist.md 同步更新

## CI 与启动验证
- [ ] `pnpm dev:api` 能启动并监听 4100 端口
- [ ] `pnpm dev:web` 能启动并监听 5173 端口
- [ ] 根路由 `GET /api/health` 返回 200
- [ ] 前端首页加载不报错

---
*文档版本: v1.0 · 代码基线: commit 03b1f83*
