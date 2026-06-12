# My Showcase — 5 个 Trae 能力演示流程 Spec

## Why
精选演示流程.md 末尾定义了 4 个演示场景，用户补充了第 5 个（一键执行 API 测试），需要在 showcase 目录输出完整可执行的演示文档。

## What Changes
- 新增 `showcase/my-showcase.md`，包含 5 个演示流程
- 场景 2 需提前准备初始状态：删除 basic.test.ts 中部分测试用例
- 场景 3（新增）：一键执行所有 API 测试用例
- 场景 5 需构造一个多模块 bug

## Impact
- Affected specs: 无
- Affected code: `tests/api/basic.test.ts`（场景 2 初始状态准备，演示后回退）

## ADDED Requirements

### Requirement: 场景 1 — 项目理解能力演示
以标签 `showcase1-项目理解前` 为基准，演示 Trae 从零理解项目并生成全套文档。

#### Scenario: 项目理解
- **WHEN** 用户给出项目理解提示词
- **THEN** Trae 扫描全量项目，生成 docs/ 下全套文档

### Requirement: 场景 2 — 测试用例补全能力演示
先删除 basic.test.ts 中部分测试用例作为初始状态，演示 Trae 补全测试。

#### Scenario: 测试补全
- **WHEN** 用户要求 Trae 补全被删除的测试用例
- **THEN** Trae 读取剩余测试、路由文件、服务文件，生成与原有风格一致的测试

### Requirement: 场景 3 — 一键执行所有 API 测试用例
演示 Trae 一键运行全部 12 个测试文件，汇总结果。

#### Scenario: 一键执行测试
- **WHEN** 用户要求执行所有 API 测试
- **THEN** Trae 运行 pnpm test，汇总 PASS/FAIL 结果

### Requirement: 场景 4 — 单页面深度黑盒测试
对审批中心页面做深度黑盒测试，每次操作后停留 2 秒截图。

#### Scenario: 深度黑盒测试
- **WHEN** 用户要求对审批中心页面做深度黑盒测试
- **THEN** Trae 启动浏览器，依次操作并截图

### Requirement: 场景 5 — 多模块漏洞修复
构造一个涉及前后端+权限的 bug，Trae 根据截图修复。

#### Scenario: 漏洞修复
- **WHEN** 用户提供 bug 截图和描述
- **THEN** Trae 定位并修复所有相关代码
