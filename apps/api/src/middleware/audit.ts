import type { NextFunction, Request, Response } from "express";

import { recordAuditLog } from "../services/audit-service";

// 预置缺陷 5 — 审计日志缺口：
// 该中间件只记录 POST/PUT/DELETE 动作中的部分接口，
// 但 PUT /api/releases/:id/deploy 和 PUT /api/users/:id/roles
// 的审计摘要会写入空 summary，需要修复为具体可读摘要。
export function audit(action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userId = req.currentUserId;
    const tenantId = req.currentTenantId;
    if (userId && tenantId) {
      recordAuditLog({
        tenantId,
        actorId: userId,
        action,
        summary: ""
      });
    }
    next();
  };
}
