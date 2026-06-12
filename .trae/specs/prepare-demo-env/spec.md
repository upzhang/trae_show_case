# 演示环境准备 + 场景 4 截图输出 Spec

## Why
为场景 2 准备初始状态（随机删除 15 个 API 测试用例），执行场景 4 黑盒测试并输出截图到文件，场景 3 结果文件加时间戳。

## What Changes
- 场景 2：从 tests/api/ 下随机删除 15 个测试用例（it 块），确保删除后剩余测试仍能通过
- 场景 3：`showcase/result_api_test.md` 重命名为带时间戳的文件名
- 场景 4：启动服务，用 browser_use agent 执行 12 步黑盒测试，截图 + 操作说明输出到 `showcase/result_blackbox_test_<timestamp>.md`

## Impact
- Affected specs: verify-showcase-scenarios
- Affected code: tests/api/*.test.ts, showcase/result_api_test.md
