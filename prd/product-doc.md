# Nexus 客户运营管理台 — 产品文档

## 1. 产品概述

Nexus 客户运营管理台是一套完整的多租户 SaaS 运营管理后台，面向 B2B SaaS 企业的客户成功、运营、财务团队，提供从客户入驻、日常运营、审批发布到计费财务的全生命周期管理能力。

### 1.1 产品定位

- **目标用户**：平台管理员、租户管理员、审计员、发布经理、普通成员
- **核心价值**：以 RBAC 权限体系驱动多角色协作，以审批工作流管控变更风险，以数据分析支撑运营决策
- **产品形态**：Web 管理后台（React SPA + Express REST API）

### 1.2 项目规模

| 指标 | 数值 |
|------|------|
| 总代码行数 | 30,000+ 行（TypeScript + TSX + CSS） |
| 功能页面 | 20 个（五大业务分组） |
| API 路由模块 | 18 个 |
| 后端服务层 | 16 个 |
| 测试用例 | 355 个（13 个测试文件） |
| 前端可复用组件 | 33 个（含 4 个 SVG 图表组件） |
| 权限码 | 56 个（16 个权限组） |
| 预置角色 | 5 个（platform_admin / tenant_admin / auditor / release_manager / member） |

---

## 2. 技术架构

```
trae-enterprise-validation-demo/
├── apps/
│   ├── api/              # Express + TypeScript 后端 API（端口 3001）
│   │   ├── src/
│   │   │   ├── routes/   # 18 个路由模块
│   │   │   ├── services/ # 16 个服务层
│   │   │   ├── middleware/# RBAC、审计中间件
│   │   │   ├── store.ts  # 内存数据存储（Repository 模式）
│   │   │   └── app.ts    # Express 应用入口
│   │   └── package.json
│   └── web-admin/        # React + TypeScript 前端管理台（端口 5173）
│       ├── src/
│       │   ├── pages/    # 20 个功能页面
│       │   ├── components/# 33 个可复用组件
│       │   ├── lib/      # API 客户端、会话管理
│       │   └── App.tsx   # 路由 + 侧边栏 + 角色切换
│       └── package.json
├── packages/
│   └── shared/           # 共享类型、RBAC 模型、权限矩阵
│       └── src/
│           ├── types.ts  # 全部 TypeScript 类型定义
│           └── rbac.ts   # 角色-权限映射、权限判断函数
├── tests/
│   └── api/              # 13 个集成测试文件（Vitest + Supertest）
├── knowledge-base/       # 企业知识库（8 份文档）
├── verification/         # 验证清单与演示流程
└── prd/                  # 产品文档、用户手册、测试用例
```

### 2.1 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 路由 | React Router v6 |
| 样式 | 纯 CSS（无第三方 UI 库） |
| 图表 | 纯 SVG 实现（BarChart / LineChart / DonutChart / Sparkline） |
| 后端框架 | Express 4 + TypeScript |
| 数据存储 | 内存 Repository 模式（预置种子数据） |
| 请求校验 | Zod |
| 测试框架 | Vitest + Supertest |
| 包管理 | pnpm workspace（Monorepo） |

### 2.2 架构特点

- **前后端共享类型**：`packages/shared` 提供统一的 TypeScript 类型定义，前后端共同引用
- **前后端共享权限矩阵**：`packages/shared/src/rbac.ts` 定义角色-权限映射，前端用 `can()` 控制按钮可见性，后端用 `requirePermission()` 中间件拦截请求
- **Repository 模式**：数据层使用泛型 `Repository<T>` 基类，提供 `getAll / get / create / update / delete` 标准接口
- **审计中间件**：所有写操作自动记录审计日志（`audit(action)` 中间件）

---

## 3. 功能模块

### 3.1 工作区（4 个页面）

| 页面 | 路由 | 功能说明 |
|------|------|----------|
| 工作台 / 总览 | `/` | 核心指标仪表盘：租户总数、活跃用户、审批通过率、本月收入；趋势图（租户增长、审批量、发布量）；客户健康分布；最近活动时间线；快速操作入口 |
| 客户 / 租户 | `/tenants` | 多租户管理：列表展示（名称、套餐、行业、健康分、ARR、订阅状态）；搜索 + 套餐筛选；租户详情 Modal（健康分、合同到期、CSM 负责人、席位使用） |
| 用户与权限 | `/users` | 用户管理：列表展示（姓名、邮箱、角色标签、所属租户、最后登录）；搜索 + 角色筛选；创建用户；角色分配 Modal；用户详情 Modal（角色列表、团队、最近活动） |
| 团队管理 | `/teams` | 团队组织架构：列表展示；创建团队；成员管理；权限继承 |

### 3.2 运营（6 个页面）

