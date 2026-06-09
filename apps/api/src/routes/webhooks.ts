import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { webhookSchema } from "../lib/validators";
import { webhooks, webhookDeliveryLogs } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("webhook:manage"), (req, res) => {
  const { tenantId } = req.user;
  const webhookList = webhooks.findByTenantId(tenantId);
  res.json(webhookList);
});

router.get("/:id", requirePermission("webhook:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const webhook = webhooks.get(id);
  
  if (!webhook) {
    throw new NotFoundError("Webhook 不存在");
  }
  
  if (webhook.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  res.json(webhook);
});

router.post("/", requirePermission("webhook:manage"), validate(webhookSchema), (req, res) => {
  const { tenantId } = req.user;
  const { name, url, events } = req.body;
  
  const secret = webhooks.generateSecret();
  const newWebhook = webhooks.create({
    tenantId,
    name,
    url,
    events,
    secret,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.status(201).json(newWebhook);
});

router.put("/:id", requirePermission("webhook:manage"), validate(webhookSchema), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { name, url, events, isActive } = req.body;
  
  const webhook = webhooks.get(id);
  
  if (!webhook) {
    throw new NotFoundError("Webhook 不存在");
  }
  
  if (webhook.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = webhooks.update(id, {
    name,
    url,
    events,
    isActive,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.delete("/:id", requirePermission("webhook:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const webhook = webhooks.get(id);
  
  if (!webhook) {
    throw new NotFoundError("Webhook 不存在");
  }
  
  if (webhook.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权删除该资源");
  }
  
  webhooks.delete(id);
  res.status(204).send();
});

router.post("/:id/secret", requirePermission("webhook:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const webhook = webhooks.get(id);
  
  if (!webhook) {
    throw new NotFoundError("Webhook 不存在");
  }
  
  if (webhook.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const newSecret = webhooks.generateSecret();
  const updated = webhooks.update(id, {
    secret: newSecret,
    updatedAt: new Date().toISOString()
  });
  
  res.json({ secret: newSecret, webhook: updated });
});

router.get("/:id/logs", requirePermission("webhook:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const webhook = webhooks.get(id);
  
  if (!webhook) {
    throw new NotFoundError("Webhook 不存在");
  }
  
  if (webhook.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const logs = webhookDeliveryLogs.findByWebhookId(id);
  res.json(logs);
});

export default router;