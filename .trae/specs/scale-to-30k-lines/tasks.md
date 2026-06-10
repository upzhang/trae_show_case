# Nexus 客户运营管理台深化方案 - 实施计划

## 整体增量目标
- 当前代码：~4,600 行
- 目标代码：~30,000 行（±10%）
- 增量：~25,000 行
- 策略：按 10 个任务块推进，每个块 2,000—3,000 行

---

## 任务块 0 — 基础设施（Infrastructure & Shared）
### [ ] Task 0.1: 扩展 shared 包类型系统
- **Priority**: P0
- **Depends On**: None
- **估算代码量**: 1,500 行（types.ts 从 200 行扩展到 1,200 行；新增 errors.ts、constants.ts、formatters.ts）
- **Description**:
  - 为 10 个新模块（billing/notifications/webhooks/metrics/tokens/teams/integrations/features/roles/tickets）定义完整的类型体系
  - 定义统一的 `AppError` 错误码系统（100+ 错误码，分类：AUTH/RBAC/VALIDATION/NOT_FOUND/CONFLICT/LIMIT/RATE/TENANT/INTEGRATION/FEATURE）
  - 定义统一的分页/过滤/排序请求/响应类型
  - 定义日期/货币/数字格式化工具函数
- **AC Addressed**: AC-2（类型基础）、AC-4（shared 包为架构基础）、AC-9（类型安全）
- **Test Requirements**:
  - `programmatic` TR-0.1.1: 所有新类型能通过 `tsc --noEmit` 编译
  - `programmatic` TR-0.1.2: 错误码枚举覆盖 ≥ 50 个场景
  - `programmatic` TR-0.1.3: 格式化函数覆盖 5+ 场景（日期/相对时间/货币/数字/百分比）

### [ ] Task 0.2: 扩展 shared 包的 RBAC 权限矩阵
- **Priority**: P0
- **Depends On**: Task 0.1
- **估算代码量**: 500 行
- **Description**:
  - 为 10 个新模块定义 permission codes（billing:view, billing:edit, notification:manage, webhook:manage, metrics:view, token:manage, team:manage, integration:manage, feature:manage, role:manage, ticket:create, ticket:update 等）
  - 为 5 个角色定义新的权限映射（platform_admin/tenant_admin/auditor/release_manager/member）
- **AC Addressed**: AC-7（权限体系保持一致的缺陷模式）
- **Test Requirements**:
  - `programmatic` TR-0.2.1: 新权限码 ≥ 25 个
  - `programmatic` TR-0.2.2: 权限矩阵测试用例覆盖全部 5 个角色

### [ ] Task 0.3: 后端工具库（lib/）
- **Priority**: P0
- **Depends On**: Task 0.1
- **估算代码量**: 1,500 行
- **Description**:
  - `errors.ts`: AppError 类（带 errorCode、message、httpStatus、details）、工厂函数、错误响应格式化中间件
  - `pagination.ts`: 分页参数解析、分页响应封装、默认每页 20 条
  - `validators.ts`: 通用 Zod schema（email/password/uuid/url/phone/currency/date 等 15+）
  - `cache.ts`: 带 TTL 的简单 Map 缓存、LRU 简化版
  - `tracing.ts`: 请求 ID 生成与传递
  - `http.ts`（已有）：扩展 paramAsString/paramAsNumber/queryAsList 等辅助函数
- **AC Addressed**: AC-4、AC-5
- **Test Requirements**:
  - `programmatic` TR-0.3.1: 每个工具函数有对应的测试用例
  - `programmatic` TR-0.3.2: 错误响应格式统一为 `{ error, errorCode, details }`

### [ ] Task 0.4: 增强中间件
- **Priority**: P0
- **Depends On**: Task 0.3
- **估算代码量**: 1,000 行
- **Description**:
  - `auth.ts`（已有）：保留，补充缺失的日志与 user 解析逻辑
  - `rbac.ts`（已有）：增强，支持权限码与角色的多层判断
  - `audit.ts`（已有）：增强，支持自定义摘要模板
  - `error-handler.ts`（新增）：全局错误处理中间件，捕获 AppError 并统一响应
  - `rate-limit.ts`（新增）：简单的 IP + user 级限流（每分钟最多 N 次）
  - `request-logger.ts`（新增）：结构化请求日志（method/path/status/duration/traceId）
  - `validate.ts`（新增）：Zod schema 校验中间件（自动解析 req.body/req.query/req.params）
