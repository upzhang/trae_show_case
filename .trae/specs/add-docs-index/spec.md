# 生成文档目录汇总页 Spec

## Why
docs/ 下已有 9 篇独立文档，缺少一个统一的索引入口，AI 和开发者无法快速定位所需文档。

## What Changes
- 新增 `docs/index.md`，作为文档目录汇总页
- 汇总各文档的核心内容摘要，方便快速导航
- 将各文档末尾的 ❓待确认问题集中到 index.md，并基于演示项目性质自行判断，仅保留确实无法判断的问题

## Impact
- Affected specs: 无
- Affected code: `docs/index.md`（新增）

## ADDED Requirements
### Requirement: 文档索引页
系统 SHALL 在 docs/ 目录下提供 index.md 作为文档导航入口。

#### Scenario: 用户打开 index.md
- **WHEN** 用户浏览 docs/index.md
- **THEN** 可以看到所有 9 篇文档的列表、摘要和快速跳转链接

#### Scenario: AI 查找特定文档
- **WHEN** AI 需要了解项目某方面信息
- **THEN** 可以通过 index.md 快速定位到对应文档

### Requirement: 待确认问题集中管理
系统 SHALL 将各文档的待确认问题集中到 index.md，自行判断演示项目性质的问题，仅保留确实无法判断的问题。

#### Scenario: 演示项目性质的问题
- **WHEN** 问题可基于"这是一个演示/验证项目"的前提自行判断
- **THEN** 给出判断结论而非提问
