# 工程规范（Trae 项目规则）

本文件描述本仓库的工程规范，Trae 在执行代码修改与代码审查时应优先参考。

## 技术栈约束

- 后端：Node.js + Express + TypeScript，尽量使用 Zod 做请求校验
- 前端：React + TypeScript + Vite，轻量 UI，不引入 UI 库
- 共享：`packages/shared` 中定义前后端共用的类型与 RBAC 表
- 测试：Vitest（单元/API），Playwright（E2E）
- 工程：pnpm workspace

## 目录约定

- 新增后端接口：在 `apps/api/src/routes/*.ts` 注册，并在 `app.ts` 的路由列表中挂载
- 新增服务：放在 `apps/api/src/services/*.ts`，避免直接在路由中写业务逻辑
- 新增权限：先在 `packages/shared/src/types.ts` 的 `PermissionCode` 定义，再在 `packages/shared/src/rbac.ts` 的 `ROLE_PERMISSIONS` 中映射

## 权限与接口规范

- 每个需要登录的路由都应经过 `requirePermission(code)` 中间件
- 关键写操作需要使用 `audit(action)` 写入审计日志
- 响应字段必须与 `packages/shared/src/types.ts` 一致
- 参考 `knowledge-base/rbac-matrix.md` 与 `knowledge-base/api-contract.md`

## 命名风格

- 路径：小写 + 连字符（kebab-case）
- TypeScript 文件：驼峰（camelCase）或 PascalCase（根据语义）
- 常量权限码：字符串字面量，按 `domain:action` 风格

## 代码审查关注点

1. 权限是否到位（是否遗漏 `requirePermission`）
2. 是否写入审计日志，摘要是否可读
3. 响应字段是否与 shared 类型一致
4. 是否补了测试（至少覆盖权限不足 + 成功两条用例）
5. 前后端是否同步更新（字段漂移时尤其需要注意）
