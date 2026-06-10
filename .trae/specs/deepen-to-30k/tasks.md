# 深化至 30,000 行 — 任务列表

## 目标
- 当前 TS/TSX：16,213 行
- 目标 TS/TSX：30,000+ 行
- 增量：~14,000 行

---

## 任务块 A — 前端组件库（~5,000 行）

### [ ] Task A.1: 基础展示组件
- **估算代码量**: 2,000 行
- **文件清单**:
  - `components/Button.tsx` (~120 行)：primary/secondary/danger/ghost/link 变体，sm/md/lg 尺寸，loading/disabled 状态
  - `components/Card.tsx` (~100 行)：Card + CardHeader + CardBody + CardFooter 组合
  - `components/Badge.tsx` (~80 行)：success/warning/danger/info/default 状态色
  - `components/Alert.tsx` (~120 行)：info/success/warning/error 四种，可关闭
  - `components/EmptyState.tsx` (~80 行)：图标 + 文字 + 操作按钮
  - `components/StatCard.tsx` (~100 行)：数值 + 标签 + 趋势箭头 + 颜色
  - `components/Tag.tsx` (~80 行)：可关闭标签，多色
  - `components/Avatar.tsx` (~80 行)：首字母头像，自动配色
  - `components/PageHeader.tsx` (~80 行)：标题 + 描述 + 右侧操作区
  - `components/Icon.tsx` (~200 行)：20+ SVG 图标（check/x/warning/arrow/trash/edit/plus/search/filter/download/refresh/user/settings/bell/clock/calendar/chart/star/heart/lock/unlock）
  - `components/Spinner.tsx` (~60 行)：加载动画
  - `components/Tooltip.tsx` (~80 行)：悬浮提示
  - `components/ProgressBar.tsx` (~80 行)：进度条，支持颜色和百分比
  - `components/Divider.tsx` (~40 行)：分割线
  - `components/Breadcrumb.tsx` (~80 行)：面包屑导航
  - `components/StatusDot.tsx` (~60 行)：状态指示灯
  - `components/CopyButton.tsx` (~60 行)：一键复制
  - `components/ConfirmDialog.tsx` (~100 行)：确认弹窗
  - `components/SearchInput.tsx` (~80 行)：带防抖的搜索输入框
  - `components/FilterBar.tsx` (~120 行)：筛选条件栏

### [ ] Task A.2: 表单与数据展示组件
- **估算代码量**: 1,800 行
- **文件清单**:
  - `components/Input.tsx` (~120 行)：label + helper + error 状态
  - `components/Textarea.tsx` (~100 行)：多行输入
  - `components/Select.tsx` (~120 行)：下拉选择
  - `components/Checkbox.tsx` (~80 行)：复选框
  - `components/Radio.tsx` (~80 行)：单选按钮组
  - `components/Toggle.tsx` (~80 行)：开关切换
  - `components/FormField.tsx` (~100 行)：表单字段容器（label + error + helper）
  - `components/Table.tsx` (~300 行)：通用表格，列定义、排序、空状态、行点击
  - `components/Pagination.tsx` (~150 行)：分页导航，页码 + 总数 + 每页条数
  - `components/Modal.tsx` (~200 行)：模态框，title/body/footer，ESC 关闭，背景点击关闭
  - `components/Tabs.tsx` (~120 行)：选项卡切换
  - `components/Dropdown.tsx` (~150 行)：下拉菜单，支持分隔线和禁用项
  - `components/DateRangePicker.tsx` (~200 行)：日期范围选择，7/30/90 天快捷

### [ ] Task A.3: 图表组件
- **估算代码量**: 1,200 行
- **文件清单**:
  - `components/BarChart.tsx` (~350 行)：SVG 条形图，多系列，坐标轴，图例
  - `components/LineChart.tsx` (~350 行)：SVG 折线图，多系列，填充区域
  - `components/DonutChart.tsx` (~250 行)：SVG 环形图，比例分布
  - `components/Sparkline.tsx` (~150 行)：小型趋势图
  - `components/ChartContainer.tsx` (~100 行)：图表容器（标题 + 图例 + 响应式）

---

## 任务块 B — 新增模块：Metrics + Roles（~3,000 行）

### [ ] Task B.1: Metrics 后端
- **估算代码量**: 800 行
- **文件清单**:
  - `routes/metrics.ts` (~350 行)：/api/metrics/overview、/trends、/health、/releases、/approvals
  - `services/metric-service.ts` (~350 行)：指标计算、趋势数据生成、健康分布统计
  - 扩展 `store.ts` (~100 行)：新增 MetricSnapshot 仓库和 seed 数据

### [ ] Task B.2: Roles 后端
- **估算代码量**: 600 行
- **文件清单**:
  - `routes/roles.ts` (~300 行)：/api/roles CRUD + /api/roles/:id/clone + /api/permissions
  - `services/role-service.ts` (~200 行)：角色 CRUD、克隆、权限码管理
  - 扩展 `store.ts` (~100 行)：增强 RoleDefinitionRepository

### [ ] Task B.3: Metrics + Roles 前端页面
- **估算代码量**: 1,000 行
- **文件清单**:
  - `pages/MetricsPage.tsx` (~500 行)：总览指标卡 + 趋势图 + 健康分布 + 发布/审批统计
  - `pages/RolesPage.tsx` (~500 行)：角色列表 + 创建/编辑弹窗 + 权限矩阵多选 + 克隆

