# 示例提示（Sample Prompts）

下面是一些可以直接交给 Trae 执行的任务，用于触发企业级能力验证。

## 任务 A：修复权限缺口 + 前后端同步

> 阅读 `knowledge-base/rbac-matrix.md` 与 `apps/api/src/routes/users.ts`，找出
> `PUT /api/users/:id/roles` 接口当前使用的权限码是否符合矩阵要求。
> 若不符合，修复后端中间件并同步修改 `apps/web-admin/src/pages/UsersPage.tsx` 的按钮展示条件。
> 为修复补一条 API 测试。

## 任务 B：修复审批状态机 + 补测试

> 阅读 `apps/api/src/services/approval-service.ts` 中的 `approveApproval`
> 与 `rejectApproval`，确认是否允许对同一审批重复调用。
> 如果允许，加入 pending 状态判断，让重复调用返回 HTTP 400/409。
> 修改测试 `tests/api/basic.test.ts` 中"允许重复审批"的已知缺陷用例。

## 任务 C：修复接口契约漂移

> 阅读 `apps/api/src/services/release-service.ts` 中的 `ReleaseWithDescription`
> 与 `packages/shared/src/types.ts` 中的 `ReleaseRecord`，
> 检查 releases 接口是否返回 `description` 字段。
> 若与 shared 类型不一致，按 `knowledge-base/api-contract.md` 与
> `knowledge-base/backend-guidelines.md` 的约定修复：要么更新 shared，
> 要么删除非约定字段。同步更新前端 `apps/web-admin/src/lib/api.ts` 的类型。

## 任务 D：审计日志摘要

> 检查 `apps/api/src/middleware/audit.ts` 与所有使用 `audit(action)` 的路由，
> 确认摘要是否为空。为每一种 action 提供可读的摘要模板（例如
> `"user u-xxx changed roles of user u-yyy to [...]"`），并在路由层注入摘要信息。
> 为修复补一条测试。

## 任务 E：CI 修复

> 阅读 `.github/workflows/ci.yml`，找出其中不稳定或会失败的 job。
> 给出修改方案并实现：
> 1. `legacy-node-check` 在 Node 18 下直接执行 TS 源码不可行
> 2. 可选：新增一个独立的 e2e job，包含 playwright 浏览器安装与启动前后端的步骤
> 修改或新增 job，并说明改动理由。

## 任务 F：基于知识库的代码审查

> 假设我要做一个改动：在 `POST /api/users` 返回中加入 `passwordHash` 字段，
> 并在前端用户列表中展示"最后登录时间"。
> 基于 `.trae/rules/engineering.md` 与 `.trae/rules/security.md` 给出代码评审意见，
> 指出：
> 1. 权限上是否需要新的权限码
> 2. 是否违反"不暴露隐私"的安全规范
> 3. 若添加响应字段，需要同步更新哪些 shared 类型
