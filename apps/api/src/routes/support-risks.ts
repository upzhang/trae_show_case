import { Router } from "express";

import { requirePermission } from "../middleware/rbac";
import { listSupportRisks } from "../services/support-risk-service";

const router = Router();

router.get("/api/support-risks", requirePermission("tenant:view"), (req, res) => {
  const includeAllTenants = req.currentRoles?.includes("platform_admin") ?? false;
  res.json(listSupportRisks(req.currentTenantId, includeAllTenants));
});

export default router;
