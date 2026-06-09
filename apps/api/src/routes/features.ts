import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { featureFlagSchema } from "../lib/validators";
import { featureFlags, featureFlagAudits } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("feature:manage"), (req, res) => {
  const flags = featureFlags.getAll();
  res.json(flags);
});

router.get("/:key", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  res.json(flag);
});

router.post("/", requirePermission("feature:manage"), validate(featureFlagSchema), (req, res) => {
  const { key, name, description, type, defaultValue, isEnabled } = req.body;
  
  const existing = featureFlags.findByKey(key);
  if (existing) {
    throw new BadRequestError("功能开关已存在");
  }
  
  const newFlag = featureFlags.create({
    key,
    name,
    description,
    type,
    defaultValue,
    isEnabled: isEnabled ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  featureFlagAudits.recordChange(key, req.user.id, "created", undefined, defaultValue);
  
  res.status(201).json(newFlag);
});

router.put("/:key", requirePermission("feature:manage"), validate(featureFlagSchema), (req, res) => {
  const { key } = req.params;
  const { name, description, isEnabled, defaultValue, rolloutPercentage } = req.body;
  
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  const oldValue = flag.defaultValue;
  
  const updated = featureFlags.update(flag.id, {
    name,
    description,
    isEnabled,
    defaultValue,
    rolloutPercentage,
    updatedAt: new Date().toISOString()
  });
  
  featureFlagAudits.recordChange(key, req.user.id, "updated", oldValue, defaultValue);
  
  res.json(updated);
});

router.delete("/:key", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  featureFlags.delete(flag.id);
  featureFlagAudits.recordChange(key, req.user.id, "deleted", flag.defaultValue, undefined);
  
  res.status(204).send();
});

router.get("/:key/value", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  const { tenantId } = req.user;
  
  const value = featureFlags.getValue(key, tenantId);
  res.json({ key, value });
});

router.post("/:key/override", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  const { tenantId } = req.user;
  const { overrideTenantId, value } = req.body;
  
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  if (!req.user.roles.includes("platform_admin") && overrideTenantId !== tenantId) {
    throw new BadRequestError("无权设置其他租户的覆盖值");
  }
  
  featureFlags.addTenantOverride(key, overrideTenantId, value);
  featureFlagAudits.recordChange(key, req.user.id, "override_added", undefined, { tenantId: overrideTenantId, value });
  
  res.json({ message: "覆盖值已设置" });
});

router.delete("/:key/override/:tenantId", requirePermission("feature:manage"), (req, res) => {
  const { key, tenantId } = req.params;
  
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权删除覆盖值");
  }
  
  featureFlags.removeTenantOverride(key, tenantId);
  featureFlagAudits.recordChange(key, req.user.id, "override_removed", { tenantId, value: null }, undefined);
  
  res.status(204).send();
});

router.get("/:key/audit", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  
  const audits = featureFlagAudits.findByFeatureKey(key);
  res.json(audits);
});

export default router;