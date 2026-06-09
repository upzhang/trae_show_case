import { Router } from "express";

import { audit } from "../middleware/audit";
import { requirePermission } from "../middleware/rbac";
import { deployRelease, getRelease, listReleases, rollbackRelease } from "../services/release-service";
import { paramAsString } from "../lib/http";

const router = Router();

router.get("/api/releases", requirePermission("release:view"), (req, res) => {
  res.json(listReleases(req.currentTenantId));
});

router.get("/api/releases/:id", requirePermission("release:view"), (req, res) => {
  const target = getRelease(paramAsString(req, "id") ?? "");
  if (!target) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(target);
});

router.put(
  "/api/releases/:id/deploy",
  requirePermission("release:deploy"),
  audit("release.deployed"),
  (req, res) => {
    const updated = deployRelease(paramAsString(req, "id") ?? "");
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(updated);
  }
);

router.put(
  "/api/releases/:id/rollback",
  requirePermission("release:deploy"),
  audit("release.rolled_back"),
  (req, res) => {
    const updated = rollbackRelease(paramAsString(req, "id") ?? "");
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(updated);
  }
);

export default router;
