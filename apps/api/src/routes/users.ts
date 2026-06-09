import { Router } from "express";
import { z } from "zod";

import { audit } from "../middleware/audit";
import { requirePermission } from "../middleware/rbac";
import { addUser, getUser, listUsers, updateUserRoles } from "../services/user-service";
import { paramAsString } from "../lib/http";

import type { RoleCode } from "@trae/shared";

const router = Router();

router.get("/api/users", requirePermission("user:view"), (req, res) => {
  res.json(listUsers(req.currentTenantId));
});

router.get("/api/users/:id", requirePermission("user:view"), (req, res) => {
  const target = getUser(paramAsString(req, "id") ?? "");
  if (!target) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(target);
});

const createUserBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  roles: z.array(z.string() as unknown as z.ZodType<RoleCode>).min(1)
});

router.post(
  "/api/users",
  requirePermission("user:edit"),
  audit("user.created"),
  (req, res) => {
    const parsed = createUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
      return;
    }
    const tenantId = req.currentTenantId ?? "tenant-acme";
    const user = addUser({
      id: `u-${Date.now()}`,
      tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      roles: parsed.data.roles
    });
    res.status(201).json(user);
  }
);

const updateRolesBody = z.object({
  roles: z.array(z.string() as unknown as z.ZodType<RoleCode>).min(1)
});

router.put(
  "/api/users/:id/roles",
  requirePermission("user:edit"),
  audit("user.roles.updated"),
  (req, res) => {
    const parsed = updateRolesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
      return;
    }
    const updated = updateUserRoles(paramAsString(req, "id") ?? "", parsed.data.roles);
    if (!updated) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(updated);
  }
);

export default router;
