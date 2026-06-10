# Trae 企业级能力演示流程

> 总时长：8-10 分钟 | 场景数：4 | 递进路线：单层修复 -> 跨层联动 -> 状态机+测试 -> 规范审查

---

## 场景一：知识库驱动的权限修复（约 2 分钟）

### 场景名称
RBAC 矩阵驱动的单层权限缺口修复

### 演示目标
展示 Trae 主动读取项目知识库（`rbac-matrix.md`），基于知识库中的权限矩阵定义，识别并修复后端接口的权限码错误。

### 操作步骤

**用户输入：**
> 阅读 knowledge-base/rbac-matrix.md 和 apps/api/src/routes/users.ts，检查 PUT /api/users/:id/roles 接口当前使用的权限码是否符合矩阵要求。如果不符合，修复它。

**用户不做什么：**
- 不告诉 Trae 具体哪个权限码错了
- 不告诉 Trae 应该改成什么
- 不告诉 Trae 改哪个文件的哪一行

### 预期 Trae 行为

1. 先读取 `knowledge-base/rbac-matrix.md`，定位到角色管理行，发现修改用户角色需要 `role:edit` 权限
2. 再读取 `apps/api/src/routes/users.ts`，发现当前中间件用的是 `requirePermission("user:edit")`
3. 在回答中明确引用 `rbac-matrix.md` 的矩阵定义
4. 将中间件从 `user:edit` 改为 `role:edit`
5. 运行 `pnpm typecheck` 和 `pnpm test` 验证

### 演示时长
约 2 分钟