- **AC Addressed**: AC-4、AC-5
- **Test Requirements**:
  - `programmatic` TR-0.4.1: error-handler 对各种错误码返回正确 HTTP 状态
  - `programmatic` TR-0.4.2: rate-limit 超出阈值时返回 429
  - `programmatic` TR-0.4.3: validate 中间件在 schema 不匹配时返回 400 + 具体 issues

---

## 任务块 1 — 数据层与服务层标准化
### [ ] Task 1.1: 重构 store.ts 为仓库模式
- **Priority**: P0
- **Depends On**: Task 0.1
- **估算代码量**: 800 行
- **Description**:
  - 从简单的全局 Map/数组改为模块化的 Repository 类
  - 每个实体有独立的 repository：TenantRepository/UserRepository/ApprovalRepository/ReleaseRepository/AuditLogRepository/SupportRiskRepository/ActivityEventRepository 以及新增的 BillingRepository/InvoiceRepository/NotificationRepository/WebhookRepository/MetricRepository/TokenRepository/TeamRepository/IntegrationRepository/FeatureFlagRepository/RoleDefinitionRepository/TicketRepository/TicketConversationRepository
  - 统一接口：`list(filter?, pagination?)` / `get(id)` / `create(data)` / `update(id, data)` / `delete(id)` / `count(filter?)`
- **AC Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1.1: 每个 repository 的 CRUD 都有简单测试
  - `programmatic` TR-1.1.2: 分页返回正确的 total/page/pageSize

### [ ] Task 1.2: 大规模扩展 seed 数据
- **Priority**: P0
- **Depends On**: Task 1.1
- **估算代码量**: 1,500 行
- **Description**:
  - 保持 7 个租户不变，但每个租户新增大量相关数据
  - 用户数据扩展到 50+（每个租户 5-10 人，含不同角色）
  - 审批 50+ 条、发布 30+ 条、审计日志 100+ 条
  - 风险工单 30+ 条、活动流 100+ 条
  - 新增模块的 seed：发票 20+、通知 50+、Webhook 10+、Token 10+、Team 10+、集成配置 8+、功能开关 15+、自定义角色 5+、工单 30+、工单评论 50+
- **AC Addressed**: AC-10
- **Test Requirements**:
  - `programmatic` TR-1.2.1: 启动后每个列表接口至少返回 5 条数据
  - `programmatic` TR-1.2.2: 数据字段完整性（无必填字段缺失）

---

## 任务块 2 — 新业务模块后端（5 个核心模块）
### [ ] Task 2.1: 计费与订阅（Billing）后端
- **Priority**: P0
- **Depends On**: Task 1.1
- **估算代码量**: 1,500 行
- **Description**:
  - `routes/billing.ts`: `/api/billing/subscriptions`（GET/PUT）、`/api/billing/invoices`（GET）、`/api/billing/invoices/:id`（GET）、`/api/billing/invoices/:id/download`（GET，返回 mock CSV）、`/api/billing/summary`（GET，MRR/ARR/增长/流失汇总）
  - `services/billing-service.ts`: 订阅状态流转（trial/active/past_due/canceled）、发票状态（draft/sent/paid/overdue/canceled）、续费日期计算
  - `services/invoice-service.ts`: 发票生成、PDF/CSV mock 生成、付款记录
- **AC Addressed**: FR-1、AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1.1: `/api/billing/summary` 返回正确的 MRR/ARR 计算
  - `programmatic` TR-2.1.2: 订阅状态变更接口正确更新并记录审计

### [ ] Task 2.2: 通知中心后端
- **Priority**: P0
- **Depends On**: Task 1.1
- **估算代码量**: 1,200 行
- **Description**:
  - `routes/notifications.ts`: `/api/notifications`（GET 列表，支持分页和未读过滤）、`/api/notifications/:id/read`（PUT 标记已读）、`/api/notifications/read-all`（PUT 批量已读）、`/api/notifications/preferences`（GET/PUT 通知偏好）
  - `services/notification-service.ts`: 生成通知、标记已读、按类型过滤、偏好管理
