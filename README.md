# Trae 企业能力验证环境

这是一套用于验证 Trae 企业研发能力的最小全栈 SaaS 后台示例环境。

## 包含内容

- `apps/web-admin`：前端后台管理台
- `apps/api`：后端 API 服务
- `packages/shared`：共享类型与 RBAC 模型
- `knowledge-base`：企业知识库
- `.trae`：Trae 项目规则、命令和 MCP 配置模板
- `verification`：验证清单与示例任务

## 目标

用于验证以下能力：

- 企业知识库理解与引用
- 前后端跨层联动
- 权限控制与协作边界
- 测试生成与修复
- CI/CD 理解与修复
- 规范遵循与代码审查

## 快速开始

```bash
pnpm install
pnpm dev:api
pnpm dev:web
```

## 测试

```bash
pnpm test
pnpm test:api
```

## 说明

项目预置了少量可修复问题，便于在 Trae 中执行企业能力验证任务。
