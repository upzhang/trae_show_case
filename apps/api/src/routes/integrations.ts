import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { integrationSchema } from "../lib/validators";
import { integrations } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("integration:manage"), (req, res) => {
  const { tenantId } = req.user;
  const { page, pageSize, type } = req.query as Record<string, string>;
  let integrationList = req.user.roles.includes("platform_admin")
    ? integrations.getAll()
    : integrations.findByTenantId(tenantId);

  if (type) {
    integrationList = integrationList.filter((item) => item.type === type);
  }

  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: integrationList.slice(start, start + currentPageSize),
      total: integrationList.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }

  res.json(integrationList);
});

router.get("/types", requirePermission("integration:manage"), (_req, res) => {
  res.json(["slack", "salesforce", "zendesk", "jira", "github", "stripe", "webhook", "custom"]);
});

router.get("/:id", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const integration = integrations.get(id);
  
  if (!integration) {
    throw new NotFoundError("集成不存在");
  }
  
  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  res.json(integration);
});

router.post("/", requirePermission("integration:manage"), validate(integrationSchema), (req, res) => {
  const { tenantId } = req.user;
  const { type, name, config } = req.body;
  
  const newIntegration = integrations.create({
    tenantId,
    type,
    name,
    status: "not_configured",
    config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.status(201).json(newIntegration);
});

router.put("/:id", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { name, config, status } = req.body;
  
  const integration = integrations.get(id);
  
  if (!integration) {
    throw new NotFoundError("集成不存在");
  }
  
  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = integrations.update(id, {
    name,
    config,
    status,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.patch("/:id", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const integration = integrations.get(id);

  if (!integration) {
    throw new NotFoundError("集成不存在");
  }

  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }

  const updated = integrations.update(id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });

  res.json(updated);
});

router.delete("/:id", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const integration = integrations.get(id);
  
  if (!integration) {
    throw new NotFoundError("集成不存在");
  }
  
  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权删除该资源");
  }
  
  integrations.delete(id);
  res.status(204).send();
});

router.post("/:id/connect", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const integration = integrations.get(id);
  
  if (!integration) {
    throw new NotFoundError("集成不存在");
  }
  
  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = integrations.update(id, {
    status: "connected",
    lastSyncAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/disconnect", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const integration = integrations.get(id);
  
  if (!integration) {
    throw new NotFoundError("集成不存在");
  }
  
  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = integrations.update(id, {
    status: "not_configured",
    lastSyncAt: undefined,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/sync", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const integration = integrations.get(id);
  
  if (!integration) {
    throw new NotFoundError("集成不存在");
  }
  
  if (integration.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  if (integration.status !== "connected") {
    throw new BadRequestError("集成未连接");
  }
  
  const updated = integrations.update(id, {
    lastSyncAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json({ status: "syncing", syncedAt: updated?.lastSyncAt, integration: updated });
});

router.get("/:id/sync-history", requirePermission("integration:manage"), (req, res) => {
  const { id } = req.params;
  const integration = integrations.get(id);

  if (!integration) {
    throw new NotFoundError("集成不存在");
  }

  res.json({
    data: integration.lastSyncAt ? [{ id: `sync-${id}`, integrationId: id, status: "success", syncedAt: integration.lastSyncAt }] : [],
    total: integration.lastSyncAt ? 1 : 0
  });
});

export default router;
