# Tasks

- [x] Task 1: 创建产品文档 `prd/product-doc.md`
  - 基于 README、types.ts、rbac.ts、App.tsx、知识库文档，梳理产品概述、技术架构、功能模块、RBAC 体系、数据模型、API 概览

- [x] Task 2: 创建用户手册 `prd/user-manual.md`
  - 基于 page-demo-flow.md、App.tsx 侧边栏结构、各页面代码，编写快速入门、逐页操作指南、角色权限对照、常见问题

- [x] Task 3: 创建测试用例 `prd/test-cases.md`
  - 基于用户手册，为每个页面编写测试用例，覆盖渲染、交互、权限、边界场景

- [x] Task 4: 执行黑盒测试并输出结果 `prd/test-results.md`
  - 使用浏览器自动化工具，按测试用例逐条执行，记录通过/失败/截图

- [x] Task 5: 修复测试中发现的 Bug
  - 根据测试结果修复代码中的 Bug

- [x] Task 6: 回归测试
  - 修复后重新执行黑盒测试，确保所有用例通过，更新 test-results.md

# Task Dependencies
- Task 2 依赖 Task 1（用户手册引用产品文档中的概念）
- Task 3 依赖 Task 2（测试用例基于用户手册编写）
- Task 4 依赖 Task 3（按测试用例执行）
- Task 5 依赖 Task 4（根据测试结果修复）
- Task 6 依赖 Task 5（修复后回归）
