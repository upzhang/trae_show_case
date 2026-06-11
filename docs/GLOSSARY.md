# GLOSSARY — 术语与上下文词典

> 统一业务术语和技术术语的解释，避免 AI 误解上下文。

## 业务术语

| 术语 | 英文 | 说明 |
|------|------|------|
| 租户 | Tenant | 平台上的企业客户，每个租户有独立的用户、数据、配置 |
| 平台管理员 | Platform Admin | 跨租户的超级管理员，拥有所有权限 |
| 租户管理员 | Tenant Admin | 单个租户的管理员，管理租户内的用户和资源 |
| 审计员 | Auditor | 只读角色，可查看审计日志和大部分数据 |
| 发布经理 | Release Manager | 负责发布部署和回滚操作 |
| 普通成员 | Member | 基础只读权限 |
| 客户成功经理 | CSM (Customer Success Manager) | 负责对接和服务特定租户的人员 |
| 健康度评分 | Health Score | 租户的综合健康指标（0-100），反映客户满意度、使用活跃度等 |
| 年度经常性收入 | ARR (Annual Recurring Revenue) | 租户年度订阅收入 |
| 月度经常性收入 | MRR (Monthly Recurring Revenue) | 租户月度订阅收入 |
| 席位 | Seat | 租户购买的用戶许可证数量 |
| 审批 | Approval | 需要审核确认的操作请求 |
| 审批链 | Approval Chain | 多级审批流程：member → tenant_admin → platform_admin → auditor |
| 发布 | Release | 软件版本部署到 staging 或 production 环境 |
| 回滚 | Rollback | 将已部署的版本恢复到之前的状态 |
| 工单 | Ticket | 客户支持请求或问题追踪 |
| 风险工单 | Support Risk | 需要关注的客户风险项，含严重度和 SLA |
| 功能开关 | Feature Flag | 控制功能是否启用的开关，支持租户级覆盖和灰度 |
| Webhook | Webhook | 事件驱动的 HTTP 回调，用于通知外部系统 |
| 集成 | Integration | 与第三方系统的连接（Slack、GitHub、Jira 等） |
| 灰度发布 | Rollout / Canary Release | 按百分比逐步向用户开放新功能 |
| 服务等级协议 | SLA (Service Level Agreement) | 风险工单的处理时限承诺 |
| 订阅 | Subscription | 租户的付费计划 |
| 发票 | Invoice | 订阅费用的账单记录 |
| 试用 | Trial | 租户的免费试用期 |

## 技术术语

| 术语 | 说明 |
|------|------|
| RBAC | Role-Based Access Control，基于角色的访问控制 |
| PermissionCode | 权限码，格式为 `resource:action`，如 `tenant:view`、`user:edit` |
| RoleCode | 角色码，5 种内置角色 + 自定义角色 |
| Repository 模式 | 数据访问层设计模式，封装数据存储和查询逻辑 |
| 种子数据 | Seed Data，应用启动时加载的初始模拟数据 |
| Monorepo | 单仓库多包管理，本项目使用 pnpm workspace |
| Middleware | Express 中间件，在请求处理链中执行 |
| Zod | TypeScript 优先的 schema 声明和验证库 |
| Supertest | HTTP 断言库，用于测试 Express 应用 |
| Vitest | 基于 Vite 的测试框架 |
| Playwright | 浏览器自动化 E2E 测试框架 |
| HMR | Hot Module Replacement，热模块替换 |
| ESM | ECMAScript Modules，ES 模块系统 |

## 内部缩写

| 缩写 | 全称 | 说明 |
|------|------|------|
| CSM | Customer Success Manager | 客户成功经理 |
| ARR | Annual Recurring Revenue | 年度经常性收入 |
| MRR | Monthly Recurring Revenue | 月度经常性收入 |
| SLA | Service Level Agreement | 服务等级协议 |
| RBAC | Role-Based Access Control | 基于角色的访问控制 |
| API | Application Programming Interface | 应用程序接口 |
| SPA | Single Page Application | 单页应用 |
| E2E | End-to-End | 端到端测试 |
| CI | Continuous Integration | 持续集成 |
| CD | Continuous Deployment | 持续部署 |
| TTL | Time To Live | 缓存生存时间 |
| LRU | Least Recently Used | 最近最少使用（缓存淘汰策略） |
| UUID | Universally Unique Identifier | 通用唯一标识符 |
| CORS | Cross-Origin Resource Sharing | 跨域资源共享 |
| JSON | JavaScript Object Notation | JSON 数据格式 |
| CSV | Comma-Separated Values | 逗号分隔值格式 |
| HMR | Hot Module Replacement | 热模块替换 |
| TS | TypeScript | TypeScript |
| JSX | JavaScript XML | React 的语法扩展 |
| PR | Pull Request | 合并请求 |
| MCP | Model Context Protocol | 模型上下文协议（Trae IDE 集成） |

## 命名约定速查

| 场景 | 约定 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `error-handler.ts` |
| 变量/函数 | camelCase | `getCurrentUserId` |
| 类/接口/组件 | PascalCase | `AppError`、`TenantsPage` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| 布尔函数 | is/has/can 前缀 | `isAppError`、`hasPermission` |
| 类型导入 | import type | `import type { RoleCode } from "..."` |
| 路径别名 | @trae/shared | `@trae/shared` → `packages/shared/src` |

## ❓待确认

- 是否有其他业务特定术语需要补充？
- "Nexus" 是产品名称还是项目代号？
- 租户名称中的中英文混合命名（如 "Acme 精密制造"）是否有特定业务含义？
