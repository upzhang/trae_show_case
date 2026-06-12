# PROJECT_OVERVIEW — 项目总览

## 项目定位与业务目标

**Nexus 客户运营管理台** 是一个多租户 SaaS 运营平台，面向企业客户成功（Customer Success）团队，以权限与审批流驱动变更管理。

核心业务场景：
- 管理多个企业租户（客户）的生命周期，包括合同、健康度、席位用量
- 基于 RBAC 的权限体系控制用户操作范围
- 审批流驱动发布部署、配置变更等高风险操作
- 审计日志记录所有变更操作，满足合规要求
- 工单管理、风险监控、通知中心等运营能力
- 订阅与发票管理
- 功能开关（Feature Flag）灰度发布
- 第三方系统集成（Slack、GitHub、Jira 等）

## 核心功能模块

| 模块 | 说明 |
|------|------|
| 租户管理 | 20 个模拟企业租户，含行业、健康度、合同、ARR 等字段 |
| 用户与权限 | 5 种内置角色（platform_admin / tenant_admin / auditor / release_manager / member），支持自定义角色 |
| 审批中心 | 审批创建、通过、驳回，含审批链和超时检测 |
| 发布中心 | 版本发布、部署、回滚，区分 staging/production 环境 |
| 审计日志 | 全量操作记录，支持 CSV/JSON 导出和高级搜索 |
| 风险工单 | 40 条模拟风险记录，含严重度、SLA、状态流转 |
| 工单管理 | 工单 CRUD、状态流转、会话记录 |
| 通知中心 | 系统公告、审批通知、发票提醒等，支持偏好设置 |
| Webhook | 事件驱动的外部回调，含投递日志 |
| API Token | 用户级 API 密钥管理 |
| 团队管理 | 租户内团队和成员管理 |
| 系统集成 | Slack、GitHub、Jira、Salesforce、Zendesk 等 |
| 功能开关 | Feature Flag 管理，支持租户级覆盖和灰度比例 |
| 订阅与发票 | 订阅计划、计费周期、发票状态管理 |
| 数据分析 | 平台指标、租户趋势、健康度分布 |

## 技术栈与版本

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | ≥ 20（CI 用 20，legacy-node-check 用 18） |
| 包管理器 | pnpm | 10.11.0 |
| 语言 | TypeScript | 5.8.3 |
| 后端框架 | Express | 5.1.0 |
| 数据校验 | Zod | 3.24.4 |
| 前端框架 | React | 18.3.1 |
| 前端路由 | react-router-dom | 6.28.0 |
| 构建工具 | Vite | 6.0.7 |
| 测试框架 | Vitest | 3.2.2 |
| E2E 测试 | Playwright | 1.52.0 |
| API 测试 | Supertest | 7.1.1 |
| TS 执行器 | tsx | 4.19.4 |
| CORS | cors | 2.8.5 |
| Monorepo | pnpm workspace | — |

## 运行环境

- 开发环境：macOS / Linux / Windows，Node.js ≥ 20
- 后端端口：`4100`（可通过 `PORT` 环境变量覆盖）
- 前端端口：`5173`（Vite 默认），开发时通过代理转发 `/api` 到 `localhost:4100`
- 数据存储：内存（无持久化数据库，所有数据为启动时加载的种子数据）

## 关键术语表

| 术语 | 说明 |
|------|------|
| Tenant | 租户，即平台上的企业客户 |
| RBAC | Role-Based Access Control，基于角色的权限控制 |
| PermissionCode | 权限码，如 `tenant:view`、`user:edit` |
| RoleCode | 角色码，如 `platform_admin`、`tenant_admin` |
| Approval | 审批请求，状态为 pending/approved/rejected |
| Release | 发布记录，环境为 staging/production |
| Feature Flag | 功能开关，支持租户级覆盖和灰度发布 |
| Webhook | 事件驱动的 HTTP 回调 |
| SLA | Service Level Agreement，服务等级协议 |
| ARR | Annual Recurring Revenue，年度经常性收入 |
| MRR | Monthly Recurring Revenue，月度经常性收入 |
| CSM | Customer Success Manager，客户成功经理 |
| Health Score | 租户健康度评分（0-100） |

