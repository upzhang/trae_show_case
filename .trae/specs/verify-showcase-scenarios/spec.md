# 验证演示场景 2-4 + 文档文件名小写化 Spec

## Why
确保 showcase/my-showcase.md 中场景 2-4 的演示流程可以顺利执行，同时将 docs/ 目录下文件名统一为小写以符合项目规范。

## What Changes
- docs/ 下 10 个文件重命名为小写（如 PROJECT_OVERVIEW.md → project_overview.md）
- 更新 docs/0-INDEX.md 中的内部链接引用
- 更新 showcase/my-showcase.md 中引用 docs/ 文件名的部分
- 验证场景 2（测试补全）：确认 basic.test.ts 删除 3 个 describe 块后可被 Trae 补全
- 验证场景 3（一键执行测试）：确认 pnpm test 可运行并汇总 12 个文件结果
- 验证场景 4（黑盒测试）：确认审批中心页面可通过浏览器自动化操作并截图

## Impact
- Affected specs: my-showcase
- Affected code: docs/*.md, showcase/my-showcase.md, tests/api/basic.test.ts
