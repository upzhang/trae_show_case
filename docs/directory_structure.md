# DIRECTORY_STRUCTURE — 目录结构说明

## 顶层目录

```
trae-enterprise-validation-demo/
├── .github/workflows/    # CI/CD 配置
├── .trae/                # Trae IDE 配置
├── apps/                 # 应用层（前端 + 后端）
├── packages/             # 共享包
├── prd/                  # PRD 相关脚本
├── tests/                # 测试（API 测试 + E2E 测试）
├── docs/                 # 项目文档（本目录）
├── .gitignore
├── README.md
├── package.json          # 根 package.json（monorepo 脚本）
├── pnpm-lock.yaml
├── pnpm-workspace.yaml   # pnpm workspace 配置
├── tsconfig.base.json    # 基础 TypeScript 配置
├── playwright.config.ts  # Playwright E2E 配置
├── check_api.py          # ❓待确认用途的 Python 脚本
├── investigate.py        # ❓待确认用途的 Python 脚本
├── test_all.py           # ❓待确认用途的 Python 脚本
├── test_phase1.py        # ❓待确认用途的 Python 脚本
├── test_phase2.py        # ❓待确认用途的 Python 脚本
└── test_runner.py        # ❓待确认用途的 Python 脚本
```

## apps/api/ — 后端 API 服务

```
apps/api/
├── src/
│   ├── server.ts              # 🔴 核心 — 服务入口，监听 4100 端口
│   ├── app.ts                 # 🔴 核心 — Express 应用配置，中间件注册，路由挂载
│   ├── store.ts               # 🔴 核心 — 数据存储层，Repository 模式 + 种子数据单例
│   ├── data/
│   │   └── seed.ts            # 🔴 核心 — 种子数据生成（20 租户、100+ 用户、审批、发布等）
│   ├── middleware/             # 🟡 中间件层
│   │   ├── auth.ts            #    用户解析（x-user-id → req.currentUserId）
│   │   ├── rbac.ts            #    权限校验中间件 requirePermission()
│   │   ├── audit.ts           #    审计日志记录中间件
│   │   ├── error-handler.ts   #    全局错误处理 + wrapAsync + validateRequest
│   │   ├── rate-limit.ts      #    限流中间件（全局/严格/登录三种级别）
│   │   ├── request-logger.ts  #    请求日志 + trace 中间件 + CORS 中间件
│   │   └── validate.ts        #    Zod schema 校验中间件
│   ├── routes/                # 🟡 路由层（20 个模块）
│   │   ├── health.ts          #    GET /health
│   │   ├── session.ts         #    GET /api/session/me
│   │   ├── tenants.ts         #    GET/PUT /api/tenants
│   │   ├── users.ts           #    GET/POST /api/users, PUT /api/users/:id/roles
│   │   ├── approvals.ts       #    GET/POST /api/approvals, PUT approve/reject
│   │   ├── releases.ts        #    GET /api/releases, PUT deploy/rollback
│   │   ├── audit.ts           #    GET /api/audit-logs
│   │   ├── support-risks.ts   #    GET /api/support-risks
│   │   ├── activity-events.ts #    GET /api/activity-events
│   │   ├── webhooks.ts        #    CRUD /api/webhooks
│   │   ├── tokens.ts          #    CRUD /api/tokens
│   │   ├── teams.ts           #    CRUD /api/teams
│   │   ├── integrations.ts    #    CRUD /api/integrations
│   │   ├── features.ts        #    CRUD /api/features
│   │   ├── tickets.ts         #    CRUD /api/tickets
│   │   ├── subscriptions.ts   #    /api/subscriptions
│   │   ├── invoices.ts        #    /api/invoices
│   │   ├── notifications.ts   #    /api/notifications
│   │   ├── metrics.ts         #    /api/metrics
│   │   └── roles.ts           #    /api/roles
│   ├── services/              # 🟡 服务层（20 个模块）
│   │   ├── tenant-service.ts
│   │   ├── user-service.ts
│   │   ├── approval-service.ts  # 含审批链、统计、超时检测
│   │   ├── release-service.ts
│   │   ├── audit-service.ts     # 含 diff、导出、统计、搜索
│   │   ├── ... (其余 15 个服务)
│   └── lib/                   # 🟢 工具库
│       ├── errors.ts          #    错误类层次 + errorFactory
│       ├── http.ts            #    HTTP 工具（header/param/query 解析、响应构建）
│       ├── pagination.ts      #    分页/排序/过滤工具
│       ├── validators.ts      #    Zod schema 定义 + 校验函数
│       ├── cache.ts           #    SimpleCache / LRUCache + 缓存工具函数
│       ├── metrics.ts         #    MetricsCollector + 指标计算
│       ├── tracing.ts         #    Tracer / Span / Logger
│       └── utils.ts           #    通用工具函数（ID 生成、格式化、深拷贝等）
├── package.json
└── tsconfig.json
```