- **AC Addressed**: FR-2、AC-2
- **Test Requirements**:
  - `programmatic` TR-2.2.1: 已读标记后 GET 列表不再包含该未读通知
  - `programmatic` TR-2.2.2: 偏好设置持久化

### [ ] Task 2.3: Webhook 事件系统后端
- **Priority**: P0
- **Depends On**: Task 1.1
- **估算代码量**: 1,500 行
- **Description**:
  - `routes/webhooks.ts`: CRUD 接口 + `/api/webhooks/:id/logs`（调用日志）+ `/api/webhooks/:id/test`（测试调用）
  - `services/webhook-service.ts`: Webhook 签名算法（HMAC-SHA256 mock）、事件类型过滤、密钥轮转模拟、调用日志记录
  - 支持事件类型：`approvals.created`, `approvals.approved`, `approvals.rejected`, `releases.deployed`, `releases.rolled_back`, `tickets.created`, `tickets.updated`, `billing.invoice.paid`, `billing.invoice.overdue`, `user.created`, `tenant.updated`
- **AC Addressed**: FR-3、AC-2
- **Test Requirements**:
  - `programmatic` TR-2.3.1: 新建 Webhook 时生成 signing secret 并仅返回一次
  - `programmatic` TR-2.3.2: 测试调用能写入日志

### [ ] Task 2.4: API Token 管理后端
- **Priority**: P0
- **Depends On**: Task 1.1
- **估算代码量**: 1,200 行
- **Description**:
  - `routes/tokens.ts`: `/api/tokens`（GET 列表 / POST 创建）、`/api/tokens/:id`（DELETE 吊销）、`/api/tokens/:id/rotate`（POST 重新生成）
  - `services/token-service.ts`: Token 生成（JWT 格式 mock）、过期校验、权限 scope 校验、使用统计
  - Token 仅在创建时返回完整值
- **AC Addressed**: FR-5、AC-2
- **Test Requirements**:
  - `programmatic` TR-2.4.1: 创建 Token 时返回完整 token，后续 GET 不返回 token 字段
  - `programmatic` TR-2.4.2: DELETE 后 Token 状态为 revoked

### [ ] Task 2.5: 指标与分析后端
- **Priority**: P1
- **Depends On**: Task 1.1
- **估算代码量**: 1,200 行
- **Description**:
  - `routes/metrics.ts`: `/api/metrics/overview`（GET 平台总览指标）、`/api/metrics/tenants-trend`（GET 租户趋势 7/30/90 天）、`/api/metrics/releases`（GET 发布健康）、`/api/metrics/approvals`（GET 审批健康）、`/api/metrics/health-score-distribution`（GET 租户健康分分布）
  - `services/metric-service.ts`: 指标计算、时间序列数据生成（mock 历史数据）、健康分布统计
- **AC Addressed**: FR-4、AC-2
- **Test Requirements**:
  - `programmatic` TR-2.5.1: overview 返回 ≥ 8 个指标字段
  - `programmatic` TR-2.5.2: trend 接口返回按时间排序的数据点

---

## 任务块 3 — 新业务模块后端（5 个次要模块）
### [ ] Task 3.1: 团队与成员管理后端
- **Priority**: P1
- **Depends On**: Task 1.1
- **估算代码量**: 1,000 行
- **Description**:
  - `routes/teams.ts`: `/api/teams`（GET/POST）、`/api/teams/:id`（GET/PUT/DELETE）、`/api/teams/:id/members`（GET/POST/DELETE）
  - `services/team-service.ts`: 团队 CRUD、成员增删、团队级权限计算
- **AC Addressed**: FR-6、AC-2

### [ ] Task 3.2: 集成市场后端
- **Priority**: P1
- **Depends On**: Task 1.1
- **估算代码量**: 1,200 行
- **Description**:
  - `routes/integrations.ts`: `/api/integrations`（GET 可用集成列表）、`/api/integrations/:id`（GET 详情 / PUT 启用禁用 / DELETE 断开）、`/api/integrations/:id/config`（GET/PUT 配置）
  - `services/integration-service.ts`: 8+ 集成定义（Slack/Salesforce/Zendesk/Jira/GitHub/Stripe/Webhook/Custom）、配置 schema 定义、连接状态管理
