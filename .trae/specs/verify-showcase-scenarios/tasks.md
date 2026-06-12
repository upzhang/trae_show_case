# Tasks

- [x] Task 1: docs/ 文件名小写化
  - [x] 将 docs/ 下所有大写文件名改为小写（PROJECT_OVERVIEW.md → project_overview.md 等）
  - [x] 更新 docs/0-index.md 中的内部链接
  - [x] 更新 showcase/my-showcase.md 中引用 docs/ 文件名的部分

- [x] Task 2: 验证场景 2 — 测试用例补全
  - [x] 确认 basic.test.ts 当前状态包含全部 12 个 describe 块
  - [x] 删除 3 个 describe 块（approvals、releases、users roles）
  - [x] 运行 pnpm test 确认剩余测试通过（351/351）
  - [x] 回退 basic.test.ts 到原始状态

- [x] Task 3: 验证场景 3 — 一键执行所有 API 测试
  - [x] 运行 pnpm test 确认所有 13 个测试文件可正常执行（355/355）
  - [x] 确认输出可解析为 PASS/FAIL 汇总

- [x] Task 4: 验证场景 4 — 审批中心页面黑盒测试
  - [x] 启动 API 和 Web 服务
  - [x] 使用 browser_use agent 访问审批中心页面
  - [x] 验证 Tab 切换、搜索、发起审批、通过/拒绝、详情 Modal 功能正常（14 步全部成功）
  - [x] 更新 my-showcase.md 中页面功能清单和验证项以匹配实际页面

# Task Dependencies
- Task 1 无依赖，首先执行
- Task 2、3、4 可并行执行
