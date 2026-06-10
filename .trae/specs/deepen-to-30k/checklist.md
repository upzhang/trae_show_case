# 深化至 30,000 行 — 验证清单

## 代码量
- [ ] TS/TSX 总行数 ≥ 30,000 行
- [ ] 单文件不超过 400 行

## 组件库
- [ ] apps/web-admin/src/components/ 目录下 ≥ 20 个 .tsx 文件
- [ ] 所有页面至少使用 3 个公共组件
- [ ] 组件有完整 Props 类型定义

## 新增模块
- [ ] Metrics 路由 / 服务 / 页面 / 测试 完整
- [ ] Roles 路由 / 服务 / 页面 / 测试 完整
- [ ] GET /api/metrics/overview 返回 ≥ 8 个指标
- [ ] GET /api/roles 返回角色列表
- [ ] GET /api/permissions 返回权限码列表

## 页面深化
- [ ] 16 个页面均有详情视图或筛选功能
- [ ] 列表页支持分页和状态筛选
- [ ] 所有页面正常渲染无白屏

## 服务增强
- [ ] 16 个服务文件均 ≥ 80 行
- [ ] 服务方法有明确类型定义

## 测试
- [ ] pnpm test 全部通过
- [ ] 测试文件 ≥ 13 个（现有 11 + 新增 2）
- [ ] 测试用例 ≥ 250 个

## 类型检查
- [ ] pnpm typecheck 无错误

## 启动验证
- [ ] pnpm dev:api 正常启动
- [ ] pnpm dev:web 正常启动
- [ ] GET /api/health 返回 200
