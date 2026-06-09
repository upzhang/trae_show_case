# Tasks

- [ ] Task 1: 梳理现有信息架构与数据模型
  - [ ] SubTask 1.1: 读取现有前端页面、API 路由、seed 数据和 shared 类型
  - [ ] SubTask 1.2: 标记哪些模块保留为预置缺陷演示点，避免提前修复
  - [ ] SubTask 1.3: 输出最小改造范围，避免过度重构

- [ ] Task 2: 丰富 shared 类型与内存数据
  - [ ] SubTask 2.1: 为 Tenant 增加行业、套餐、健康分、合同到期、CSM、席位、月活等字段
  - [ ] SubTask 2.2: 增加 SupportTicket/RiskItem 或等价工单风险类型
  - [ ] SubTask 2.3: 增加 ActivityEvent 或等价活动流类型
  - [ ] SubTask 2.4: 扩充 seed 数据，至少包含 3 个租户、5 个用户、4 条审批、4 条发布、5 条工单/风险、8 条活动

- [ ] Task 3: 补后端读取接口
  - [ ] SubTask 3.1: 增加租户画像数据返回字段
  - [ ] SubTask 3.2: 增加工单/风险队列查询接口
  - [ ] SubTask 3.3: 增加活动流查询接口
  - [ ] SubTask 3.4: 保持原有权限缺陷和 API 契约漂移缺陷不被意外修复

- [ ] Task 4: 重构前端真实业务体验
  - [ ] SubTask 4.1: 将导航改为客户运营语义：工作台、客户/租户、用户与权限、审批中心、发布中心、风险工单、审计日志
  - [ ] SubTask 4.2: 增强工作台指标卡、风险队列、最近动态和发布健康区块
  - [ ] SubTask 4.3: 增强租户/客户列表，展示套餐、健康分、合同、CSM、使用量
  - [ ] SubTask 4.4: 新增风险工单页面或在工作台中提供可见队列

- [ ] Task 5: 同步知识库与验证材料
  - [ ] SubTask 5.1: 更新 `knowledge-base/product-overview.md` 的产品定位
  - [ ] SubTask 5.2: 更新 `knowledge-base/api-contract.md` 的新增响应结构
  - [ ] SubTask 5.3: 更新 `knowledge-base/frontend-guidelines.md` 的页面信息架构
  - [ ] SubTask 5.4: 保持 `verification/known-issues.md` 中预置缺陷仍然成立

- [ ] Task 6: 验证与回归
  - [ ] SubTask 6.1: 运行 `pnpm typecheck`
  - [ ] SubTask 6.2: 运行 `pnpm test`
  - [ ] SubTask 6.3: 打开前端页面确认标题、导航、工作台和数据不再显得假大空

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3
- Task 5 depends on Task 2, Task 3 and Task 4
- Task 6 depends on Task 3, Task 4 and Task 5
