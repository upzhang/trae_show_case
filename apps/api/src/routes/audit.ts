import { Router } from "express";

import { requirePermission } from "../middleware/rbac";
import { listAuditLogs } from "../services/audit-service";

const router = Router();

router.get("/api/audit-logs", requirePermission("audit:view"), (req, res) => {
  res.json(listAuditLogs(req.currentTenantId));
});

export default router;