## apps/web-admin/ — 前端管理台

```
apps/web-admin/
├── index.html                 # 🔴 HTML 入口
├── vite.config.ts             # 🔴 Vite 配置（代理 /api → localhost:4100）
├── src/
│   ├── main.tsx               # 🔴 入口 — ReactDOM.createRoot + BrowserRouter
│   ├── App.tsx                # 🔴 核心 — 布局、路由、用户切换
│   ├── styles.css             #    全局样式
│   ├── lib/
│   │   ├── api.ts             # 🟡 API 封装（fetch + x-user-id 头）
│   │   └── session.ts         # 🟡 用户会话管理（localStorage + can() 权限判断）
│   ├── pages/                 # 🟡 业务页面（18 个）
│   │   ├── DashboardPage.tsx  #    工作台总览
│   │   ├── TenantsPage.tsx    #    客户/租户列表
│   │   ├── UsersPage.tsx      #    用户与权限
│   │   ├── ApprovalsPage.tsx  #    审批中心
│   │   ├── ReleasesPage.tsx   #    发布中心
│   │   ├── AuditLogsPage.tsx  #    审计日志
│   │   ├── SupportRisksPage.tsx #  风险工单
│   │   ├── TicketsPage.tsx    #    工单管理
│   │   ├── NotificationsPage.tsx # 通知中心
│   │   ├── WebhooksPage.tsx   #    Webhook 配置
│   │   ├── IntegrationsPage.tsx #  系统集成
│   │   ├── TokensPage.tsx     #    API Token
│   │   ├── TeamsPage.tsx      #    团队管理
│   │   ├── FeaturesPage.tsx   #    功能开关
│   │   ├── SubscriptionsPage.tsx # 订阅管理
│   │   ├── InvoicesPage.tsx   #    发票管理
│   │   ├── MetricsPage.tsx    #    数据分析
│   │   └── RolesPage.tsx      #    角色权限
│   └── components/            # 🟢 通用 UI 组件（40+ 个）
│       ├── Button.tsx, Input.tsx, Select.tsx, Modal.tsx ...
│       ├── Table.tsx, Pagination.tsx, FilterBar.tsx ...
│       ├── Card.tsx, StatCard.tsx, ChartContainer.tsx ...
│       ├── Badge.tsx, Tag.tsx, StatusDot.tsx, Spinner.tsx ...
│       └── ...
├── package.json
└── tsconfig.json
```

## packages/shared/ — 共享类型与逻辑

```
packages/shared/
├── src/
│   ├── index.ts       # 🔴 统一导出
│   ├── types.ts       # 🔴 所有 TypeScript 类型/接口/枚举
│   ├── rbac.ts        # 🔴 RBAC 权限矩阵 + 校验函数
│   └── rbac.test.ts   #    RBAC 单元测试
├── package.json
└── tsconfig.json
```

## packages/config/ — 共享配置

```
packages/config/
├── eslint.base.json   # 基础 ESLint 规则
└── package.json
```

## tests/ — 测试

```
tests/
├── api/                    # 🟡 API 集成测试（Vitest + Supertest）
│   ├── basic.test.ts       #    核心测试：health、session、RBAC、审批、发布、审计
│   ├── features.test.ts
│   ├── integrations.test.ts
│   ├── invoices.test.ts
│   ├── metrics.test.ts
│   ├── notifications.test.ts
│   ├── roles.test.ts
│   ├── subscriptions.test.ts
│   ├── teams.test.ts
│   ├── tickets.test.ts
│   ├── tokens.test.ts
│   └── webhooks.test.ts
└── e2e/                    # 🟢 E2E 测试（Playwright）
    └── smoke.spec.ts       #    冒烟测试：工作台加载、页面跳转
```

## 图例

| 标记 | 含义 |
|------|------|
| 🔴 核心 | 核心业务代码，改动需谨慎 |
| 🟡 业务 | 业务模块代码 |
| 🟢 工具/辅助 | 工具函数、通用组件、辅助代码 |
| ⚪ 生成物/可忽略 | 构建产物、依赖锁文件等 |

## ❓待确认

- 根目录下的 6 个 Python 脚本（check_api.py、investigate.py、test_all.py、test_phase1.py、test_phase2.py、test_runner.py）的具体用途是什么？是否为临时测试脚本可以清理？
- prd/run_tests.py 的用途？
- .trae/mcp.json.example 是否已被实际 MCP 配置替代？
