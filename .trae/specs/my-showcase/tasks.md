# Tasks

- [x] Task 1: 场景 1 — 项目理解能力演示文档
  - [x] 确认标签 `showcase1-项目理解前` 存在
  - [x] 编写场景 1 演示流程（基于 README.md 提示词，回退到标签 → 执行 → 验证 docs/ 生成）
  - [x] 输出到 showcase/my-showcase.md

- [x] Task 2: 场景 2 — 测试用例补全演示（含初始状态准备）
  - [x] 准备初始状态：删除 tests/api/basic.test.ts 中 3 个 describe 块（approvals、releases、users roles），提交到 git（commit cce6aee）
  - [x] 编写场景 2 演示流程（提示词：补全被删除的测试用例）
  - [x] 输出到 showcase/my-showcase.md
  - [x] 回退 basic.test.ts 到原始状态（git revert cce6aee → 1375be5）

- [x] Task 3: 场景 3 — 一键执行所有 API 测试用例
  - [x] 编写场景 3 演示流程（提示词：执行所有 API 测试并汇总结果）
  - [x] 输出到 showcase/my-showcase.md

- [x] Task 4: 场景 4 — 单页面深度黑盒测试
  - [x] 选定审批中心页面（/approvals）作为测试目标
  - [x] 编写场景 4 演示流程（含操作序列：加载 → 切换 Tab → 点击审批 → 填写表单 → 提交，每次停留 2s 截图）
  - [x] 输出到 showcase/my-showcase.md

- [x] Task 5: 场景 5 — 多模块漏洞修复演示
  - [x] 设计一个涉及前后端+权限的多模块 bug（审批创建权限校验缺陷：后端 approval:view 应为 approval:write，前端表单无权限检查）
  - [x] 编写场景 5 演示流程（含 bug 描述、截图指引、预期修复范围）
  - [x] 输出到 showcase/my-showcase.md

# Task Dependencies
- Task 1 无依赖，首先执行
- Task 2 依赖 Task 1（先写文档框架，再准备初始状态）
- Task 3、4、5 可并行执行
- Task 2 完成后需回退代码
