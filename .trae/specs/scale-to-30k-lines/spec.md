# Nexus 客户运营管理台 - 产品需求文档（PRD）

## Overview
- **Summary**: 将现有的简单 SaaS 运营管理台从 4,600 行深化为 30,000 行的完整企业级产品。新增计费订阅、通知中心、Webhook 事件系统、指标与数据分析、API Token、团队与成员管理、集成市场、功能开关、细粒度角色权限、工单流转等核心企业级模块，同时补充前后端工程架构（组件库、服务层、错误处理、校验规则、缓存策略、测试体系），使项目在代码体量、架构分层、功能完整性三方面都达到可用于企业演示的标准。
- **Purpose**: 当前项目的代码体量不足 5,000 行，功能模块过于单薄（仅 7 个路由、7 个页面），缺乏真实企业 SaaS 项目应有的复杂度和工程深度。不足以作为 Trae 企业版的演示项目——真实的智能体需要在包含多模块、多依赖、多层次的代码库中展现其理解、定位、修复和扩展能力。
- **Target Users**:
  - **平台管理员** (platform_admin)：全局配置、集成管理、功能开关、计费策略、审计
  - **租户管理员** (tenant_admin)：成员管理、角色分配、审批、Webhook、查看本租户数据
  - **审计员** (auditor)：只读访问审计日志、审批记录、活动流
  - **发布经理** (release_manager)：发布操作、回滚、审批流转
  - **普通成员** (member)：基础业务操作，受角色权限限制

## Goals
- **代码体量目标**：整体源代码（TS/TSX/CSS/HTML/YAML/JSON/Markdown）达到 30,000 行，其中 TypeScript/TSX 代码占比不低于 70%（≥21,000 行）
- **功能模块目标**：从当前 7 个 API 路由 / 7 个页面，扩展到 20+ 路由 / 15+ 页面，覆盖计费、通知、Webhook、数据分析、API Token、团队、集成、功能开关、工单流转、角色定义等企业级功能
- **架构分层目标**：建立清晰的 Router → Middleware → Service → Store/Repository 四层架构；前端建立 Page → Component → Lib/SDK 三层架构；新增工具库层（errors/validators/formatters/cache/pagination）
- **测试目标**：每个新增模块至少 1 个测试文件，总测试文件数达到 10+，覆盖核心 API 的正向和负向用例
- **保留预置缺陷**：保持现有已知问题的可验证性（`role:edit` 权限按钮可见性不一致、重复审批拦截缺失、审计日志摘要空、API 契约漂移等），以便「攻城狮 1 号」智能体继续有意义的工作场景

## Non-Goals (Out of Scope)
- **不引入真实数据库**：继续使用内存存储（store.ts），但增强其接口抽象、并发控制和持久化语义，便于未来切换到真实数据库
- **不接入真实外部服务**：Stripe、Slack、Email Service 等外部集成使用 mock/sandbox 模式实现，不依赖网络调用
- **不做用户认证系统**：继续使用基于请求头的会话切换（x-user-id/x-user-roles），保持演示项目的易用性
- **不做微服务/多部署单元**：保持单体 Express + Vite SPA 架构
- **不做移动端适配**：仅保证桌面端体验
- **不做国际化（i18n）**：中文为主，英文标识辅助
- **不引入 GraphQL/gRPC 等协议**：保持 REST + JSON
- **不做实时通信（WebSocket）**：轮询或定时刷新即可

## Background & Context
- **项目历史**：本项目最初是一个简单的「客户/用户/审批/发布」演示项目，代码行数约 1,500 行。经过第一轮深化（`deepen-enterprise-saas-realism`）后达到 4,600 行，增加了租户画像、风险工单、活动流。但：
  - 后端缺乏真正的 Service/Repository 分层（每个 service 平均 30-50 行，仅是简单的 filter/map）
  - 前端缺乏组件库抽象（每个页面从头写，无公共 Button/Table/Card/Modal/Form）
  - 没有错误处理规范、校验规则集中管理、限流策略、缓存策略
  - 没有企业 SaaS 必备的计费、通知、集成、Webhook、分析、Token 等模块
  - 测试仅 1 个文件，覆盖不足 5% 的 API
- **技术栈约束**（已确定）：
  - 后端：Node.js + Express v5 + TypeScript + Zod（校验）+ Vitest
  - 前端：React 18 + Vite + React Router v6 + TypeScript
  - 包管理：pnpm workspace monorepo
  - 共享包：`@trae/shared`（类型与 RBAC 常量）
- **代码量扩展策略**：不是简单增加冗余代码，而是通过真实功能模块 + 工程架构抽象 + 合理测试密度来扩展：

