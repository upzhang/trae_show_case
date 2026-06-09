# Trae 企业能力验证清单

本清单用于在 `trae-enterprise-validation-demo` 仓库内验证 Trae 的企业级研发能力。每项包含：

- 验证目标：希望观察到的行为
- 操作步骤：用户/助手如何触发
- 通过标准：交付物与结果信号
- 预期产物：Trae 应该产出的文件/代码片段

---

## 1. 知识库理解

### 1.1 引用 RBAC 矩阵做权限决策

**目标**：Trae 在修复权限问题时主动引用 `knowledge-base/rbac-matrix.md`，并据此决定需要哪些权限码。

**步骤**：

1. 打开 `apps/api/src/routes/users.ts`，查看 `PUT /api/users/:id/roles` 的权限中间件
2. 向 Trae 提问："这个接口应当使用哪个权限？请解释"
3. 观察 Trae 是否引用 `rbac-matrix.md` 中的 `role:edit` 说明

**通过标准**：

- Trae 直接在回答中引用 `rbac-matrix.md`
- Trae 建议把权限中间件从 `user:edit` 改为 `role:edit`

**预期产物**：

- 修改 `apps/api/src/routes/users.ts` 的权限代码片段

### 1.2 结合 API 契约与后端规范做接口修复

**目标**：Trae 能在"接口契约漂移"场景下，同时参考 `api-contract.md` 与 `backend-guidelines.md`，并决定删除非法字段或迁移到 shared 类型。

**步骤**：

1. 打开 `apps/api/src/services/release-service.ts`，发现 `ReleaseWithDescription` 的 `description` 字段
2. 让 Trae："修复 releases 接口与 shared 类型不一致的问题"

**通过标准**：

- Trae 在回答中明确指出 `packages/shared/src/types.ts` 的 `ReleaseRecord` 没有 `description`
- Trae 删除或迁移该字段，并同步修改路由层返回

**预期产物**：

- 修改 `apps/api/src/services/release-service.ts`
- 必要时修改 `packages/shared/src/types.ts`

---

## 2. 前后端联动

### 2.1 权限同步修复（按钮可见性 + 后端拦截）

**目标**：Trae 能同时修改前端按钮显示与后端权限中间件，解决"按钮看得到但权限判断实际过松"的问题。

**步骤**：

1. 阅读 `apps/web-admin/src/pages/UsersPage.tsx` 与 `apps/api/src/routes/users.ts`
2. 让 Trae："让 tenant_admin 不能修改其他用户的角色，并同步前端按钮"

**通过标准**：

- 后端接口改用 `requirePermission("role:edit")`
- 前端按钮显示条件改为 `can("role:edit")`
- Trae 解释修改前后的差异

**预期产物**：

- `apps/api/src/routes/users.ts` 改动
- `apps/web-admin/src/pages/UsersPage.tsx` 改动
- 可能新增一条 API 测试用例

### 2.2 跨层状态一致性修复

**目标**：Trae 能修复"重复审批未拦截"的状态机问题，并同步更新测试与 API 契约描述。

**步骤**：

1. 让 Trae："重复通过审批应返回错误，且响应字段与 shared 类型一致"

**通过标准**：

- `apps/api/src/services/approval-service.ts` 中加入 `status !== "pending"` 检查
- 若审批已通过，返回 409/400
- 同时补一条测试用例覆盖重复审批

**预期产物**：

- `apps/api/src/services/approval-service.ts` 改动
- `tests/api/basic.test.ts` 新增或修改用例

---

## 3. 权限与协作

### 3.1 基于 RBAC 矩阵的越权请求被拒绝

**目标**：Trae 能基于 `rbac-matrix.md` 设计并补一条越权场景的 API 测试。

**步骤**：

1. 让 Trae："补一条 `member` 用户尝试更新用户角色的 API 测试"

**通过标准**：