### 对应验证清单
[1.1 引用 RBAC 矩阵做权限决策](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/verification/trae-enterprise-checklist.md#L14-L31)

---

## 场景二：前后端权限联动修复（约 3 分钟）

### 场景名称
跨层权限同步 —— 按钮可见性与后端拦截一致性修复

### 演示目标
展示 Trae 能同时理解前端权限展示逻辑和后端权限中间件，在一次对话中完成跨层修复，确保"按钮看不到 = 接口调不通"。

### 操作步骤

**用户输入：**
> 让 tenant_admin 不能修改其他用户的角色，后端接口和前端按钮都要同步。修复后补一条 API 测试验证 tenant_admin 调用该接口返回 403。

**用户不做什么：**
- 不告诉 Trae 前端按钮在哪个文件
- 不告诉 Trae 前端用什么权限判断函数
- 不告诉 Trae 测试文件放哪里

### 预期 Trae 行为

1. 读取 `apps/api/src/routes/users.ts`，确认后端中间件（已在场景一中修复为 `role:edit`）
2. 读取 `apps/web-admin/src/pages/UsersPage.tsx`，找到角色编辑按钮的显示条件
3. 将前端按钮的 `can("user:edit")` 改为 `can("role:edit")`
4. 在 `tests/api/` 下新增测试用例：以 `tenant_admin` 身份（`x-user-role: tenant_admin`）调用 `PUT /api/users/:id/roles`，断言返回 403
5. 解释修改前后的差异：tenant_admin 有 `user:edit` 但无 `role:edit`，修改后按钮隐藏且接口拒绝
6. 运行 `pnpm typecheck` 和 `pnpm test` 验证

### 演示时长
约 3 分钟

### 对应验证清单
[2.1 权限同步修复](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/verification/trae-enterprise-checklist.md#L56-L75)

---

## 场景三：状态机修复 + 已知缺陷测试修正（约 3 分钟）

### 场景名称
审批状态机防御 + 测试用例同步修复

### 演示目标
展示 Trae 能识别业务逻辑中的状态机缺陷（重复审批未拦截），修复服务层代码，同时定位并修正测试文件中标记为 "known issue" 的错误断言。

### 操作步骤

**用户输入：**
> 阅读 apps/api/src/services/approval-service.ts，确认 approveApproval 和 rejectApproval 是否允许对同一审批重复调用。如果允许，加入 pending 状态判断，重复调用返回 409。同时修复 tests/api/basic.test.ts 中标记为 known issue 的"允许重复审批"测试用例。

**用户不做什么：**
- 不告诉 Trae 具体加什么判断逻辑
- 不告诉 Trae 返回什么 HTTP 状态码
- 不告诉 Trae 测试用例在文件的哪一行

### 预期 Trae 行为

1. 读取 `apps/api/src/services/approval-service.ts`，定位 `approveApproval` 和 `rejectApproval` 函数
2. 在函数开头加入状态检查：`if (approval.status !== "pending") throw new ConflictError("审批已处理，不可重复操作")`
3. 读取 `tests/api/basic.test.ts`，找到标记为 known issue 的"允许重复审批"用例
4. 将断言从期望 200 改为期望 409
5. 运行 `pnpm typecheck` 和 `pnpm test` 验证

### 演示时长
约 3 分钟

### 对应验证清单
[2.2 跨层状态一致性修复](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/verification/trae-enterprise-checklist.md#L77-L94) + [4.2 修复现有测试中不稳定断言](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/verification/trae-enterprise-checklist.md#L137-L149)

---

## 场景四：基于工程/安全规范的代码审查（约 2 分钟）

### 场景名称
多规范引用的结构化代码审查

### 演示目标
展示 Trae 能同时引用 `.trae/rules/engineering.md` 和 `.trae/rules/security.md`，对一段跨前后端的假设性变更给出结构化评审意见，覆盖类型同步、权限评估、隐私保护三个维度。

### 操作步骤

**用户输入：**
> 假设我要做一个改动：在 POST /api/users 返回中加入 passwordHash 字段，并在前端用户列表中展示"最后登录时间"。基于 .trae/rules/engineering.md 与 .trae/rules/security.md 给出代码评审意见。

**用户不做什么：**
- 不告诉 Trae 哪些规范条款适用
- 不告诉 Trae 评审应该包含几个维度

### 预期 Trae 行为

1. 读取 `.trae/rules/engineering.md`，引用"新增响应字段需同步更新 shared 类型"的规范
2. 读取 `.trae/rules/security.md`，引用"不得在响应中暴露密码哈希等敏感信息"的安全条款
3. 输出结构化评审意见，至少包含：
   - 类型同步：`passwordHash` 和 `lastLoginTime` 需在 `packages/shared/src/types.ts` 的 `User` 类型中新增
   - 安全风险：`passwordHash` 绝不应出现在 API 响应中，属于严重安全漏洞
   - 权限评估：展示"最后登录时间"是否需要新增权限码（如 `user:read_sensitive`）
4. 不实际修改代码，仅输出评审意见

### 演示时长
约 2 分钟

### 对应验证清单
[6.1 代码审查是否引用工程/安全规范](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/verification/trae-enterprise-checklist.md#L189-L205)

---

## 演示节奏总览

| 顺序 | 场景 | 时长 | 难度 | 核心能力 |
|------|------|------|------|----------|
| 1 | RBAC 矩阵驱动权限修复 | 2 min | 简单 | 知识库理解 |
| 2 | 前后端权限联动修复 | 3 min | 中等 | 跨层联动 |
| 3 | 状态机修复 + 测试修正 | 3 min | 较难 | 业务逻辑 + 测试 |
| 4 | 工程/安全规范代码审查 | 2 min | 中等 | 规范遵循 |

### 递进逻辑

1. **场景一**（单层）：只改后端一个文件，验证 Trae 能否主动读知识库
2. **场景二**（跨层）：同时改前端 + 后端 + 测试，验证 Trae 能否理解全栈上下文
3. **场景三**（业务深度）：涉及状态机逻辑 + 已知缺陷测试修正，验证 Trae 能否处理复杂业务规则
4. **场景四**（规范审查）：不写代码，纯评审，验证 Trae 能否综合多份规范给出专业意见

### 演示技巧

- 每个场景结束后，口头总结 Trae 引用了哪些文档、修改了哪些文件
- 场景二和场景三之间可以自然过渡："刚才修了权限，现在看看另一个经典的企业级问题——状态机"
- 场景四作为收尾，展示 Trae 不仅能写代码，还能做代码审查，体现"企业级助手"的完整能力
- 全程无需用户具备项目上下文，所有提示词已预写在操作步骤中