| 模块 | 当前（行） | 目标（行） | 增量（行） | 策略 |
|---|---|---|---|---|
| packages/shared（类型/RBAC/常量/错误码） | 170 | 2,500 | +2,330 | 增强类型定义、错误码体系、枚举常量、格式化工具 |
| packages/config（ESLint/TS 配置包） | 30 | 200 | +170 | 完善配置规范 |
| apps/api 路由层（routes/） | ~500 | 3,500 | +3,000 | 新增 12+ 路由（计费/通知/Webhook/metrics/tokens/teams/integrations/features/tickets/roles/billing/invoices） |
| apps/api 服务层（services/） | ~400 | 5,500 | +5,100 | 每个路由配套服务层，含业务逻辑、校验、状态流转 |
| apps/api 中间件（middleware/） | ~150 | 1,200 | +1,050 | 增强 RBAC、限流、错误处理、请求追踪、验证中间件 |
| apps/api 工具库（lib/） | ~30 | 1,500 | +1,470 | 新增 errors/pagination/cache/validators/formatters |
| apps/api 数据层（data/store） | ~150 | 800 | +650 | 从简单数组变为仓库模式，增删改查标准化 |
| apps/api 其他（app/server/seed） | ~150 | 500 | +350 | 增强启动流程、路由注册、健康检查 |
| apps/web-admin 页面（pages/） | ~700 | 4,500 | +3,800 | 新增 10+ 页面 |
| apps/web-admin 组件库（components/） | 0 | 4,000 | +4,000 | 新增 Button/Table/Card/Modal/Form/Badge/Pagination/Sidebar/Header/EmptyState/StatCard 等 |
| apps/web-admin 工具与 SDK（lib/） | ~150 | 2,500 | +2,350 | 增强 API SDK、hooks、权限工具、格式化工具 |
| apps/web-admin 样式（styles.css） | ~150 | 800 | +650 | 组件样式、主题变量、响应式布局 |
| tests/api（API 测试） | ~187 | 2,000 | +1,813 | 每个路由模块配套测试 |
| tests/e2e（E2E 测试） | ~50 | 500 | +450 | 核心页面冒烟测试 |
| 文档（knowledge-base + verification） | ~1,100 | 2,000 | +900 | 新增模块文档、操作手册、API 手册 |
| **总计** | **~4,600** | **32,000** | **+27,400** | 目标 30,000 行（有 ±10% 容差） |

## Functional Requirements

### FR-1: 计费与订阅管理模块（Billing & Subscriptions）
- 支持多租户的订阅计划管理（月度/年度、标准/企业版）
- 支持席位（seat）计数与超量告警
- 支持发票（invoice）列表与状态管理（草稿/已发送/已支付/已逾期/已取消）
- 支持付款方式模拟（信用卡/银行转账/年度合同）
- 支持计费仪表板：MRR、ARR、客户流失、客户增长

### FR-2: 通知中心（Notifications）
- 支持平台级通知和租户级通知
- 支持通知类型：系统公告、审批通知、发布通知、风险告警、计费提醒
- 支持未读/已读状态、已读标记、批量已读、归档
- 支持通知偏好设置（哪些事件触发通知）

### FR-3: Webhook 事件系统
- 支持为每个租户创建和管理多个 Webhook 端点
- 支持事件类型订阅（approvals.*, releases.*, tenants.*, tickets.*, billing.*）
- 支持签名验证（mock 模式下展示签名算法）
- 支持 Webhook 调用日志（最近 50 次调用、状态码、响应时间）
- 支持禁用/启用 Webhook、密钥轮转

### FR-4: 指标与数据分析（Metrics & Analytics）
- 平台级指标：活跃客户数、月活跃用户、平均健康分、发布成功率、审批通过率
- 支持按时间范围过滤（7 天/30 天/90 天）
- 支持客户健康度分析（健康/关注/风险）
- 支持简单的条形图和折线图数据（前端用 HTML + CSS 实现简易图表，不引入图表库）

### FR-5: API Token 管理
- 支持创建带过期时间的 API Token
- 支持 Token 权限范围（scope）配置（只读/读写/管理）
- 支持 Token 吊销和重新生成
- 支持 Token 使用统计（最近调用时间、调用次数）
- 支持仅在创建时展示 Token 值（一次性展示）

### FR-6: 团队与成员管理（Teams & Members）
- 支持在租户内创建和管理多个团队（Team）
- 支持成员加入/移出团队
- 支持团队级权限继承
- 支持成员角色变更、席位分配

### FR-7: 集成市场（Integrations Marketplace）
- 支持浏览可用集成（Slack/Salesforce/Zendesk/Jira/GitHub/Stripe/Webhook/Custom）
- 支持启用/禁用集成
- 支持集成配置页面（每个集成有独立配置 schema）
- 支持集成连接状态（已连接/未连接/错误）

