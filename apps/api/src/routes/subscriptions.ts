import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { subscriptions } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("billing:view"), (req, res) => {
  const { tenantId } = req.user;
  const { page, pageSize, status, plan } = req.query as Record<string, string>;
  
  let subscriptionList = req.user.roles.includes("platform_admin")
    ? subscriptions.getAll()
    : subscriptions.getAll().filter((subscription) => subscription.tenantId === tenantId);

  if (status) {
    subscriptionList = subscriptionList.filter((subscription) => subscription.status === status);
  }

  if (plan) {
    subscriptionList = subscriptionList.filter((subscription) => subscription.plan === plan);
  }

  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: subscriptionList.slice(start, start + currentPageSize),
      total: subscriptionList.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }

  res.json(subscriptionList);
});

router.get("/statistics", requirePermission("billing:view"), (_req, res) => {
  const list = subscriptions.getAll();
  res.json({
    total: list.length,
    active: list.filter((subscription) => subscription.status === "active").length,
    revenue: list.reduce((sum, subscription) => sum + (subscription.monthlyRate ?? 0), 0)
  });
});

router.get("/statistics/plan", requirePermission("billing:view"), (_req, res) => {
  const list = subscriptions.getAll();
  res.json({
    free: list.filter((subscription) => subscription.plan === "free").length,
    pro: list.filter((subscription) => subscription.plan === "pro").length,
    enterprise: list.filter((subscription) => subscription.plan === "enterprise").length
  });
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
  const { tenantId, plan, period, seats, monthlyRate, annualRate, status } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权创建订阅");
  }

  if (!tenantId || !plan || !["free", "pro", "enterprise", "standard"].includes(plan)) {
    throw new BadRequestError("订阅参数无效");
  }
  
  const newSubscription = subscriptions.create({
    tenantId,
    plan: plan as never,
    period: period ?? "monthly",
    status: status ?? "active",
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

router.patch("/:id", requirePermission("billing:edit"), (req, res) => {
  const subscription = subscriptions.get(req.params.id);

  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }

  const updated = subscriptions.update(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });

  res.json(updated);
});

router.delete("/:id", requirePermission("billing:edit"), (req, res) => {
  const subscription = subscriptions.get(req.params.id);

  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }

  subscriptions.delete(req.params.id);
  res.status(204).send();
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
    status: "cancelled" as never,
    cancelAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/renew", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  const { period } = req.body ?? {};
  
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

router.post("/:id/upgrade", requirePermission("billing:edit"), (req, res) => {
  const subscription = subscriptions.get(req.params.id);

  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }

  const updated = subscriptions.update(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });

  res.json(updated);
});

router.post("/:id/downgrade", requirePermission("billing:edit"), (req, res) => {
  const subscription = subscriptions.get(req.params.id);

  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }

  const updated = subscriptions.update(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });

  res.json(updated);
});

router.get("/:id/history", requirePermission("billing:view"), (req, res) => {
  const subscription = subscriptions.get(req.params.id);

  if (!subscription) {
    throw new NotFoundError("订阅不存在");
  }

  res.json({
    data: [{ id: `sub-history-${req.params.id}`, subscriptionId: req.params.id, action: "created", createdAt: subscription.createdAt }],
    total: 1
  });
});

export default router;
