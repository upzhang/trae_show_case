import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { invoices } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("billing:view"), (req, res) => {
  const { tenantId } = req.user;
  const { status, page, pageSize } = req.query as Record<string, string>;
  
  let invoiceList = invoices.getAll();
  
  if (req.user.roles.includes("platform_admin")) {
    invoiceList = invoices.getAll();
  } else {
    invoiceList = invoices.findByTenantId(tenantId);
  }
  
  if (status) {
    invoiceList = invoiceList.filter(i => i.status === status);
  }

  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: invoiceList.slice(start, start + currentPageSize),
      total: invoiceList.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }
  
  res.json(invoiceList);
});

router.get("/statistics", requirePermission("billing:view"), (_req, res) => {
  const list = invoices.getAll();
  res.json({
    total: list.length,
    paid: list.filter((invoice) => invoice.status === "paid").length,
    pending: list.filter((invoice) => invoice.status === "pending").length,
    overdue: list.filter((invoice) => invoice.status === "overdue").length
  });
});

router.get("/statistics/status", requirePermission("billing:view"), (_req, res) => {
  const list = invoices.getAll();
  res.json({
    paid: list.filter((invoice) => invoice.status === "paid").length,
    pending: list.filter((invoice) => invoice.status === "pending").length,
    overdue: list.filter((invoice) => invoice.status === "overdue").length,
    refunded: list.filter((invoice) => invoice.status === "refunded" as never).length
  });
});

router.get("/statistics/period", requirePermission("billing:view"), (_req, res) => {
  res.json({ this_month: 0, last_month: 0, this_year: invoices.getAll().length });
});

router.get("/subscription/:subscriptionId", requirePermission("billing:view"), (req, res) => {
  res.json(invoices.getAll().filter((invoice) => invoice.subscriptionId === req.params.subscriptionId));
});

router.get("/tenant/:tenantId", requirePermission("billing:view"), (req, res) => {
  res.json(invoices.findByTenantId(req.params.tenantId));
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
  const { tenantId, subscriptionId, invoiceNumber, amount, currency, periodStart, periodEnd, items, dueDate, status, paidAt } = req.body;
  
  if (!req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权创建发票");
  }
  
  if (!tenantId || amount === undefined || amount < 0) {
    throw new BadRequestError("发票参数无效");
  }

  const today = new Date().toISOString().split("T")[0];
  const newInvoice = invoices.create({
    tenantId,
    subscriptionId,
    invoiceNumber: invoiceNumber ?? `INV-${Date.now()}`,
    status: status ?? "pending",
    amount,
    currency: currency ?? "CNY",
    periodStart: periodStart ?? today,
    periodEnd: periodEnd ?? today,
    issueDate: today,
    dueDate: dueDate ?? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    paidAt,
    items: items ?? [],
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json(newInvoice);
});

router.put("/:id", requirePermission("billing:edit"), (req, res) => {
  const { id } = req.params;
  const { status, paidAt, canceledAt, amount, dueDate } = req.body;
  
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
  if (amount !== undefined) updates.amount = amount;
  if (dueDate) updates.dueDate = dueDate;
  
  const updated = invoices.update(id, updates);
  
  res.json(updated);
});

router.patch("/:id", requirePermission("billing:edit"), (req, res) => {
  const invoice = invoices.get(req.params.id);

  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }

  const updated = invoices.update(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });

  res.json(updated);
});

router.delete("/:id", requirePermission("billing:edit"), (req, res) => {
  const invoice = invoices.get(req.params.id);

  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }

  invoices.delete(req.params.id);
  res.status(204).send();
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
  
  res.json({ ...updated, sent: true });
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

router.post("/:id/refund", requirePermission("billing:edit"), (req, res) => {
  const invoice = invoices.get(req.params.id);

  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }

  const updated = invoices.update(req.params.id, {
    status: "refunded" as never,
    updatedAt: new Date().toISOString()
  });

  res.json(updated);
});

router.get("/:id/pdf", requirePermission("billing:view"), (req, res) => {
  const invoice = invoices.get(req.params.id);

  if (!invoice) {
    throw new NotFoundError("发票不存在");
  }

  res.setHeader("content-type", "application/pdf");
  res.send(Buffer.from("%PDF-1.4\n% demo invoice\n"));
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
