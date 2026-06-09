# 预置缺陷速览

本仓库预置了可被 Trae 修复的缺陷，便于开展企业能力验证：

| ID | 位置 | 问题 | 修复线索 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/routes/users.ts` + `apps/web-admin/src/pages/UsersPage.tsx` | `PUT /api/users/:id/roles` 使用 `user:edit`，实际应使用 `role:edit`；前端按钮展示条件也基于 `user:edit` | 参考 `knowledge-base/rbac-matrix.md`，改为 `role:edit` |
| 2 | `apps/api/src/services/release-service.ts` | `ReleaseWithDescription` 向响应中加入 `description` 字段，shared 类型无此字段 | 参考 `knowledge-base/api-contract.md` 与 `backend-guidelines.md`，删除字段或更新 shared 类型 |
| 3 | `apps/api/src/services/approval-service.ts` | `approveApproval` / `rejectApproval` 未校验当前状态，可重复调用 | 加入 pending 状态判断，重复通过返回 4xx |
| 4 | `apps/web-admin/src/pages/ApprovalsPage.tsx` | 通过/拒绝按钮未禁用已终态审批（与缺陷 3 关联） | 前端按钮按 status 置灰 |
| 5 | `apps/api/src/middleware/audit.ts` | 所有审计日志摘要为空字符串 | 为每个 action 提供可读摘要模板 |
| 6 | `.github/workflows/ci.yml` | `legacy-node-check` job 在 Node 18 下直接执行 TS 源码，必然失败 | 改为先编译/使用 tsx，或移除该 job |

请配合 `verification/trae-enterprise-checklist.md` 使用。
