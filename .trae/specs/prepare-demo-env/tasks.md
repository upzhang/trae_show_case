# Tasks

- [x] Task 1: 场景 3 结果文件加时间戳
  - [x] 将 showcase/result_api_test.md 重命名为 showcase/result_api_test_20260612_1254.md

- [x] Task 2: 场景 2 初始状态准备 — 随机删除 15 个 API 测试用例
  - [x] 读取 tests/api/ 下所有测试文件，统计 it() 块分布
  - [x] 从不同文件中随机选择 15 个 it() 块删除（分散在不同 describe 中）
  - [x] 运行 pnpm test 确认删除后剩余测试通过
  - [x] 提交删除后的状态，记录 commit hash 以便演示时 revert

- [x] Task 3: 场景 4 黑盒测试截图输出
  - [x] 启动 API 和 Web 服务
  - [x] 使用 browser_use agent 按 testcase.md 中 12 步执行
  - [x] 每步截图保存到 showcase/ 目录
  - [x] 输出 12 张截图 + 操作说明到 showcase/result_blackbox_test_20260612_1521.md

# Task Dependencies
- Task 1 无依赖
- Task 2 无依赖
- Task 3 依赖 Task 2 完成后的服务启动
