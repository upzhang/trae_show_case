# 深化至 30,000 行 — 补全方案

## Why
当前项目 TS/TSX 代码 16,213 行，距 30,000 行目标差 ~14,000 行。虽然路由/服务/页面/测试数量已达标，但代码偏薄（页面平均 225 行，服务平均 80 行），且**前端组件库完全缺失**（0 个公共组件）。需要在不破坏现有功能的前提下，通过组件库建设、页面深化、新增模块、服务增强四个方向补全代码量。

## What Changes
- **新增前端组件库**（~5,000 行）：Button、Card、Table、Modal、Badge、StatCard、Pagination、Tabs、Alert、EmptyState、Tag、Avatar、PageHeader、Dropdown、Input、Select、Textarea、Checkbox、Icon 等 20+ 组件
- **深化现有 16 个页面**（~3,000 行）：每个页面增加详情视图、筛选面板、批量操作、弹窗表单
- **新增 2 个模块**（~3,000 行）：Metrics 数据分析 + Roles 自定义角色管理（后端路由/服务 + 前端页面 + 测试）
- **增强服务层**（~2,000 行）：补充业务逻辑、状态机、数据校验
- **扩展测试**（~1,000 行）：补充边界用例和异常路径

## Impact
- Affected specs: scale-to-30k-lines（补全未完成部分）
- Affected code: apps/web-admin/src/components/（新建）、apps/web-admin/src/pages/（深化）、apps/api/src/routes/（新增 2 个）、apps/api/src/services/（新增 2 个 + 深化）、tests/（扩展）

## ADDED Requirements

### Requirement: 前端组件库
系统 SHALL 提供 20+ 个可复用的 React 组件，所有页面 SHALL 使用公共组件替代内联实现。

#### Scenario: 组件覆盖
- **WHEN** 检查 apps/web-admin/src/components/ 目录
- **THEN** 至少包含 20 个独立 .tsx 组件文件
- **THEN** 每个组件有完整的 Props 类型定义

#### Scenario: 页面使用组件
- **WHEN** 检查任意页面文件
- **THEN** 至少使用 3 个以上公共组件

### Requirement: Metrics 数据分析模块
系统 SHALL 提供平台级数据分析功能，包括总览指标、趋势图数据、健康分布。

#### Scenario: 总览指标
- **WHEN** GET /api/metrics/overview
- **THEN** 返回 ≥ 8 个指标字段（活跃租户、总用户、MRR、审批通过率等）

#### Scenario: 趋势数据
- **WHEN** GET /api/metrics/trends?range=30d
- **THEN** 返回按时间排序的数据点数组

### Requirement: Roles 自定义角色管理
系统 SHALL 支持自定义角色的创建、编辑、克隆、删除，以及权限矩阵的可视化管理。

#### Scenario: 角色 CRUD
- **WHEN** POST /api/roles 创建新角色
- **THEN** 返回包含 id、name、permissions 的角色对象

#### Scenario: 权限矩阵
- **WHEN** GET /api/permissions
- **THEN** 返回所有可用权限码列表

### Requirement: 页面深化
每个现有页面 SHALL 增加详情视图、筛选功能和更丰富的数据展示。

#### Scenario: 列表页筛选
- **WHEN** 访问任意列表页面
- **THEN** 页面包含状态/类型筛选控件
- **THEN** 筛选后列表数据正确过滤

### Requirement: 服务层增强
每个服务 SHALL 包含完整的业务逻辑，包括数据校验、状态流转和边界处理。

#### Scenario: 服务方法完整性
- **WHEN** 检查任意 service 文件
- **THEN** 包含 ≥ 5 个导出方法
- **THEN** 方法有明确的参数类型和返回值类型
