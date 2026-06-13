# Trae 企业级能力演示 — My Showcase

> 面向项目经理和产品经理，展示 Trae 在真实企业项目中的 5 项核心 AI 编码能力。
> 项目：Nexus 客户运营管理台（30,000 行代码，20 个页面，340 个测试用例）

---

## 演示准备

| 项目 | 说明 |
|------|------|
| 项目路径 | `/Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo` |
| 启动命令 | `pnpm dev:api` + `pnpm dev:web`，访问 `http://localhost:5173` |
| 测试命令 | `pnpm test` |
| 类型检查 | `pnpm typecheck` |

---

## 场景 1：项目理解能力

### 演示目标

展示 Trae 作为资深架构师，扫描全量项目代码后，自动生成一套结构完整、内容准确的工程文档，覆盖架构、接口、数据模型、编码规范等维度。

### 初始状态

- 项目根目录下 `docs/` 目录已删除（或为空）
- Git 标签 `showcase1-项目理解前` 已存在，指向删除 docs 前的提交（`git tag -l "showcase1-*"` 验证通过）

### 操作步骤

1. 执行 `git checkout showcase1-项目理解前`，切换到初始状态
2. 删除 `docs/` 目录：`rm -rf docs/`
3. 在 Trae 中输入以下提示词（来自项目 README.md 第 1-48 行）：

```
# 角色
你是一名资深架构师 + 技术文档工程师。我即将在这个存量项目上开展 AI Coding（用 AI 辅助大规模改造/开发）。在写任何业务代码之前，请你先彻底理解现有代码库，并生成一套让 AI 后续能够"读懂、对齐、安全改动"的必备文档。

# 工作流程（严格按顺序执行，不要跳步）
1. 全量扫描项目：目录结构、技术栈、依赖、构建/启动脚本、配置文件、入口文件、核心模块、数据库 schema、对外接口。
2. 推断而非臆测：能从代码/配置中读出来的事实直接落到文档；读不出来的标注 "❓待确认"，并集中列在每篇文档末尾，不要编造。
3. 按下方清单逐个生成文档，全部输出为 Markdown，统一放到项目根目录的 docs/ 文件夹下。
4. 全部生成后，给我一份"文档清单 + 待确认问题汇总"。

# 必须生成的文档清单
1. project_overview.md（项目总览）
2. architecture.md（架构说明，含 Mermaid 架构图）
3. directory_structure.md（目录结构说明）
4. coding_standards.md（编码规范）
5. api_reference.md（接口文档）
6. data_model.md（数据模型，含 Mermaid ER 图）
7. setup_and_run.md（环境搭建与运行）
8. ai_coding_guide.md（AI 编码协作指南，最关键）
9. glossary.md（术语与上下文词典）

# 输出要求
1. 每篇文档独立成文、自包含，不要互相用"见上文"指代。
2. 架构图、ER 图、流程图一律用 Mermaid 语法。
3. 事实与推断分开：不确定的内容必须标 "❓待确认"，禁止编造。
4. 中文撰写，代码标识符保持原文。
```

### 预期 Trae 行为

1. 自动扫描项目全量文件：`apps/api/`、`apps/web-admin/`、`packages/shared/`、`tests/`、配置文件等
2. 读取 `package.json`、`tsconfig.json`、`pnpm-workspace.yaml` 等识别技术栈（Express + React + Vite + pnpm monorepo）
3. 读取 `store.ts` 理解数据模型，读取 `routes/` 下所有路由文件提取 API 接口
4. 按清单逐个生成 9 篇 Markdown 文档，放入 `docs/` 目录
5. 输出"文档清单 + 待确认问题汇总"

### 验证方式

| 验证项 | 预期结果 |
|--------|----------|
| `docs/` 目录存在 | 包含 9 个 .md 文件 |
| `docs/project_overview.md` | 包含项目定位、核心功能模块、技术栈与版本 |
| `docs/architecture.md` | 包含 Mermaid 架构图、分层结构、核心数据流 |
| `docs/directory_structure.md` | 逐目录说明用途，标注核心业务 vs 工具/生成物 |
| `docs/coding_standards.md` | 从现有代码提炼的命名约定、代码风格、错误处理模式 |
| `docs/api_reference.md` | 所有接口的路径、方法、入参、出参、鉴权方式 |
| `docs/data_model.md` | 实体定义、字段含义、Mermaid ER 图 |
| `docs/setup_and_run.md` | 依赖安装、环境变量、本地启动/构建/测试命令 |
| `docs/ai_coding_guide.md` | 改动红线、推荐改动范围、常见任务标准做法、已知坑点 |
| `docs/glossary.md` | 业务术语、技术术语、内部缩写统一解释 |
| 文档总数 | 恰好 9 篇 |

