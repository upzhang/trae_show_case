# 深化企业 SaaS 真实感 Spec

## Why
当前项目虽然具备权限、审批、发布、审计等基础模块，但页面信息密度和业务语义偏薄，容易显得像“为了演示而演示”。本次改造要把它深化成一个更像真实企业使用的 B2B SaaS 管理台，让用户在熟悉页面时能看到客户、套餐、风险、工单、活动流、指标趋势等可信业务细节。

## What Changes
- 将产品定位从“Trae 企业验证后台”收敛为真实业务产品“线索/客户/订阅/运营管理台”。
- 增强仪表盘：增加 ARR、活跃租户、待处理审批、风险工单、发布健康度等指标。
- 增加租户详情维度：行业、套餐、客户成功经理、合同到期日、健康分、使用量。
- 增加工单/风险队列模块：展示客户问题、严重级别、SLA、负责人、状态。
- 增加活动流模块：展示用户、审批、发布、审计等最近事件。
- 增加更真实的 seed 数据：多租户、多角色、多审批、多发布、多工单、多风险状态。
- 保留原有可验证缺陷，不把演示用 bug 全部提前修掉。
- 不引入真实数据库，仍沿用内存存储，避免基础设施复杂度影响演示。

## Impact
- Affected specs: 前端信息架构、后端内存数据模型、API 契约、测试策略、企业知识库文档
- Affected code: `apps/web-admin/src/pages/*`、`apps/web-admin/src/lib/api.ts`、`apps/api/src/store.ts`、`apps/api/src/data/seed.ts`、`apps/api/src/routes/*`、`packages/shared/src/types.ts`

## ADDED Requirements

### Requirement: 真实业务定位
The system SHALL present itself as a credible B2B SaaS operations console rather than a generic validation demo.

#### Scenario: 用户打开首页
- **WHEN** 用户访问前端首页
- **THEN** 页面 SHALL 显示真实产品名、业务指标和运营上下文
- **AND** 页面 SHALL NOT 使用“验证后台”“演示系统”等出戏文案

### Requirement: 增强仪表盘
The system SHALL provide a richer dashboard with business metrics and operational signals.

#### Scenario: 管理员查看工作台
- **WHEN** 有 `tenant:view`、`approval:view` 或 `release:view` 权限的用户进入工作台
- **THEN** 系统 SHALL 展示 ARR、活跃租户、待审批、风险工单、发布健康度等指标
- **AND** 每个指标 SHALL 基于 seed 数据或内存 store 计算

### Requirement: 租户业务画像
The system SHALL enrich tenants with business profile fields.

#### Scenario: 查看租户数据
- **WHEN** 用户查看租户列表或工作台摘要
- **THEN** 系统 SHALL 展示行业、套餐、健康分、合同到期日、客户成功经理、席位数、月活使用量

### Requirement: 工单与风险队列
The system SHALL provide a support/risk queue for customer-facing operational issues.

#### Scenario: 查看风险队列
- **WHEN** 用户进入风险或工单页面
- **THEN** 系统 SHALL 展示工单标题、租户、严重级别、SLA 到期时间、负责人和状态
- **AND** 系统 SHALL 根据权限控制页面可见性或操作按钮

### Requirement: 活动流
The system SHALL provide a recent activity feed that ties together users, approvals, releases and audit logs.

#### Scenario: 查看最近动态
- **WHEN** 用户进入工作台
- **THEN** 系统 SHALL 展示最近用户变更、审批动作、发布动作和审计事件

### Requirement: 保留演示缺陷
The system SHALL keep the existing intentional issues available for Agent demonstration.

#### Scenario: 改造完成后执行验证清单
- **WHEN** 用户使用 `@攻城狮1号` 执行预置验证任务
- **THEN** 原有权限、API 契约、审批状态机、审计摘要、CI 等缺陷 SHALL 仍可被识别或复现

## MODIFIED Requirements

### Requirement: 前端导航与页面信息架构
The system SHALL update navigation from a minimal validation layout to a realistic enterprise operations layout, while preserving existing pages needed for AI demonstration.

#### Scenario: 用户浏览导航
- **WHEN** 用户查看侧边栏
- **THEN** 系统 SHALL 包含工作台、客户/租户、用户与权限、审批中心、发布中心、风险工单、审计日志等业务化入口

### Requirement: API 契约文档
The system SHALL document any newly added entities and endpoints in `knowledge-base/api-contract.md` so agents can reason from the knowledge base.

#### Scenario: Agent 修复新模块问题
- **WHEN** Agent 需要理解新增工单或活动流 API
- **THEN** Agent SHALL be able to find endpoint and response shape in the knowledge base

## REMOVED Requirements

### Requirement: 演示型命名
**Reason**: “验证后台”“演示场景”等命名削弱真实企业项目观感。
**Migration**: 改为业务产品名和业务上下文文案，例如“客户运营控制台”“Nexus 企业管理台”。
