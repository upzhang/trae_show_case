# Tasks

- [x] Task 1: 更新 README.md 项目简介
  - 体现代码量（30,000+ 行）、功能模块数（20 个页面）、测试覆盖（355 个用例）
  - 列出完整模块结构（工作区、运营、财务、集成、系统五大分组）
  - 更新快速开始、测试命令
  - 体现 RBAC 五角色体系、知识库、验证清单等企业特征

- [x] Task 2: 启动前端开发服务器并进行浏览器 UI 测试
  - 启动 `pnpm dev:api` 和 `pnpm dev:web`
  - 使用浏览器自动化工具依次访问 20 个页面，验证：
    - 页面可正常渲染（无白屏/报错）
    - 数据正常加载（表格/卡片有内容）
    - 交互功能可用（Modal 打开/关闭、筛选、搜索）
  - 切换不同角色用户，验证权限控制的 UI 表现
  - 修复了 9 个页面的空值安全问题（API 返回 undefined 导致白屏）

- [x] Task 3: 编写页面演示建议流程
  - 按"建立企业项目认知"的逻辑设计导航顺序
  - 从工作台总览开始，逐步展示各模块
  - 每个页面标注演示要点（展示什么、说明什么）
  - 输出为 `.trae/specs/demo-and-readme-update/page-demo-flow.md`

- [x] Task 4: 精简 Trae 功能演示流程（5-10 分钟）
  - 回顾 `verification/trae-enterprise-checklist.md` 的 6 大类验证能力
  - 回顾 `verification/sample-prompts.md` 的 6 个示例任务
  - 精选 3-4 个最能体现 Trae 企业能力的演示场景
  - 每个场景包含：操作步骤、预期结果、演示时长
  - 输出为 `.trae/specs/demo-and-readme-update/trae-demo-flow.md`

# Task Dependencies
- Task 2 依赖 Task 1（先更新 README 再测试）
- Task 3 依赖 Task 2（测试通过后才有页面截图/验证结果做参考）
- Task 4 独立，可并行