---

## 场景 2：测试用例补全

### 演示目标

展示 Trae 能识别测试文件中缺失的测试用例，通过读取路由文件、服务文件和 RBAC 矩阵，自动补全与原有风格一致的测试用例。

### 初始状态

已从 10 个测试文件中随机删除 15 个 `it()` 测试用例（已提交到 git，commit: `c7ae499`）：

| 文件 | 删除数量 |
|------|----------|
| `tests/api/basic.test.ts` | 2 |
| `tests/api/features.test.ts` | 2 |
| `tests/api/integrations.test.ts` | 1 |
| `tests/api/invoices.test.ts` | 2 |
| `tests/api/metrics.test.ts` | 1 |
| `tests/api/notifications.test.ts` | 2 |
| `tests/api/roles.test.ts` | 1 |
| `tests/api/subscriptions.test.ts` | 1 |
| `tests/api/teams.test.ts` | 1 |
| `tests/api/tickets.test.ts` | 1 |
| `tests/api/tokens.test.ts` | 1 |

删除后剩余 340 个测试用例，`pnpm test` 全部通过。

### 操作步骤

1. 确认当前测试文件中已删除 15 个测试用例（共 340 个）
2. 在 Trae 中输入提示词（见 [show_case_prompt.md](show_case_prompt.md#场景-2测试用例补全)）

### 预期 Trae 行为

1. 读取 `tests/api/` 下所有测试文件，分析现有测试结构和风格
2. 读取对应的路由文件和服务文件，发现缺失的测试场景
3. 读取 `packages/shared/src/rbac.ts`，确认权限矩阵
4. 补全 15 个缺失的测试用例，风格与现有测试一致（使用 `beforeEach(() => resetStore())`、`supertest`、`x-user-id` header）

### 验证方式

| 验证项 | 预期结果 |
|--------|----------|
| 测试用例总数恢复 | 从 340 恢复到 355 |
| 测试风格一致性 | 使用 `beforeEach(() => resetStore())`、`supertest`、`x-user-id` header |
| `pnpm test` 通过 | 所有 355 个测试用例全部通过 |

### 演示后操作

执行 `git revert c7ae499` 回退代码到演示前状态。

---

## 场景 3：一键执行所有 API 测试用例

### 演示目标

展示 Trae 能一键执行项目中所有 12 个 API 测试文件，自动收集输出并汇总每个文件的 PASS/FAIL 结果。

### 初始状态

项目 `tests/api/` 目录下包含 12 个测试文件：

| 序号 | 测试文件 | 说明 |
|------|----------|------|
| 1 | `basic.test.ts` | 基础功能测试（健康检查、会话、RBAC、审批、发布、审计等） |
| 2 | `invoices.test.ts` | 发票模块测试 |
| 3 | `webhooks.test.ts` | Webhook 模块测试 |
| 4 | `notifications.test.ts` | 通知模块测试 |
| 5 | `tokens.test.ts` | API Token 模块测试 |
| 6 | `teams.test.ts` | 团队模块测试 |
| 7 | `features.test.ts` | 功能开关模块测试 |
| 8 | `tickets.test.ts` | 工单模块测试 |
| 9 | `subscriptions.test.ts` | 订阅模块测试 |
| 10 | `roles.test.ts` | 角色模块测试 |
| 11 | `integrations.test.ts` | 集成模块测试 |
| 12 | `metrics.test.ts` | 指标模块测试 |

### 操作步骤

在 Trae 中输入提示词（见 [show_case_prompt.md](show_case_prompt.md#场景-3一键执行所有-api-测试用例)）

### 预期 Trae 行为

1. 自动执行 `pnpm test` 命令
2. 收集 vitest 输出的完整测试结果
3. 解析每个测试文件的通过/失败数量和具体失败的用例名称
4. 输出汇总表格，包含：
   - 每个测试文件的名称
   - 通过的测试用例数量
   - 失败的测试用例数量
   - 失败用例的具体名称（如有）

### 验证方式

| 验证项 | 预期结果 |
|--------|----------|
| 测试执行 | `pnpm test` 成功运行 |
| 汇总表包含 12 个文件 | 每个文件有独立的 PASS/FAIL 统计 |
| 失败用例明细 | 如有失败，列出具体用例名称和所属文件 |
| 汇总格式 | 表格形式，清晰可读 |

---

## 场景 4：单页面深度黑盒测试

### 演示目标

展示 Trae 的浏览器自动化能力——对审批中心页面进行深度黑盒测试，覆盖统计卡片、Tab 切换、搜索、发起审批、通过/拒绝、详情 Modal 等全部功能点，每次操作后自动截图。

### 初始状态

- 项目已启动（`pnpm dev:api` + `pnpm dev:web`）
- 浏览器可访问 `http://localhost:5173`
- 目标页面：审批中心 `/approvals`（`ApprovalsPage.tsx`，473 行）

### 页面功能清单

| 功能区域 | 说明 |
|----------|------|
| Tab 切换 + 计数 | 全部 / 待审批 / 已通过 / 已拒绝（4 个 Tab，计数嵌入 Tab 按钮） |
| 发起审批表单 | 输入标题 + 点击"发起"按钮 |
| 搜索框 | 按标题或 ID 搜索审批，支持清除按钮 |
| 审批列表表格 | 显示 ID、标题、客户、状态、申请人、决定人、时间、操作 |
| 通过/拒绝按钮 | 对 pending 状态的审批显示（需 `approval:approve` 权限） |
| 审批详情 Modal | 点击 ID 或标题打开，含请求内容、审批链、时间线 |

### 操作步骤

在 Trae 中输入提示词（见 [show_case_prompt.md](show_case_prompt.md#场景-4单页面深度黑盒测试)）

### 预期 Trae 行为

1. 启动 browser_use agent，打开浏览器访问审批中心页面
2. 逐步执行 12 个操作，每个操作后等待 2 秒并截图
3. 自动识别页面元素（Tab、搜索框、按钮、表格行、Modal）
4. 输出 12 张截图，每张附带操作说明

### 验证方式

| 验证项 | 预期结果 |
|--------|----------|
| 截图数量 | 恰好 12 张 |
| 截图 1 | 审批中心页面完整渲染，含发起审批表单、搜索框、Tab 按钮（含计数）、审批列表 |
| 截图 2 | Tab 切换到"待审批"，列表仅显示 pending 状态审批 |
| 截图 3 | Tab 切换到"已通过"，列表仅显示 approved 状态审批 |
| 截图 4 | Tab 切换到"已拒绝"，列表仅显示 rejected 状态审批 |
| 截图 5 | Tab 切回"全部"，列表显示所有审批 |
| 截图 6 | 搜索框有输入内容，列表过滤为匹配结果 |
| 截图 7 | 搜索框已清空，列表恢复全部显示 |
| 截图 8 | 审批详情 Modal 已打开，显示请求内容、审批链、时间线 |
| 截图 9 | Modal 已关闭，回到列表页 |
| 截图 10 | 发起审批成功，列表新增一条审批记录 |
| 截图 11 | 某条审批状态变为"已通过" |
| 截图 12 | 某条审批状态变为"已拒绝" |
| 功能覆盖 | 12 张截图覆盖全部 6 个功能区域 |

---

## 场景 5：根据截图修复BUG

### 演示目标

展示 Trae 仅凭一张错误截图（无文字描述、无复现步骤），自动定位问题根因、完成前后端双层修复，且该 Bug 无法被现有测试用例检测到。

### Bug 描述

**截图内容**：角色管理页面，点击系统角色（如"平台管理员"）的"编辑"按钮，弹出编辑弹窗，修改内容后点击"保存"，页面弹出错误提示：

```
{
  "error": "系统角色不可编辑",
  "errorCode": "INTERNAL_ERROR",
  "statusCode": 403
}
```

**为什么测试用例检测不到**：

`tests/api/roles.test.ts` 中的测试用例 `should return 403 when updating a system role` 仅校验 HTTP 状态码：

```typescript
expect(res.status).toBe(403);
```

它不检查响应体中的 `errorCode` 字段。无论 `errorCode` 是 `"INTERNAL_ERROR"` 还是 `"RBAC_FORBIDDEN"`，测试都会通过。因此该 Bug 在 CI 中不会被发现。

### 根因分析

**后端**：[role-service.ts](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/apps/api/src/services/role-service.ts) 使用 `throw Object.assign(new Error("系统角色不可编辑"), { statusCode: 403 })` 抛出错误。`Object.assign` 生成的 Error 对象不是 `AppError` 实例，`error-handler` 中的 `formatErrorResponse()` 无法识别，走默认分支返回 `errorCode: "INTERNAL_ERROR"`。

**前端**：[RolesPage.tsx](file:///Users/bytedance/Documents/trae_projects/trae_demo/trae-enterprise-validation-demo/apps/web-admin/src/pages/RolesPage.tsx) 对系统角色没有做任何前端防御——按钮显示"编辑"而非"查看"，弹窗内所有输入框和权限复选框均可操作，"保存"按钮可点击，直到请求到达后端才返回 403。

### 操作步骤

1. 在 Trae 中粘贴错误截图（仅截图，无其他信息）
2. Trae 自动：
   - 读取截图中的错误信息（`errorCode: "INTERNAL_ERROR"`、`statusCode: 403`）
   - 搜索 `role-service.ts` 定位错误抛出位置
   - 搜索 `RolesPage.tsx` 定位前端交互逻辑
   - 读取 `errors.ts` 和 `error-handler.ts` 理解错误处理链路
   - 识别根因：`Object.assign` 产生的 Error 不是 `AppError` 实例
   - 读取 `guid.md` 中的系统角色规则（"系统角色不应该显示可编辑"）

### 修复内容

#### 后端修复（commit: `526e6d8`）

| 文件 | 改动 |
|------|------|
| `apps/api/src/services/role-service.ts` | 引入 `NotFoundError`、`ForbiddenError`、`ConflictError`，替换全部 5 处 `throw Object.assign(new Error(...), { statusCode: NNN })` |

修复后 curl 验证：

```
# 修复前
{"error":"系统角色不可编辑","errorCode":"INTERNAL_ERROR","statusCode":403}

# 修复后
{"error":"系统角色不可编辑","errorCode":"RBAC_FORBIDDEN","details":{"id":"role-3","type":"system"}}
```

#### 前端修复（commit: `1e8346b`）

| 改动点 | 说明 |
|--------|------|
| 卡片按钮 | 系统角色按钮文字从"编辑"改为"查看" |
| Modal 标题 | 系统角色弹窗标题从"编辑角色"改为"查看角色" |
| Alert 提示 | 弹窗顶部新增 `系统角色为平台内置角色，不可编辑或删除。` |
| 输入框 | 角色名称、角色描述 `disabled={showEdit?.type === "system"}` |
| 权限复选框 | 分组复选框、单项复选框全部 `disabled={isSystem}` |
| 保存按钮 | `disabled={showEdit?.type === "system"}` |
| handleEdit | 增加 `showEdit.type === "system"` 时本地快速失败，不发起请求 |

### 验证方式

| 验证项 | 预期结果 |
|--------|----------|
| 后端 403 响应 errorCode | `RBAC_FORBIDDEN`（非 `INTERNAL_ERROR`） |
| 后端 404 响应 errorCode | `NOT_FOUND_ROLE`（非 `INTERNAL_ERROR`） |
| 后端 409 响应 errorCode | `CONFLICT_ROLE_NAME_EXISTS`（非 `INTERNAL_ERROR`） |
| 前端系统角色按钮 | 显示"查看"而非"编辑" |
| 前端系统角色弹窗 | 标题"查看角色"，所有输入 disabled，保存按钮 disabled |
| 前端自定义角色 | 编辑、克隆、删除功能不受影响 |
| 现有测试用例 | 全部通过（测试仅校验 statusCode，不校验 errorCode） |

### 关键亮点

1. **仅凭截图定位**：Trae 从截图中提取 `errorCode: "INTERNAL_ERROR"` 和 `statusCode: 403`，反向搜索代码定位到 `role-service.ts` 的 `Object.assign` 抛错方式
2. **自动追溯错误处理链路**：读取 `errors.ts` → `error-handler.ts` → `role-service.ts`，发现 `Object.assign` 生成的 Error 不是 `AppError` 实例
3. **读取项目规范**：自动读取 `guid.md` 中的"系统角色不应该显示可编辑"规则，同步修复前端
4. **测试盲区覆盖**：该 Bug 的 `errorCode` 字段不在测试断言范围内，Trae 仍然完成了修复
