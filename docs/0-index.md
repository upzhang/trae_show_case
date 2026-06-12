# 文档索引

> Nexus 客户运营管理台 — 项目文档导航。本目录包含 9 篇文档，覆盖项目总览、架构、编码规范、API、数据模型等，供 AI 和开发者快速查阅。

## 文档列表

| # | 文档 | 用途 | 何时查阅 |
|---|------|------|----------|
| 1 | [project_overview.md](./project_overview.md) | 项目定位、功能模块、技术栈、关键术语 | 了解项目全貌 |
| 2 | [architecture.md](./architecture.md) | 架构图、分层结构、数据流、设计决策、已知缺陷 | 理解系统设计 |
| 3 | [directory_structure.md](./directory_structure.md) | 逐目录说明，核心/业务/工具分类 | 定位代码位置 |
| 4 | [coding_standards.md](./coding_standards.md) | 命名约定、代码风格、错误处理、测试规范 | 写新代码时对齐风格 |
| 5 | [api_reference.md](./api_reference.md) | 全部 20+ 模块的接口路径、权限、入参出参 | 调用或新增 API |
| 6 | [data_model.md](./data_model.md) | ER 图、实体字段、枚举值、缓存结构 | 理解数据结构 |
| 7 | [setup_and_run.md](./setup_and_run.md) | 环境依赖、完整命令、CI/CD、常见问题 | 搭建环境或排查问题 |
| 8 | [ai_coding_guide.md](./ai_coding_guide.md) | 红线禁区、标准做法、测试要求、已知坑点 | AI 辅助编码前必读 |
| 9 | [glossary.md](./glossary.md) | 业务术语、技术术语、缩写、命名约定 | 理解上下文 |

## 快速导航

### 我想了解项目是干什么的
→ [project_overview.md](./project_overview.md)

### 我想知道系统怎么设计的
→ [architecture.md](./architecture.md)（含 Mermaid 架构图和数据流图）

### 我想找某个文件/模块在哪
→ [directory_structure.md](./directory_structure.md)

### 我要写新代码，风格怎么对齐
→ [coding_standards.md](./coding_standards.md)

### 我要调接口或新增接口
→ [api_reference.md](./api_reference.md)

### 我要改数据结构
→ [data_model.md](./data_model.md)（含 Mermaid ER 图）

### 我搭环境跑不起来
→ [setup_and_run.md](./setup_and_run.md)

### 我是 AI，要改代码
→ **必须先读** [ai_coding_guide.md](./ai_coding_guide.md)，再按需查阅其他文档

### 我遇到不认识的术语
→ [glossary.md](./glossary.md)

## 项目性质说明

本项目是一个**演示/验证项目**，用于 AI Coding 场景的测试和验证。基于此前提，以下事项已自行判断，不再作为待确认问题：

| 问题 | 判断结论 |
|------|----------|
| 是否接入真实数据库？ | 否，演示项目使用内存存储即可 |
| 是否有生产部署方案？ | 否，演示项目仅本地开发 |
| 种子数据是否为真实业务数据？ | 否，全部为模拟数据 |
| 是否需要状态管理库？ | 否，当前组件内 useState 已够用 |
| 是否需要 API 版本化？ | 否，演示项目无需 |
| 是否有 commit message 规范？ | 暂无，演示项目不做强制要求 |
| 是否有 Prettier 配置？ | 暂无，演示项目不做强制要求 |
| 是否有代码覆盖率目标？ | 暂无 |
| 是否有 OpenAPI/Swagger 文件？ | 暂无 |
| 是否需要 HTTPS 本地证书？ | 否 |
| 是否有 Docker 部署方案？ | 否 |
| 是否有代码审查流程？ | 否，演示项目 |
| 是否有分支管理策略？ | 否，演示项目 |
| 金额单位是什么？ | 人民币（CNY），从种子数据上下文推断 |
| `canceled`/`cancelled` 拼写不一致 | 代码缺陷，应统一为 `canceled`（美式拼写） |
| 租户名称中英文混合 | 模拟数据，无特殊含义 |

