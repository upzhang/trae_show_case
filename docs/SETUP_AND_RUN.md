# SETUP_AND_RUN — 环境搭建与运行

## 前置依赖

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | ≥ 20 | 运行时（CI 中 legacy-node-check 用 18，但主流程用 20） |
| pnpm | 10.11.0 | 包管理器（项目已锁定版本） |

## 快速开始

```bash
# 1. 克隆项目
git clone <repo-url>
cd trae-enterprise-validation-demo

# 2. 安装依赖
pnpm install

# 3. 启动后端 API 服务（端口 4100）
pnpm dev:api

# 4. 新开终端，启动前端开发服务器（端口 5173）
pnpm dev:web

# 5. 浏览器访问
open http://localhost:5173
```

## 环境变量

| 变量 | 默认值 | 用途 | 必需 |
|------|--------|------|------|
| PORT | 4100 | 后端 API 服务端口 | 否 |
| NODE_ENV | development | 运行环境（development / production） | 否 |

> 当前项目无其他环境变量。所有数据为内存存储，无需数据库连接字符串。

## 完整命令清单

### 开发

```bash
pnpm dev:api          # 启动后端（tsx watch，热重载）
pnpm dev:web          # 启动前端（Vite dev server，HMR）
```

### 构建

```bash
pnpm build            # 全量构建（typecheck + vite build）
pnpm typecheck        # 全量 TypeScript 类型检查
```

### 测试

```bash
pnpm test             # 运行所有测试（shared + api + tests/api）
pnpm test:api         # 仅运行 API 集成测试
pnpm test:e2e         # 运行 E2E 测试（需先启动前后端）
```

### 代码质量

```bash
pnpm lint             # 全量 lint（当前仅为 tsc --noEmit）
```

### 单独包命令

```bash
# 后端
pnpm --filter api dev           # 启动后端
pnpm --filter api typecheck     # 后端类型检查

# 前端
pnpm --filter web-admin dev     # 启动前端
pnpm --filter web-admin build   # 前端构建
pnpm --filter web-admin preview # 预览构建产物

# 共享包
pnpm --filter @trae/shared test # 运行 RBAC 单元测试
```

## 项目结构（Monorepo）

```
trae-enterprise-validation-demo/
├── apps/api/          # 后端 Express API（端口 4100）
├── apps/web-admin/    # 前端 React SPA（端口 5173）
├── packages/shared/   # 共享类型和 RBAC 逻辑
├── packages/config/   # 共享 ESLint 配置
└── tests/
    ├── api/           # API 集成测试（Vitest + Supertest）
    └── e2e/           # E2E 测试（Playwright）
```

## 本地开发说明

### 后端
- 入口：`apps/api/src/server.ts`
- 使用 `tsx watch` 实现文件变更自动重启
- 所有数据为内存存储，重启后重置为种子数据
- 鉴权通过请求头 `x-user-id` 传递用户 ID

### 前端
- 入口：`apps/web-admin/src/main.tsx`
- Vite 开发服务器自动代理 `/api` 请求到 `http://localhost:4100`
- 用户切换通过页面顶部的下拉框或邮箱输入实现
- 会话信息存储在 `localStorage` 中

### 测试
- API 测试使用 `supertest` 直接调用 Express app（无需启动服务器）
- 每个测试前通过 `resetStore()` 重置数据
- E2E 测试需要前后端均已启动

## CI/CD

CI 配置位于 `.github/workflows/ci.yml`，包含两个 job：

1. **build-and-test**：Node 20 + pnpm 9，执行 install → typecheck → test → build
2. **legacy-node-check**（⚠️ 预置缺陷 6）：Node 18 直接运行 TS 文件，预期会失败

触发条件：push/PR 到 main 分支。

## 常见问题

### Q: 启动报错 "Cannot find module @trae/shared"
A: 先运行 `pnpm install`，确保 workspace 依赖正确链接。

### Q: 前端 API 请求 404
A: 确保后端已启动在 4100 端口，Vite proxy 配置正确。

### Q: 测试失败
A: 部分测试预期会失败（预置缺陷验证用例），检查测试名称中是否包含 "known issue"。

### Q: 如何重置数据？
A: 重启后端服务即可，所有数据从种子文件重新加载。

## ❓待确认

- 是否有 Docker 部署方案？
- 是否有生产环境构建和部署流程？
- 是否需要配置 HTTPS 本地开发证书？
- E2E 测试是否需要在 CI 中运行（当前 smoke.spec.ts 注释提到"在 CI 环境下若不稳定可跳过"）？