- 新增测试用位于 `tests/api/`
- 使用 `x-user-id` 模拟 member，请求返回 403

**预期产物**：

- `tests/api/` 新增用例文件或在现有文件中追加

---

## 4. 测试生成与修复

### 4.1 根据测试策略补 API 测试

**目标**：Trae 基于 `knowledge-base/testing-strategy.md` 为核心接口补齐权限/成功两条用例。

**步骤**：

1. 让 Trae："为 approvals 路由补齐权限用例与成功用例"

**通过标准**：

- 新增/更新的测试覆盖 `approval:approve` 权限不足 403 与成功通过两条

**预期产物**：

- `tests/api/` 新增用例

### 4.2 修复现有测试中不稳定断言

**目标**：Trae 能识别 `tests/api/basic.test.ts` 中"允许重复审批"这类标记为 known issue 的断言，并提议修复。

**步骤**：

1. 让 Trae："阅读 tests/api/basic.test.ts 并修复其中的 known issue"

**通过标准**：

- Trae 同时修改服务层与测试断言
- 测试可通过

---

## 5. CI/CD 理解与修复

### 5.1 识别并修复 CI 中不稳定 job

**目标**：Trae 能识别 `.github/workflows/ci.yml` 中的 `legacy-node-check` job 实际不可执行，并给出修复思路。

**步骤**：

1. 让 Trae："阅读 ci.yml，指出会失败的 job 与修复方式"

**通过标准**：

- Trae 指出 Node 18 直接执行 TS 源码无法通过
- 提供至少一种修复（先 `tsc` 编译、或改用 `tsx`、或移除该 job）

**预期产物**：

- `.github/workflows/ci.yml` 修改后的版本

### 5.2 CI 中启用 playwright E2E（可选）

**目标**：Trae 能为仓库的 E2E 提供可运行 CI job（包含 `pnpm install`、`playwright install`、启动 dev server 与 `pnpm test:e2e`）。

**步骤**：

1. 让 Trae："为 E2E 新增一个 CI job"

**通过标准**：

- `.github/workflows/ci.yml` 中出现独立的 e2e job
- 包含 playwright install
- 说明其与常规 build-and-test job 解耦

---

## 6. 规范遵循与代码审查

### 6.1 代码审查是否引用工程/安全规范

**目标**：在提交一段跨前后端变更时，Trae 能引用 `.trae/rules/engineering.md` 与 `.trae/rules/security.md` 给出评审意见。

**步骤**：

1. 让 Trae："评审以下变更：给 releases 接口新增一个 operatorName 字段，并在前端展示"

**通过标准**：

- Trae 提醒：新增字段需同步更新 `packages/shared/src/types.ts`
- Trae 提醒：字段信息来源不得暴露隐私（引用安全规范）

**预期产物**：

- 结构化评审意见（可包含伪代码）

### 6.2 审计日志摘要可读

**目标**：Trae 能识别 `apps/api/src/middleware/audit.ts` 的缺陷：`summary` 为空字符串，并给出可读的摘要模板。

**步骤**：

1. 让 Trae："审计日志的摘要都是空的，修复它"

**通过标准**：

- 为不同 action 提供对应的摘要模板
- 模板中包含动作、对象 ID、操作人等关键信息

**预期产物**：

- `apps/api/src/middleware/audit.ts` 修改
- 或在路由层改为调用 `recordAuditLog` 时补全摘要

---

## 参考

阅读以下文件以获得更多上下文：

- `knowledge-base/product-overview.md`
- `knowledge-base/rbac-matrix.md`
- `knowledge-base/api-contract.md`
- `knowledge-base/backend-guidelines.md`
- `knowledge-base/frontend-guidelines.md`
- `knowledge-base/testing-strategy.md`
- `knowledge-base/release-playbook.md`
- `knowledge-base/incident-handbook.md`
- `.trae/rules/engineering.md`
- `.trae/rules/testing.md`
- `.trae/rules/security.md`
