import { Router } from "express";
import { z } from "zod";

import { audit } from "../middleware/audit";
import { requirePermission } from "../middleware/rbac";
import { getTenant, listTenants, updateTenantPlan } from "../services/tenant-service";
import { paramAsString } from "../lib/http";

const router = Router();

router.get("/api/tenants", requirePermission("tenant:view"), (req, res) => {
  const tenants = listTenants();
  const canViewAllTenants = req.currentRoles?.includes("platform_admin") ?? false;
  if (req.currentTenantId && !canViewAllTenants) {
    res.json(tenants.filter((item) => item.id === req.currentTenantId));
    return;
  }
  res.json(tenants);
});

router.get("/api/tenants/:id", requirePermission("tenant:view"), (req, res) => {
  const target = getTenant(paramAsString(req, "id") ?? "");
  if (!target) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(target);
});

const updatePlanBody = z.object({
  plan: z.enum(["standard", "enterprise"])
});

router.put(
  "/api/tenants/:id/plan",
  requirePermission("tenant:edit"),
  audit("tenant.plan.updated"),
  (req, res) => {
    const parsed = updatePlanBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
      return;
    }
    const updated = updateTenantPlan(paramAsString(req, "id") ?? "", parsed.data.plan);
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(updated);
  }
);

export default router;