- **AC Addressed**: FR-7、AC-2

### [ ] Task 3.3: 功能开关后端
- **Priority**: P1
- **Depends On**: Task 1.1
- **估算代码量**: 1,000 行
- **Description**:
  - `routes/features.ts`: `/api/features`（GET 列表）、`/api/features/:key`（GET/PUT）、`/api/features/:key/history`（GET 变更历史）
  - `services/feature-flag-service.ts`: 开关 CRUD、按租户覆盖值、默认值管理、变更审计记录、灰度比例计算
- **AC Addressed**: FR-8、AC-2

### [ ] Task 3.4: 自定义角色后端
- **Priority**: P1
- **Depends On**: Task 0.2、Task 1.1
- **估算代码量**: 800 行
- **Description**:
  - `routes/roles.ts`: `/api/roles`（GET 列表 / POST 新建）、`/api/roles/:id`（GET/PUT/DELETE）、`/api/roles/:id/clone`（POST 克隆）、`/api/permissions`（GET 所有权限码列表）
  - `services/role-service.ts`: 角色 CRUD、克隆、权限码分配、角色使用计数
- **AC Addressed**: FR-9、AC-2

### [ ] Task 3.5: 工单流转后端
- **Priority**: P1
- **Depends On**: Task 1.1
- **估算代码量**: 1,500 行
- **Description**:
  - `routes/tickets.ts`: `/api/tickets`（GET 列表 / POST 新建）、`/api/tickets/:id`（GET/PUT）、`/api/tickets/:id/status`（PUT 状态变更）、`/api/tickets/:id/comments`（GET/POST）
  - `services/ticket-service.ts`: 工单 CRUD、状态流转校验、指派人变更、标签管理、评论 CRUD
  - 状态机：新建 → 处理中 → 等待客户 → 已解决 → 已关闭（支持回退）
- **AC Addressed**: FR-10、AC-2

---

## 任务块 4 — 前端组件库
### [ ] Task 4.1: 基础组件（第一批次）
- **Priority**: P0
- **Depends On**: None
- **估算代码量**: 2,500 行
- **Description**:
  - `components/Button.tsx`: 变体（primary/secondary/danger/ghost/link）、尺寸（sm/md/lg）、禁用、加载、图标支持
  - `components/Card.tsx`: Card、CardHeader、CardBody、CardFooter 组合式组件
  - `components/Badge.tsx`: 支持多种状态色（success/warning/danger/info/default）+ severity 系列（critical/high/medium/low）
  - `components/Alert.tsx`: alert/info/success/warning/error 五种提示框
  - `components/EmptyState.tsx`: 空状态，带图标和操作按钮
  - `components/StatCard.tsx`: 指标卡片，支持数值 + 标签 + 趋势指示
  - `components/Tag.tsx`: 可关闭的标签组件
  - `components/Avatar.tsx`: 用户头像（用首字母生成颜色）
  - `components/PageHeader.tsx`: 页面标题 + 描述 + 操作区
  - `components/Icon.tsx`: 简易 SVG 图标集（20+ 图标：check/x/warning/arrow/trash/edit 等）——不依赖第三方图标库
- **AC Addressed**: FR-11、AC-3

### [ ] Task 4.2: 表单与数据展示组件（第二批次）
- **Priority**: P0
- **Depends On**: Task 4.1
- **估算代码量**: 2,000 行
- **Description**:
  - `components/Input.tsx` / `components/Textarea.tsx` / `components/Select.tsx` / `components/Checkbox.tsx`：统一的表单控件，含 label/helper/error 状态
  - `components/Table.tsx` + `components/TableColumn.tsx`：通用表格，支持列定义、分页、排序、空状态
  - `components/Modal.tsx`：模态框，含 title/body/footer，支持 ESC 关闭
  - `components/Tabs.tsx`：选项卡组件
  - `components/Pagination.tsx`: 分页导航，显示当前页/总页/总数
  - `components/Dropdown.tsx`：下拉菜单
  - `components/DateRangePicker.tsx`: 简化版日期范围选择（7/30/90 天快捷按钮）
- **AC Addressed**: FR-11、AC-3

