import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { invoices } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("billing:view"), (req, res) => {
  const { tenantId } = req.user;
  const { status } = req.query as Record<string, string>;
  
  let invoiceList: typeof invoices.getAll();
  
  if (req.user.roles.includes("platform_admin")) {
    invoiceList = invoices.getAll();
  } else {
    invoiceList = invoices.findByTenantId(tenantId);
  }
  
  if (status) {
    invoiceList = invoiceList.filter(i => i.status === status);
  }
  
  res.json(invoiceList);
});

router.get("/:id", requirePermission("billing:view"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const invoice = invoices.get(id);
  
  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }
  
  if (invoice.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  res.json(invoice);
});

router.post("/", requirePermission("billing:edit"), (req, res) => {
  const { tenantId, subscriptionId, invoiceNumber, amount, currency, periodStart, periodEnd, items } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权创建发票");
  }
  
  const newInvoice = invoices.create({
    tenantId,
    subscriptionId,
    invoiceNumber,
    status: "draft",
    amount,
    currency,
    periodStart,
    periodEnd,
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items,
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json(newInvoice);
});

router.put("/:id", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  const { status, paidAt, canceledAt } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改发票");
  }
  
  const invoice = invoices.get(id);
  
  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }
  
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  
  if (status) updates.status = status;
  if (paidAt) updates.paidAt = paidAt;
  if (canceledAt) updates.canceledAt = canceledAt;
  
  const updated = invoices.update(id, updates);
  
  res.json(updated);
});

router.post("/:id/send", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权发送发票");
  }
  
  const invoice = invoices.get(id);
  
  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }
  
  const updated = invoices.update(id, {
    status: "sent",
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/pay", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权支付发票");
  }
  
  const invoice = invoices.get(id);
  
  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }
  
  const updated = invoices.update(id, {
    status: "paid",
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post("/:id/cancel", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权取消发票");
  }
  
  const invoice = invoices.get(id);
  
  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }
  
  const updated = invoices.update(id, {
    status: "canceled",
    canceledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

export default router;