import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { featureFlagSchema } from "../lib/validators";
import { featureFlags, featureFlagAudits } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

function serializeFeature(flag: NonNullable<ReturnType<typeof featureFlags.findByKey>>) {
  return { ...flag, enabled: flag.isEnabled };
}

router.get("/", requirePermission("feature:manage"), (req, res) => {
  const { page, pageSize, status, type } = req.query as Record<string, string>;
  let flags = featureFlags.getAll();

  if (status) {
    flags = flags.filter((flag) => status === "enabled" ? flag.isEnabled : !flag.isEnabled);
  }

  if (type) {
    flags = flags.filter((flag) => flag.type === type);
  }

  const serialized = flags.map(serializeFeature);
  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: serialized.slice(start, start + currentPageSize),
      total: serialized.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }

  res.json(serialized);
});

router.get("/status", requirePermission("feature:manage"), (req, res) => {
  const { keys } = req.query as { keys?: string };
  const result: Record<string, boolean> = {};

  for (const key of (keys ?? "").split(",").filter(Boolean)) {
    const flag = featureFlags.findByKey(key);
    result[key] = Boolean(flag?.isEnabled);
  }

  res.json(result);
});

router.get("/:key", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  res.json(serializeFeature(flag));
});

router.post("/", requirePermission("feature:manage"), validate(featureFlagSchema), (req, res) => {
  const { key, name, description, type, defaultValue, isEnabled, enabled, rolloutPercentage } = req.body;
  
  const existing = featureFlags.findByKey(key);
  if (existing) {
    throw new BadRequestError("功能开关已存在");
  }
  
  const newFlag = featureFlags.create({
    key,
    name,
    description,
    type: type as never,
    defaultValue: defaultValue ?? true,
    isEnabled: isEnabled ?? enabled ?? true,
    rolloutPercentage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  featureFlagAudits.recordChange(key, req.user.id, "created", undefined, defaultValue);
  
  res.status(201).json(serializeFeature(newFlag));
});

router.put("/:key", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  const { name, description, isEnabled, enabled, defaultValue, rolloutPercentage } = req.body;
  
  const flag = featureFlags.findByKey(key);
  
  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }
  
  const oldValue = flag.defaultValue;
  
  const updated = featureFlags.update(flag.id, {
    name,
    description,
    isEnabled: isEnabled ?? enabled,
    defaultValue,
    rolloutPercentage,
    updatedAt: new Date().toISOString()
  });
  
  featureFlagAudits.recordChange(key, req.user.id, "updated", oldValue, defaultValue);
  
  res.json(updated ? serializeFeature(updated) : updated);
});

router.patch("/:key", requirePermission("feature:manage"), (req, res) => {
  const { key } = req.params;
  const flag = featureFlags.findByKey(key);

  if (!flag) {
    throw new NotFoundError("功能开关不存在");
  }

  const { enabled, isEnabled, ...rest } = req.body;
  const updated = featureFlags.update(flag.id, {
    ...rest,
    ...(enabled !== undefined || isEnabled !== undefined ? { isEnabled: isEnabled ?? enabled } : {}),
    updatedAt: new Date().toISOString()
  });

  featureFlagAudits.recordChange(key, req.user.id, "updated", flag.defaultValue, req.body);
  res.json(updated ? serializeFeature(updated) : updated);
});

router.post("/:key/enable", requirePermission("feature:manage"), (req, res) => {
  const flag = featureFlags.findByKey(req.params.key);
  if (!flag) throw new NotFoundError("功能开关不存在");
  const updated = featureFlags.update(flag.id, { isEnabled: true, updatedAt: new Date().toISOString() });
  res.json(updated ? serializeFeature(updated) : updated);
});

router.post("/:key/disable", requirePermission("feature:manage"), (req, res) => {
  const flag = featureFlags.findByKey(req.params.key);
  if (!flag) throw new NotFoundError("功能开关不存在");
  const updated = featureFlags.update(flag.id, { isEnabled: false, updatedAt: new Date().toISOString() });
  res.json(updated ? serializeFeature(updated) : updated);
});

router.post("/:key/toggle", requirePermission("feature:manage"), (req, res) => {
  const flag = featureFlags.findByKey(req.params.key);
  if (!flag) throw new NotFoundError("功能开关不存在");
  const updated = featureFlags.update(flag.id, { isEnabled: !flag.isEnabled, updatedAt: new Date().toISOString() });
  res.json(updated ? serializeFeature(updated) : updated);
});

router.get("/:key/status", requirePermission("feature:manage"), (req, res) => {
  const flag = featureFlags.findByKey(req.params.key);
  if (!flag) throw new NotFoundError("功能开关不存在");
  res.json({ key: flag.key, enabled: flag.isEnabled });
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
