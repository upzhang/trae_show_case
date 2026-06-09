import { Router } from "express";

import { requirePermission } from "../middleware/rbac";
import { listActivityEvents } from "../services/activity-service";

const router = Router();

router.get("/api/activity-events", requirePermission("tenant:view"), (req, res) => {
  const includeAllTenants = req.currentRoles?.includes("platform_admin") ?? false;
  res.json(listActivityEvents(req.currentTenantId, includeAllTenants));
});

export default router;