### [ ] Task B.4: Metrics + Roles 测试
- **估算代码量**: 600 行
- **文件清单**:
  - `tests/api/metrics.test.ts` (~300 行)：overview/trends/health 接口测试
  - `tests/api/roles.test.ts` (~300 行)：CRUD + clone + permissions 测试

---

## 任务块 C — 深化现有页面（~3,000 行）

### [ ] Task C.1: 核心页面深化（8 个页面）
- **估算代码量**: 1,600 行（每个 +200 行）
- **页面清单**:
  - `TenantsPage.tsx`：增加租户详情面板（健康分、订阅状态、成员数、风险数）、状态筛选
  - `UsersPage.tsx`：增加用户详情（角色、团队、最近活动）、角色筛选、批量操作
  - `ApprovalsPage.tsx`：增加审批详情（请求内容、审批链、时间线）、状态筛选
  - `ReleasesPage.tsx`：增加发布详情（变更内容、审批记录、回滚历史）、环境筛选
  - `AuditLogsPage.tsx`：增加日志详情（变更前后对比）、操作类型筛选、时间范围
  - `SupportRisksPage.tsx`：增加风险详情（影响范围、缓解措施）、严重级别筛选
  - `DashboardPage.tsx`：增加更多指标卡、趋势迷你图、最近活动时间线
  - `TicketsPage.tsx`：增加工单详情面板（状态流转时间线、评论区）、优先级/状态筛选

### [ ] Task C.2: 扩展页面深化（8 个页面）
- **估算代码量**: 1,400 行（每个 +175 行）
- **页面清单**:
  - `WebhooksPage.tsx`：增加投递日志详情、事件类型筛选、签名密钥展示
  - `TokensPage.tsx`：增加使用统计面板、过期提醒、权限范围说明
  - `TeamsPage.tsx`：增加成员角色管理面板、团队详情
  - `IntegrationsPage.tsx`：增加集成配置面板、同步历史、连接状态详情
  - `FeaturesPage.tsx`：增加变更历史时间线、租户覆盖列表、灰度比例滑块
  - `SubscriptionsPage.tsx`：增加订阅详情（计费周期、发票历史）、升降级确认弹窗
  - `InvoicesPage.tsx`：增加发票详情（明细行、付款记录）、状态筛选
  - `NotificationsPage.tsx`：增加通知详情、类型筛选、偏好设置面板

---

## 任务块 D — 增强服务层（~2,000 行）

### [ ] Task D.1: 核心服务增强（8 个服务）
- **估算代码量**: 1,200 行（每个 +150 行）
- **服务清单**:
  - `tenant-service.ts`：增加健康分计算、行业统计、活跃度分析
  - `user-service.ts`：增加角色变更审计、最近活动查询、批量导入
  - `approval-service.ts`：增加审批链构建、超时自动处理、统计汇总
  - `release-service.ts`：增加部署历史、回滚记录、环境对比
  - `audit-service.ts`：增加变更对比、导出格式化、统计聚合
  - `support-risk-service.ts`：增加风险评分、缓解建议、趋势分析
  - `ticket-service.ts`：增加 SLA 计算、自动分配、满意度统计
  - `notification-service.ts`：增加批量发送、定时调度、模板管理

### [ ] Task D.2: 扩展服务增强（8 个服务）
- **估算代码量**: 800 行（每个 +100 行）
- **服务清单**:
  - `webhook-service.ts`：增加重试策略、签名验证、事件过滤
  - `token-service.ts`：增加权限校验、使用统计、过期预警
  - `team-service.ts`：增加成员统计、权限继承、层级管理
  - `integration-service.ts`：增加连接测试、同步调度、状态监控
  - `feature-service.ts`：增加灰度计算、依赖检查、回滚策略
  - `subscription-service.ts`：增加续费提醒、用量统计、升降级校验
  - `invoice-service.ts`：增加税金计算、付款匹配、逾期处理
  - `activity-service.ts`：增加聚合统计、趋势分析、实时过滤

---

## 任务块 E — 扩展测试（~1,000 行）

### [ ] Task E.1: 补充测试用例
- **估算代码量**: 1,000 行
- **文件清单**:
  - 扩展现有 11 个测试文件（每个 +50-100 行）：补充边界用例、异常路径、并发场景
  - 新增 `tests/api/services.test.ts` (~200 行)：服务层单元测试

---

## 任务依赖

```
Task A.1 ──> Task A.2 ──> Task A.3
                │
                └──> Task C.1 + C.2（页面深化依赖组件库）
                
Task B.1 + B.2（后端独立，可并行）
Task B.3（依赖 A.1 + A.2 + B.1 + B.2）
Task B.4（依赖 B.1 + B.2）

Task D.1 + D.2（独立，可并行）

Task E.1（依赖所有任务完成）
```

## 实施顺序

1. **Task A.1 + A.2**（组件库基础，可并行）→ ~3,800 行
2. **Task A.3**（图表组件）→ ~1,200 行
3. **Task B.1 + B.2**（Metrics + Roles 后端，可并行）→ ~1,400 行
4. **Task B.3**（Metrics + Roles 前端）→ ~1,000 行
5. **Task C.1 + C.2**（页面深化，可并行）→ ~3,000 行
6. **Task D.1 + D.2**（服务增强，可并行）→ ~2,000 行
7. **Task B.4**（新模块测试）→ ~600 行
8. **Task E.1**（测试扩展）→ ~1,000 行

总计增量：~14,000 行，最终目标 30,000+ 行
