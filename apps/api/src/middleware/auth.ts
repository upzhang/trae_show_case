import type { NextFunction, Request, Response } from "express";

import { headerAsString } from "../lib/http";
import { store } from "../store";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUserId?: string;
      currentTenantId?: string;
    }
  }
}

// 简化鉴权：通过请求头 x-user-id 定位当前用户，方便测试。
// 真实项目中应由会话/JWT 提供。
export function resolveCurrentUser(req: Request, _res: Response, next: NextFunction): void {
  const userId = headerAsString(req, "x-user-id");
  if (!userId) {
    next();
    return;
  }
  const user = store.users.find((item) => item.id === userId);
  if (!user) {
    next();
    return;
  }
  req.currentUserId = user.id;
  req.currentTenantId = user.tenantId;
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.currentUserId) {
    res.status(401).json({ error: "missing x-user-id header" });
    return;
  }
  next();
}