| 页面 | 路由 | 功能说明 |
|------|------|----------|
| 审批中心 | `/approvals` | 审批工作流：统计卡片（待审批/已通过/已拒绝）；状态 Tab 筛选；发起审批表单；审批详情 Modal（审批链、时间线、决策历史） |
| 发布中心 | `/releases` | 发布管理：统计卡片（成功/回滚/待发布）；环境筛选（生产/预发布）；部署和回滚操作；发布详情 Modal（变更内容、审批记录、部署时间线） |
| 风险工单 | `/support-risks` | 客户风险追踪：风险趋势图（SVG）；严重级别筛选（严重/高/中/低）；SLA 逾期标记；风险详情 Modal（影响范围、缓解建议、处理时间线） |
| 工单管理 | `/tickets` | 支持工单系统：统计卡片；优先级/状态/分类三级筛选；批量操作（关闭、分配）；工单详情 Modal（状态流转时间线、对话记录、SLA 倒计时） |
| 审计日志 | `/audit-logs` | 操作审计：操作类型筛选（创建/更新/删除/登录/导出）；时间范围选择器；导出 CSV；日志详情 Modal（变更前后对比 diff） |
| 通知中心 | `/notifications` | 系统通知：类型筛选（审批、发布、风险、发票、系统）；已读/未读状态；通知偏好设置；批量操作（标记已读、删除） |

### 3.3 财务（2 个页面）

| 页面 | 路由 | 功能说明 |
|------|------|----------|
| 订阅管理 | `/subscriptions` | 订阅生命周期管理：列表展示（租户、套餐、周期、状态、席位、金额）；升降级操作；续费提醒；用量统计 |
| 发票管理 | `/invoices` | 发票系统：列表展示（发票号、租户、金额、状态、到期日）；税金计算；付款匹配；逾期处理 |

### 3.4 集成（4 个页面）

| 页面 | 路由 | 功能说明 |
|------|------|----------|
| Webhook 配置 | `/webhooks` | 事件推送管理：创建/编辑 Webhook 端点；事件类型选择；签名验证；投递日志；重试策略 |
| 系统集成 | `/integrations` | 第三方集成管理：Slack / Salesforce / Zendesk / Jira / GitHub / Stripe；连接测试；同步调度；健康监控 |
| API Token | `/tokens` | API 密钥管理：创建/撤销 Token；权限范围配置；使用统计；过期预警 |
| 功能开关 | `/features` | 特性开关管理：创建/编辑开关；布尔/字符串/数字/JSON 类型；灰度发布（百分比）；租户覆盖；变更历史 |

### 3.5 系统（2 个页面）

| 页面 | 路由 | 功能说明 |
|------|------|----------|
| 数据分析 | `/metrics` | 平台指标分析：概览指标卡片；趋势图（租户增长、审批量、发布量）；客户健康分布（环形图）；发布统计（条形图）；审批统计 |
| 角色权限 | `/roles` | RBAC 角色管理：7 个预置角色卡片（系统角色 vs 自定义角色）；权限矩阵编辑（56 个权限码，16 个权限组）；创建自定义角色；克隆角色；删除角色（系统角色不可删除） |

---

## 4. RBAC 权限体系

### 4.1 角色定义

| 角色 | 角色码 | 说明 | 权限码数量 |
|------|--------|------|-----------|
| 平台管理员 | `platform_admin` | 全部权限，可管理所有租户和用户 | 56 |
| 租户管理员 | `tenant_admin` | 管理本租户用户、审批、发布、订阅 | 42 |
| 审计员 | `auditor` | 只读访问所有模块，可导出审计日志 | 20 |
| 发布经理 | `release_manager` | 审批操作、部署与回滚发布 | 14 |
| 普通成员 | `member` | 最小查看权限，仅可查看列表 | 12 |

### 4.2 权限分组（16 组，56 个权限码）

| 权限组 | 权限码 |
|--------|--------|
| 租户管理 | `tenant:view` `tenant:edit` `tenant:read` `tenant:write` `tenant:delete` |
| 用户管理 | `user:view` `user:edit` `user:read` `user:write` `user:delete` |
| 角色权限 | `role:view` `role:edit` `role:read` `role:write` `role:delete` |
| 审批管理 | `approval:view` `approval:approve` `approval:read` `approval:write` |
| 发布管理 | `release:view` `release:deploy` `release:read` `release:write` `release:rollback` |
| 审计日志 | `audit:view` `audit:read` `audit:export` |
| 风险管理 | `risk:read` `risk:write` |
| 活动事件 | `activity:read` |
| 计费管理 | `billing:view` `billing:edit` |
| 通知管理 | `notification:view` `notification:manage` `notification:read` |
| Webhook | `webhook:manage` `webhook:read` |
| 数据分析 | `metric:view` `metric:read` |
| API Token | `token:manage` `token:read` |
| 团队管理 | `team:manage` `team:read` `team:create` |
| 集成管理 | `integration:manage` `integration:read` `integration:create` |
| 功能开关 | `feature:manage` `feature:read` |
| 工单管理 | `ticket:view` `ticket:edit` `ticket:manage` `ticket:read` |
| 订阅管理 | `subscription:read` `subscription:manage` |
| 发票管理 | `invoice:read` `invoice:manage` |

### 4.3 权限生效机制

- **前端**：`can(permissionCode)` 函数根据当前用户角色判断按钮/操作是否可见
- **后端**：`requirePermission(permissionCode)` 中间件拦截请求，无权限返回 403
- **共享矩阵**：前后端引用同一份 `packages/shared/src/rbac.ts`，确保一致性