### FR-8: 功能开关（Feature Flags）
- 平台管理员可控制全局功能开关
- 支持按租户灰度（特定租户启用）
- 支持开关类型：布尔型、字符串、数值、选项列表
- 支持开关变更审计（谁在什么时候改了什么值）
- 支持默认值和覆盖值

### FR-9: 细粒度角色与权限（Role Definitions）
- 支持自定义角色创建，从预设权限集合中选择
- 支持角色克隆、角色编辑、角色删除
- 支持权限矩阵的前端可视化展示（谁能做什么）
- 预置角色保留：platform_admin/tenant_admin/auditor/release_manager/member

### FR-10: 工单流转系统（Tickets & Conversations）
- 支持创建工单（标题、描述、优先级、分类、指派人）
- 支持工单状态流转（新建 → 处理中 → 等待客户 → 已解决 → 已关闭）
- 支持工单内评论/会话（Conversation）
- 支持工单标签
- 支持工单筛选（按状态、按指派人、按优先级）

### FR-11: 前端组件库抽象
- 公共组件：Button、Card、Table、TableColumn、Modal、Tabs、Form、Input、Select、Textarea、Badge、StatCard、Pagination、EmptyState、Alert、Tag、Avatar、Sidebar、PageHeader、Dropdown、Checkbox、DateRangePicker
- 公共 Hooks：useApi（统一 API 调用）、usePermission（权限判断）、usePagination、useDebouncedState、useConfirm（确认弹窗）
- 公共工具：日期格式化、货币格式化、数字格式化

### FR-12: 后端工程架构增强
- **错误处理规范**：定义 AppError 类（带 errorCode、message、httpStatus、details），统一错误响应格式
- **参数校验集中管理**：每个路由的 Zod schema 独立定义，便于复用和测试
- **分页工具**：统一的分页请求参数解析、分页响应格式
- **Service 层抽象**：每个 Service 遵循一致的接口规范（list/get/create/update/delete/...）
- **简单内存缓存**：带 TTL 的 Map 缓存，用于租户配置、权限校验
- **请求追踪 ID**：每个请求分配 traceId，日志中可追踪

### FR-13: 测试体系完善
- 核心路由的正向/负向测试
- 中间件（RBAC、audit）的行为测试
- 服务层的业务逻辑测试
- Playwright E2E 测试（页面导航、核心操作）

## Non-Functional Requirements

### NFR-1: 代码风格一致性
- 所有新增 TypeScript 文件遵循现有的 import 顺序、函数命名和类型注解风格
- 使用 zod 做参数校验，不混用其他校验库
- 统一使用箭头函数风格路由处理器

### NFR-2: 类型安全
- 前后端共享类型定义（`@trae/shared`），避免重复定义
- API 请求/响应类型与 shared 类型保持一致
- 不使用 `any`（允许 `unknown` 和显式类型断言）

### NFR-3: 性能（演示层面）
- 列表接口支持分页（默认 20 条/页）
- 大数据列表前端使用虚拟滚动或分页展示
- 单次 API 响应时间 < 100ms（内存数据，无 IO）

### NFR-4: 可测试性
- Service 函数纯函数化，便于单元测试
- 路由处理器保持薄，逻辑下沉到 Service
- 错误路径有明确的错误码，便于断言测试

### NFR-5: 安全演示
- API Token 仅在创建时展示（模拟）
- 权限判断有明确的 deny-by-default 语义
- 审计日志对敏感操作记录

### NFR-6: 代码量约束
- 单文件不超过 400 行（超长文件需要拆分）
- 组件文件不超过 300 行
- 服务文件不超过 350 行
- 工具/类型文件按需拆分

## Constraints

- **技术栈**：保持现有（Express v5 + React 18 + Vite + Zod + Vitest + Playwright），不引入新的大型依赖（不引入 Ant Design、MUI、React Query、Axios、Prisma 等）
- **存储**：内存存储，不可引入数据库
- **部署**：本地 `pnpm dev:api` + `pnpm dev:web`，不可引入 Docker/K8s
- **依赖限制**：允许新增但不滥用——优先手写简单实现，不通过引入大型库来增加代码量
- **语言**：中文产品文案 + 英文代码变量/函数名
- **时间**：本次深化是一次性的代码扩展，不需要分多期交付

## Assumptions

- 用户浏览前端页面时，会话通过前端的 select 下拉或邮箱输入来切换（不改变现有模式）
- 后端通过 `x-user-id` / `x-user-roles` / `x-tenant-id` 请求头确定当前用户（不改变现有模式）
- 新增模块的 API 路径模式 `/api/<module>/<resource>`（与现有风格一致）
- 所有新增数据都是演示数据（seed），不需要真实同步
- 前端简易图表用 HTML + CSS 实现（条形图、折线图用 div + flex/grid 模拟）
- 不依赖时间敏感数据（如当前日期）——使用相对时间描述或固定种子日期

## Acceptance Criteria

