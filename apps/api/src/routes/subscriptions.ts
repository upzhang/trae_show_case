import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { subscriptions } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("billing:view"), (req, res) => {
  const { tenantId } = req.user;
  
  if (req.user.roles.includes("platform_admin")) {
    const allSubscriptions = subscriptions.getAll();
    res.json(allSubscriptions);
  } else {
    const subscription = subscriptions.findByTenantId(tenantId);
    res.json(subscription ? [subscription] : []);
  }
});

router.get("/:id", requirePermission("billing:view"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const subscription = subscriptions.get(id);
  
  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }
  
  if (subscription.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  res.json(subscription);
});

router.get("/tenant/:tenantId", requirePermission("billing:view"), (req, res) => {
  const { tenantId } = req.params;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const subscription = subscriptions.findByTenantId(tenantId);
  res.json(subscription);
});

router.post("/", requirePermission("billing:edit"), (req, res) => {
  const { tenantId, plan, period, seats, monthlyRate, annualRate } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权创建订阅");
  }
  
  const existing = subscriptions.findByTenantId(tenantId);
  if (existing) {
    throw new BadRequestError("租户已存在订阅");
  }
  
  const newSubscription = subscriptions.create({
    tenantId,
    plan,
    period,
    status: "active",
    seats,
    seatsUsed: 0,
    monthlyRate,
    annualRate,
    nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.status(201).json(newSubscription);
});

router.put("/:id", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  const { plan, period, seats, status, monthlyRate, annualRate } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改订阅");
  }
  
  const subscription = subscriptions.get(id);
  
  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }
  
  const updated = subscriptions.update(id, {
    plan,
    period,
    seats,
    status,
    monthlyRate,
    annualRate,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/cancel", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权取消订阅");
  }
  
  const subscription = subscriptions.get(id);
  
  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }
  
  const updated = subscriptions.update(id, {
    status: "canceled",
    cancelAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/renew", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  const { period } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权续订订阅");
  }
  
  const subscription = subscriptions.get(id);
  
  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }
  
  const billingInterval = period === "yearly" ? 365 : 30;
  const updated = subscriptions.update(id, {
    period,
    status: "active",
    nextBillingAt: new Date(Date.now() + billingInterval * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

export default router;