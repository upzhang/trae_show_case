import { Router } from "express";
import { z } from "zod";

import { audit } from "../middleware/audit";
import { requirePermission } from "../middleware/rbac";
import { approveApproval, createApproval, getApproval, listApprovals, rejectApproval } from "../services/approval-service";
import { paramAsString } from "../lib/http";

const router = Router();

router.get("/api/approvals", requirePermission("approval:view"), (req, res) => {
  res.json(listApprovals(req.currentTenantId));
});

router.get("/api/approvals/:id", requirePermission("approval:view"), (req, res) => {
  const target = getApproval(paramAsString(req, "id") ?? "");
  if (!target) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(target);
});

const createApprovalBody = z.object({
  title: z.string().min(1)
});

router.post(
  "/api/approvals",
  requirePermission("approval:view"),
  audit("approval.created"),
  (req, res) => {
    const parsed = createApprovalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
      return;
    }
    const userId = req.currentUserId ?? "unknown";
    const tenantId = req.currentTenantId ?? "tenant-acme";
    const created = createApproval({
      tenantId,
      title: parsed.data.title,
      requestedBy: userId
    });
    res.status(201).json(created);
  }
);

router.put(
  "/api/approvals/:id/approve",
  requirePermission("approval:approve"),
  audit("approval.approved"),
  (req, res) => {
    const userId = req.currentUserId ?? "unknown";
    const updated = approveApproval(paramAsString(req, "id") ?? "", userId);
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(updated);
  }
);

router.put(
  "/api/approvals/:id/reject",
  requirePermission("approval:approve"),
  audit("approval.rejected"),
  (req, res) => {
    const userId = req.currentUserId ?? "unknown";
    const updated = rejectApproval(paramAsString(req, "id") ?? "", userId);
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(updated);
  }
);

export default router;