### AC-1: 项目代码总量达到 30,000 行
- **Given**: 项目当前代码总量为 ~4,600 行
- **When**: 执行本次深化的所有任务并完成后
- **Then**: 以 `find + wc -l` 统计（排除 node_modules/dist/build/coverage/.git）总代码行数应在 27,000—33,000 行之间
- **Then**: 其中 TypeScript/TSX 代码应占比 ≥ 70%（≥ 21,000 行）
- **Verification**: `programmatic`

### AC-2: 新增至少 10 个功能模块
- **Given**: 当前仅有 tenants/users/approvals/releases/audit-logs/support-risks/activity-events 7 个模块
- **When**: 新增模块完成后
- **Then**: 至少新增 billing、notifications、webhooks、metrics、tokens、teams、integrations、features、roles、tickets 共 10 个模块
- **Then**: 每个模块至少有 1 个路由文件 + 1 个服务文件 + 1 个页面
- **Verification**: `programmatic`

### AC-3: 前端具备组件库（至少 15 个公共组件）
- **Given**: 当前无公共组件，所有页面独立实现
- **When**: 组件库建立完成后
- **Then**: `apps/web-admin/src/components/` 目录下至少 15 个独立组件文件
- **Then**: 所有页面至少使用 3 个以上公共组件
- **Verification**: `programmatic`

### AC-4: 后端具备清晰的四层架构
- **Given**: 当前路由、服务、数据层边界不清
- **When**: 架构重构完成后
- **Then**: Router → Middleware → Service → Store 层次清晰，每层目录独立
- **Then**: Service 层包含一致的 CRUD 方法签名模式
- **Then**: Middleware 层包含 auth/rbac/audit/error-handler/rate-limit/tracing 等
- **Verification**: `human-judgment` + `programmatic`

### AC-5: 统一错误处理与响应格式
- **Given**: 当前错误处理分散，不同路由错误格式不一致
- **When**: 统一错误处理完成后
- **Then**: 所有错误响应为 `{ error: string, errorCode: string, details?: any }` 格式
- **Then**: 400/401/403/404/409/429/500 状态码均有覆盖场景
- **Verification**: `programmatic`

### AC-6: 测试覆盖每个新增模块
- **Given**: 当前只有 1 个 API 测试文件
- **When**: 测试增强完成后
- **Then**: `tests/api/` 目录下至少 8 个测试文件
- **Then**: `pnpm test` 执行成功，无失败用例
- **Verification**: `programmatic`

### AC-7: 权限体系保持可演示缺陷
- **Given**: 当前 `role:edit` 前端按钮可见性与后端不一致等预置缺陷
- **When**: 新模块完成后
- **Then**: 新模块的权限检查同样遵循现有模式（保持一致的缺陷模式，便于智能体修复）
- **Then**: 不提前修复现有缺陷
- **Verification**: `human-judgment`

### AC-8: 前端能完整导航到每个新增模块页面
- **Given**: 当前只有 7 个页面
- **When**: 新页面完成后
- **Then**: 侧边栏导航包含所有新增模块入口，路由能正常切换
- **Then**: 每个页面能正确渲染数据（无白屏/无报错）
- **Verification**: `human-judgment`

### AC-9: TypeScript 类型检查通过
- **Given**: 新增大量代码后
- **When**: 执行 `pnpm typecheck`
- **Then**: 无类型错误
- **Verification**: `programmatic`

### AC-10: seed 数据丰富到足以演示每个模块
- **Given**: 当前 seed 数据有限
- **When**: 扩展完成后
- **Then**: 每个新增模块至少有 5-20 条模拟数据
- **Then**: 数据包含真实的行业语义（如 invoice 有真实编号、日期、金额等字段）
- **Verification**: `programmatic`

### AC-11: 代码风格统一
- **Given**: 新增大量代码
- **When**: 人工审阅代码
- **Then**: import 顺序、缩进、命名、类型注解风格一致
- **Then**: 单文件不超过 400 行
- **Verification**: `human-judgment`

## Open Questions

- [ ] **是否引入额外的测试数据生成工具（如 @faker-js/faker 的简化替代）**？当前手动写 seed 对象，数据量增大后可考虑简单的生成函数，但不引入外部依赖
- [ ] **前端图表是否用 SVG 手写**？为避免引入 echarts/recharts，可以用 SVG 画简单条形图/折线图，增加代码深度但不增加依赖
- [ ] **是否需要文件上传/下载模拟**？计费模块的发票下载可以用 Blob 生成 CSV 下载演示
- [ ] **是否需要 dark mode 主题**？演示项目可以带一个亮/暗主题切换，展示 CSS 变量和主题切换架构（纯 CSS 变量实现，不引入 styled-components/tailwind）

---
*文档版本: v1.0 · 生成时间: 2026-06-09 · 代码基线: commit 03b1f83*