### [ ] Task 4.3: 图表组件（第三批次）
- **Priority**: P1
- **Depends On**: Task 4.1
- **估算代码量**: 1,000 行
- **Description**:
  - `components/BarChart.tsx`: 纯 SVG 实现的条形图，支持多系列、坐标轴、图例
  - `components/LineChart.tsx`: 纯 SVG 实现的折线图，支持多系列、填充区域、坐标轴
  - `components/DonutChart.tsx`: 纯 SVG 环形图，展示比例分布
  - `components/Sparkline.tsx`: 小型趋势图，用于指标卡
- **AC Addressed**: FR-11、AC-3（图表不引入依赖）

---

## 任务块 5 — 前端新页面与增强
### [ ] Task 5.1: 前端 SDK 与 Hooks 增强
- **Priority**: P0
- **Depends On**: Task 0.1
- **估算代码量**: 1,500 行
- **Description**:
  - `lib/api.ts`（已有）：扩展为完整 SDK，每个模块独立方法（10+ 新模块的接口）
  - `lib/session.ts`（已有）：增强权限工具 can/canAny/hasRole 等
  - `lib/hooks.ts`（新增）：`useApi`（统一 API 调用 + loading/error 状态）、`useDebouncedState`、`useConfirm`、`usePagination`、`usePermissions`
  - `lib/formatters.ts`（新增）：前端日期/货币/数字/相对时间格式化
- **AC Addressed**: FR-12、AC-9

### [ ] Task 5.2: 新页面（10 个业务页面）
- **Priority**: P0
- **Depends On**: Task 4.1、Task 4.2、Task 5.1
- **估算代码量**: 4,000 行
- **Description**:
  - `pages/BillingPage.tsx`: 订阅概览（MRR/ARR/客户数/增长率）、订阅列表、发票列表、发票详情、下载发票按钮
  - `pages/NotificationsPage.tsx`: 通知列表、未读过滤、批量已读、通知偏好设置
  - `pages/WebhooksPage.tsx`: Webhook 列表、新建/编辑 Webhook 模态、事件类型多选、签名密钥展示、调用日志表格
  - `pages/MetricsPage.tsx`: 平台总览指标卡、租户趋势图、发布健康图、健康分分布环形图
  - `pages/TokensPage.tsx`: Token 列表、新建 Token 模态（名称 + 过期 + scope）、Token 值一次性展示、吊销/重新生成
  - `pages/TeamsPage.tsx`: 团队列表、团队成员管理、创建团队、成员增删
  - `pages/IntegrationsPage.tsx`: 集成市场卡片网格、集成详情与配置、连接状态、启用/禁用开关
  - `pages/FeatureFlagsPage.tsx`: 功能开关列表、开关编辑（类型/默认值/租户覆盖/灰度比例）、变更历史
  - `pages/RolesPage.tsx`: 角色列表、角色编辑（权限矩阵多选）、角色克隆、新建角色
  - `pages/TicketsPage.tsx`: 工单列表（带分页与过滤）、工单详情、状态变更按钮、评论区、新建工单模态
- **AC Addressed**: AC-2、AC-8

### [ ] Task 5.3: 增强现有 7 个页面（改用组件库 + 更丰富展示）
- **Priority**: P1
- **Depends On**: Task 4.1、Task 4.2
- **估算代码量**: 1,500 行
- **Description**:
  - Dashboard/Tenants/Users/Approvals/Releases/SupportRisks/AuditLogs 页面：
    - 改用 Button/Card/Table/Badge/StatCard/EmptyState/Modal 等公共组件
    - 增强指标卡和图表展示（使用 BarChart/LineChart/DonutChart）
    - 表格改为通用 Table + Pagination
    - 增加筛选/搜索功能
- **AC Addressed**: AC-3、AC-8

### [ ] Task 5.4: 样式与布局（CSS 增强）
- **Priority**: P1
- **Depends On**: Task 4.1
- **估算代码量**: 800 行
- **Description**:
  - CSS 变量体系（颜色/间距/字号/圆角/阴影）
  - 组件样式：button、card、badge、table、modal、tabs、pagination、alert、input、dropdown、form 的样式
  - 布局样式：sidebar/main 的响应式布局
  - 工具类：flex/grid/spacing/text-align 等简化工具类
- **AC Addressed**: FR-11

---

