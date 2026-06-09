# 故障与事件处理手册

## 常见场景

### 1. 权限问题导致前端按钮展示异常

- 检查 `apps/web-admin/src/lib/session.ts` 的 `can()` 是否正确获取当前用户角色
- 检查 `apps/api/src/middleware/rbac.ts` 中实际应用的权限码
- 参考 `knowledge-base/rbac-matrix.md` 决定按钮可见性

### 2. API 返回与 shared 类型不一致

- 定位 `apps/api/src/services/*.ts` 中对应服务
- 确认响应是否意外附加了非共享字段（例如 `description`）
- 删除或迁移至正确字段；同步更新前端类型

### 3. 重复审批/重复回滚

- 在 `approval-service.ts` / `release-service.ts` 中加入状态机校验
- 测试中覆盖"已通过审批再次通过"、"已回滚发布再次回滚"场景

### 4. 审计日志摘要为空

- 检查 `apps/api/src/middleware/audit.ts` 中的 `audit(action)` 是否传递了摘要
- 写操作调用处应传结构化摘要，例如：`approval.approved: ap-1001 by u-release`

### 5. CI 失败

- 常见原因：测试用例依赖真实服务器、类型检查失败、依赖缺失
- 优先修复测试与类型；必要时为临时不稳定用例标记 `test.skip` 并加 TODO

## 恢复基线

- 任何模块发生数据异常时，可重启 API 进程（内存数据会还原为 seed）
- 不要在生产环境使用内存存储；这仅为演示用途
