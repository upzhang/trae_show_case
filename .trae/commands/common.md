# 常用命令

以下命令在 `trae-enterprise-validation-demo` 目录下执行。

## 安装

```bash
pnpm install
```

## 开发

```bash
pnpm dev:api   # 启动后端 API（http://localhost:4100）
pnpm dev:web   # 启动前端（http://localhost:5173）
```

## 类型检查与构建

```bash
pnpm typecheck
pnpm build
```

## 测试

```bash
pnpm test
pnpm test:api
pnpm test:e2e  # 需先启动 API 与前端
```

## 目录浏览

- 知识库：`knowledge-base/`
- Trae 项目规则：`.trae/rules/`
- 验证清单：`verification/`