## 任务块 6 — 测试体系
### [ ] Task 6.1: 后端 API 测试增强
- **Priority**: P0
- **Depends On**: Task 0—Task 3 完成
- **估算代码量**: 1,500 行
- **Description**:
  - 每个新增模块至少 1 个测试文件：`billing.test.ts`、`notifications.test.ts`、`webhooks.test.ts`、`tokens.test.ts`、`metrics.test.ts`、`teams.test.ts`、`integrations.test.ts`、`features.test.ts`、`roles.test.ts`、`tickets.test.ts`
  - 每个测试文件至少覆盖：正向 CRUD、权限拒绝（403）、参数校验失败（400）、资源不存在（404）四类场景
- **AC Addressed**: AC-6

### [ ] Task 6.2: E2E 测试增强
- **Priority**: P1
- **Depends On**: Task 5
- **估算代码量**: 500 行
- **Description**:
  - `tests/e2e/smoke.spec.ts`（已有增强）：验证所有 17 个页面能正常渲染
  - `tests/e2e/nav.spec.ts`（新增）：侧边栏导航切换、权限过滤后页面可见性
  - `tests/e2e/tickets.spec.ts`（新增）：典型工单创建与状态流转
- **AC Addressed**: AC-6

### [ ] Task 6.3: shared 包测试增强
- **Priority**: P1
- **Depends On**: Task 0
- **估算代码量**: 300 行
- **Description**:
  - `rbac.test.ts`（已有）：增强，覆盖所有角色与权限组合
  - `types.test.ts`（新增）：类型工具的运行时测试（如 Zod schema 验证）
  - `formatters.test.ts`（新增）：格式化函数测试
- **AC Addressed**: AC-6

---

## 任务块 7 — 文档与知识补充
### [ ] Task 7.1: knowledge-base 新增模块文档
- **Priority**: P2
- **Depends On**: Task 2、Task 3
- **估算代码量**: 800 行（Markdown）
- **Description**:
  - `billing-module.md`: 计费模块设计、字段说明、状态流转图
  - `webhook-module.md`: Webhook 事件列表、签名算法说明、调用重试策略
  - `api-token-guide.md`: Token 使用指南、权限范围说明
  - `feature-flag-guide.md`: 功能开关使用策略、灰度发布流程
  - 更新 `api-contract.md`: 补全新增接口的完整文档
- **AC Addressed**: 知识体系完整性

### [ ] Task 7.2: verification 补充
- **Priority**: P2
- **Depends On**: Task 0—Task 6
- **估算代码量**: 300 行（Markdown）
- **Description**:
  - 更新 `known-issues.md`: 补充新模块的可演示缺陷场景
  - 更新 `trae-enterprise-checklist.md`: 补充新模块的验证项
- **AC Addressed**: AC-7

---

## 任务块依赖图（DAG）

```
Task 0.1 ──┬──> Task 0.2
           ├──> Task 0.3 ──> Task 0.4
           └──> Task 1.1 ──> Task 1.2
                        ├──> Task 2.1~2.5 ──┐
                        └──> Task 3.1~3.5 ──┤
                                            v
Task 4.1 ──> Task 4.2 ──> Task 5.1 ──> Task 5.2 ──> Task 5.3 ──> Task 5.4
              └──> Task 4.3 ────────────────────────────────────────┘
Task 6.1 依赖 Task 0~3
Task 6.2 依赖 Task 4~5
Task 6.3 依赖 Task 0
Task 7 依赖所有业务任务
```

## 实施顺序建议（11 步）
1. Task 0.1 + 0.2（shared 包基础） — 并行
2. Task 0.3 + 0.4（工具库 & 中间件） — 并行
3. Task 1.1 + 1.2（数据层 & seed） — 顺序
4. Task 2.1~2.5（核心 5 模块后端） — 可并行
5. Task 3.1~3.5（次要 5 模块后端） — 可并行
6. Task 4.1（基础组件）
7. Task 4.2 + 4.3（数据/图表组件） — 顺序
8. Task 5.1（SDK & Hooks）
9. Task 5.2 + 5.3 + 5.4（新页面 + 样式） — 可并行
10. Task 6.1 + 6.2 + 6.3（测试） — 顺序
11. Task 7.1 + 7.2（文档）

---
*文档版本: v1.0 · 代码基线: commit 03b1f83*
