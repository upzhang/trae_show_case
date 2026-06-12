# 执行精选演示流程并记录结果 Spec

## Why
精选演示流程.md 定义了 10 个 Trae 能力演示流程，需要在真实环境中逐个执行，验证每个流程的预期行为是否与实际相符，并将结果记录归档，确保演示文档的可信度和可复现性。

## What Changes
- 新增 `showcase/result.md`，记录每个流程的执行结果
- 每个流程执行前确保代码处于干净状态
- 每个流程执行后回退所有改动，避免影响后续流程

## Impact
- Affected specs: 无
- Affected code: 仅 `showcase/result.md`（新增），演示过程中的代码改动均回退

## ADDED Requirements

### Requirement: 演示流程执行与验证
系统 SHALL 按顺序执行 10 个演示流程，每个流程完成后记录验证结果，并回退代码。

#### Scenario: 流程执行成功
- **WHEN** 按精选演示流程.md 中的提示词向 Trae 发起请求
- **THEN** Trae 的行为与预期 Trae 行为一致
- **AND** 记录 PASS 及实际行为描述

#### Scenario: 流程执行与预期不符
- **WHEN** Trae 的行为与预期不一致
- **THEN** 记录 FAIL 及差异原因
- **AND** 给出改动建议

#### Scenario: 流程执行后回退
- **WHEN** 一个流程执行完毕
- **THEN** 回退该流程产生的所有代码改动（git checkout -- .）
- **AND** 确保下一个流程在干净代码上执行

### Requirement: 结果记录
系统 SHALL 将所有流程的验证结果写入 `showcase/result.md`。

#### Scenario: 结果文件结构
- **WHEN** 所有流程执行完毕
- **THEN** result.md 包含：
  - 每个流程的 PASS/FAIL 状态
  - 与预期是否相符
  - 不相符的原因
  - 改动建议
  - 演示过程改动和回退的文件列表
  - 汇总统计
