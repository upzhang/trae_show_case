# 项目理解提示词

将以下提示词交给 Trae 执行，Trae 将自动分析代码仓与页面，生成完整的项目文档。

```
请深入分析本项目，完成以下任务：

1. 分析项目结构：理解 monorepo 架构（apps/api、apps/web-admin、packages/shared），
   梳理技术栈（Node.js/Express/React/Vite/TypeScript/pnpm workspace）

2. 分析数据模型：遍历 packages/shared/src/ 下的类型定义，
   梳理所有实体（Tenant、User、Role、Team、Approval、Release 等）及其关系

3. 分析 API 接口：遍历 apps/api/src/routes/ 下的所有路由文件，
   整理完整的 API 清单（方法、路径、参数、返回值）

4. 分析 RBAC 权限系统：理解 packages/shared/src/rbac.ts 中的角色定义和权限矩阵，
   以及 apps/api/src/middleware/rbac.ts 中的权限校验逻辑

5. 分析前端页面：遍历 apps/web-admin/src/pages/ 下的所有页面组件，
   理解每个页面的功能和路由

6. 启动项目（pnpm dev:api 和 pnpm dev:web），使用 browser_use agent 访问 http://localhost:5173，
   逐个浏览所有页面，理解实际交互流程

7. 基于以上分析，在 prd/ 目录下生成以下文档：
   - product-doc.md：产品概述、功能模块、用户角色、业务流程
   - api-doc.md：完整 API 接口文档（按模块分组，含请求/响应示例）
   - rbac-doc.md：RBAC 权限模型说明（角色定义、权限矩阵、校验流程）
   - data-model.md：数据模型文档（实体关系图、字段说明）
   - page-map.md：页面路由地图（路由→页面→功能→所需权限）

要求：文档内容准确、完整，基于实际代码而非猜测。
```
