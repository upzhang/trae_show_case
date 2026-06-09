# 前端开发规范

## 技术栈

- React 18 + TypeScript
- Vite（构建与开发服务器）
- React Router（简单路由）
- 组件内状态（无 Redux/ Zustand 等）

## 目录

- `apps/web-admin/src/App.tsx` — 应用根与布局
- `apps/web-admin/src/pages/*.tsx` — 业务页面
- `apps/web-admin/src/lib/api.ts` — 所有 API 调用汇总
- `apps/web-admin/src/lib/session.ts` — 前端权限与会话

## 信息架构

- 侧边栏入口按客户运营语义组织：工作台、客户/租户、用户与权限、审批中心、发布中心、风险工单、审计日志。
- 工作台用于高密度运营概览，展示 ARR、活跃客户、待处理审批、风险工单、发布健康度、平均客户健康分、平台用户与审批总量。
- 工作台必须包含风险/工单队列、最近活动流、发布健康与最近审批，避免只展示纯数量统计。
- 客户/租户页展示业务画像字段：行业、套餐、健康分、合同到期、CSM、席位、月活、ARR。
- 风险工单页展示标题、客户、严重级别、状态、SLA、负责人和影响面。
- 用户与权限、审批中心、发布中心、审计日志保留原有验证页面，便于复现预置缺陷。

## 样式规范

- 使用 `src/styles.css`，无需引入 CSS-in-JS
- 以类名 `.sidebar`, `.card`, `.badge`, `.stat-grid` 等作为统一风格
- 按钮风格：主色 `.primary`（蓝），危险 `.danger`（红），默认中性

## 权限展示规范

- 按钮与入口使用 `apps/web-admin/src/lib/session.ts` 中的 `can()` 判断
- 权限不足时**隐藏按钮或输入**，不依赖前端判断做强安全约束（后端为最终校验）
- 表格列展示逻辑与后端权限保持一致（例如"审计日志页"没有 `audit:view` 时应展示空态）

## API 调用规范

- 使用 `apps/web-admin/src/lib/api.ts` 中的 `api.xxx` 方法，统一注入 `x-user-id`
- 成功/失败统一在页面处理（简单场景可使用 `window.alert` 或 `console.error`）
- 若 API 响应字段与 `packages/shared/types.ts` 不一致，优先以 shared 为准并修复后端
- 风险工单和活动流统一通过 `api.listSupportRisks()` 与 `api.listActivityEvents()` 访问，不在页面中拼 URL

## 组件约束

- 页面组件应独立，避免跨页面依赖
- 每个页面按需加载数据（`useEffect`），不要在根组件预取
- 仅在需要写操作的页面校验 `can()`，避免误触