---

## 5. 数据模型

### 5.1 核心实体

| 实体 | 关键字段 |
|------|----------|
| Tenant | id, name, plan, industry, healthScore, arr, subscriptionStatus, seatsUsed, seatsLimit, monthlyActiveUsers, customerSuccessManager, contractEndsAt |
| User | id, tenantId, name, email, roles, isActive, lastLoginAt |
| ApprovalRequest | id, tenantId, title, status(pending/approved/rejected), requestedBy, decidedBy, description |
| ReleaseRecord | id, tenantId, version, environment(staging/production), status(pending/deployed/rolled_back), operatorId, changelog |
| AuditLog | id, tenantId, actorId, action, summary, resourceType, resourceId, details |
| SupportRisk | id, tenantId, title, severity(critical/high/medium/low), status, slaDueAt, category, impact |
| Ticket | id, tenantId, title, priority, status, category, assigneeId, creatorId, tags |
| Subscription | id, tenantId, plan, period, status, seats, monthlyRate, trialEndsAt, nextBillingAt |
| Invoice | id, tenantId, subscriptionId, invoiceNumber, status, amount, currency, items, dueDate |
| Notification | id, tenantId, userId, type, title, message, isRead, resourceType, resourceId |
| WebhookEndpoint | id, tenantId, name, url, events, secret, isActive |
| ApiToken | id, tenantId, userId, name, scopes, expiresAt, usageCount |
| Team | id, tenantId, name, description, isActive |
| Integration | id, tenantId, type, name, status, config, lastSyncAt |
| FeatureFlag | id, key, name, type, defaultValue, isEnabled, rolloutPercentage, tenantOverrides |
| RoleDefinition | id, name, type(system/custom), permissions, isActive |
| ActivityEvent | id, tenantId, type, title, actorId, targetId |

### 5.2 枚举类型

- **SubscriptionStatus**: trial / active / past_due / canceled / expired
- **InvoiceStatus**: draft / pending / sent / paid / overdue / canceled / refunded
- **TicketStatus**: new / open / in_progress / waiting_customer / resolved / closed
- **TicketPriority**: critical / high / medium / low
- **IntegrationType**: slack / salesforce / zendesk / jira / github / stripe / webhook / custom
- **FeatureFlagType**: boolean / string / number / json / select
- **NotificationType**: system_announcement / approval_request / approval_decision / release_deployed / release_rolled_back / risk_created / risk_updated / invoice_ready / invoice_overdue / subscription_renewal / feature_released / info / warning / error / success / system

---

## 6. API 接口概览

### 6.1 路由模块（18 个）

| 模块 | 路由前缀 | 主要端点 |
|------|----------|----------|
| Session | `/api/me` | GET 当前用户信息 |
| Tenants | `/api/tenants` | GET 列表, GET :id, POST 创建, PUT :id, DELETE :id |
| Users | `/api/users` | GET 列表, GET :id, POST 创建, PUT :id/roles, DELETE :id |
| Roles | `/api/roles` | GET 列表, GET :id, POST 创建, PUT :id, DELETE :id, POST :id/clone |
| Teams | `/api/teams` | GET 列表, GET :id, POST 创建, PUT :id, DELETE :id |
| Approvals | `/api/approvals` | GET 列表, GET :id, POST 创建, POST :id/approve, POST :id/reject |
| Releases | `/api/releases` | GET 列表, GET :id, POST 创建, POST :id/deploy, POST :id/rollback |
| Audit | `/api/audit-logs` | GET 列表, GET :id, GET export |
| Support Risks | `/api/support-risks` | GET 列表, GET :id, POST 创建, PUT :id |
| Tickets | `/api/tickets` | GET 列表, GET :id, POST 创建, PUT :id, POST :id/close |
| Notifications | `/api/notifications` | GET 列表, PUT :id/read, PUT read-all, GET preferences, PUT preferences |
| Subscriptions | `/api/subscriptions` | GET 列表, GET :id, PUT :id |
| Invoices | `/api/invoices` | GET 列表, GET :id |
| Webhooks | `/api/webhooks` | GET 列表, GET :id, POST 创建, PUT :id, DELETE :id, GET :id/deliveries |
| Integrations | `/api/integrations` | GET 列表, GET :id, POST 创建, PUT :id, DELETE :id, POST :id/test |
| Tokens | `/api/tokens` | GET 列表, POST 创建, DELETE :id |
| Features | `/api/features` | GET 列表, GET :id, POST 创建, PUT :id, DELETE :id, GET :id/audit |
| Metrics | `/api/metrics` | GET overview, GET trends, GET health, GET releases, GET approvals |
| Activity Events | `/api/activity-events` | GET 列表 |
| Health | `/api/health` | GET 健康检查 |

### 6.2 通用约定

- 所有请求需携带 `x-user-id` header 标识当前用户
- 租户隔离通过 `x-tenant-id` header 实现
- 写操作自动记录审计日志
- 错误响应格式：`{ error: string, issues?: ZodIssue[] }`
