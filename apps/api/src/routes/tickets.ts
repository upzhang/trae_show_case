import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { ticketSchema, ticketConversationSchema } from "../lib/validators";
import { tickets, ticketConversations, ticketStatusTransitions } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("ticket:view"), (req, res) => {
  const { tenantId } = req.user;
  const { status, priority, category, assigneeId, assignee, page, pageSize } = req.query as Record<string, string>;
  
  let ticketList = req.user.roles.includes("platform_admin") ? tickets.getAll() : tickets.findByTenantId(tenantId);
  
  if (status) {
    ticketList = ticketList.filter(t => t.status === status);
  }
  if (priority) {
    ticketList = ticketList.filter(t => t.priority === priority);
  }
  if (category) {
    ticketList = ticketList.filter(t => t.category === category);
  }
  if (assigneeId || assignee) {
    ticketList = ticketList.filter(t => t.assigneeId === (assigneeId ?? assignee));
  }

  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: ticketList.slice(start, start + currentPageSize),
      total: ticketList.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }
  
  res.json(ticketList);
});

router.get("/statistics", requirePermission("ticket:view"), (req, res) => {
  const ticketList = req.user.roles.includes("platform_admin") ? tickets.getAll() : tickets.findByTenantId(req.user.tenantId);
  res.json({
    total: ticketList.length,
    open: ticketList.filter((ticket) => ticket.status === "open" as never).length,
    closed: ticketList.filter((ticket) => ticket.status === "closed").length
  });
});

router.get("/statistics/priority", requirePermission("ticket:view"), (req, res) => {
  const ticketList = req.user.roles.includes("platform_admin") ? tickets.getAll() : tickets.findByTenantId(req.user.tenantId);
  res.json({
    critical: ticketList.filter((ticket) => ticket.priority === "critical").length,
    high: ticketList.filter((ticket) => ticket.priority === "high").length,
    medium: ticketList.filter((ticket) => ticket.priority === "medium").length,
    low: ticketList.filter((ticket) => ticket.priority === "low").length
  });
});

router.get("/search", requirePermission("ticket:view"), (req, res) => {
  const { q } = req.query as { q?: string };
  const keyword = (q ?? "").toLowerCase();
  const ticketList = req.user.roles.includes("platform_admin") ? tickets.getAll() : tickets.findByTenantId(req.user.tenantId);
  res.json(ticketList.filter((ticket) => ticket.title.toLowerCase().includes(keyword) || ticket.description.toLowerCase().includes(keyword)));
});

router.get("/:id", requirePermission("ticket:view"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const conversations = ticketConversations.findByTicketId(id);
  const transitions = ticketStatusTransitions.findByTicketId(id);
  
  res.json({ ...ticket, conversations, transitions });
});

router.post("/", requirePermission("ticket:edit"), validate(ticketSchema), (req, res) => {
  const { tenantId } = req.user;
  const { title, description, priority, category, tags, type, assigneeId, status } = req.body;
  
  const newTicket = tickets.create({
    tenantId,
    title,
    description,
    priority,
    status: status ?? "open",
    category: category ?? "support",
    type,
    assigneeId,
    creatorId: req.user.id,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  ticketStatusTransitions.recordTransition(newTicket.id, "open", "open", req.user.id);
  
  res.status(201).json(newTicket);
});

router.put("/:id", requirePermission("ticket:edit"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { title, description, priority, category, assigneeId, tags, status, type } = req.body;
  
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = tickets.update(id, {
    title,
    description,
    priority,
    category,
    assigneeId,
    tags,
    status,
    type,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.patch("/:id", requirePermission("ticket:edit"), (req, res) => {
  const { id } = req.params;
  const ticket = tickets.get(id);

  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }

  if (ticket.tenantId !== req.user.tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }

  const updated = tickets.update(id, {
    ...req.body,
    updatedAt: new Date().toISOString(),
    resolvedAt: req.body.status === "resolved" ? new Date().toISOString() : ticket.resolvedAt
  });

  res.json(updated);
});

router.delete("/:id", requirePermission("ticket:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权删除该资源");
  }
  
  tickets.delete(id);
  res.status(204).send();
});

router.post("/:id/status", requirePermission("ticket:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { status } = req.body;
  
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const oldStatus = ticket.status;
  
  const updated = tickets.update(id, {
    status,
    updatedAt: new Date().toISOString(),
    resolvedAt: status === "resolved" ? new Date().toISOString() : ticket.resolvedAt
  });
  
  ticketStatusTransitions.recordTransition(id, oldStatus, status, req.user.id);
  
  res.json(updated);
});

router.post("/:id/close", requirePermission("ticket:manage"), (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket) throw new NotFoundError("工单不存在");
  const updated = tickets.update(req.params.id, { status: "closed" as never, closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  res.json(updated);
});

router.post("/:id/reopen", requirePermission("ticket:manage"), (req, res) => {
  const ticket = tickets.get(req.params.id);
  if (!ticket) throw new NotFoundError("工单不存在");
  const updated = tickets.update(req.params.id, { status: "open" as never, updatedAt: new Date().toISOString() });
  res.json(updated);
});

router.get("/:id/conversations", requirePermission("ticket:view"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const conversations = ticketConversations.findByTicketId(id);
  res.json(conversations);
});

router.get("/:id/comments", requirePermission("ticket:view"), (req, res) => {
  const { id } = req.params;
  const ticket = tickets.get(id);

  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }

  const conversations = ticketConversations.findByTicketId(id).map((comment) => ({
    ...comment,
    content: comment.message
  }));
  res.json(conversations);
});

router.post("/:id/conversations", requirePermission("ticket:edit"), validate(ticketConversationSchema), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { message } = req.body;
  
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const newConversation = ticketConversations.create({
    ticketId: id as string,
    userId: req.user.id,
    message,
    createdAt: new Date().toISOString()
  });
  
  tickets.update(id, { updatedAt: new Date().toISOString() });
  
  res.status(201).json(newConversation);
});

router.post("/:id/comments", requirePermission("ticket:edit"), (req, res) => {
  const { id } = req.params;
  const ticket = tickets.get(id);

  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }

  const newConversation = ticketConversations.create({
    ticketId: id,
    userId: req.user.id,
    authorId: req.user.id,
    message: req.body.content ?? req.body.message,
    content: req.body.content ?? req.body.message,
    createdAt: new Date().toISOString()
  } as never);

  tickets.update(id, { updatedAt: new Date().toISOString() });
  res.status(201).json(newConversation);
});

router.get("/:id/transitions", requirePermission("ticket:view"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const ticket = tickets.get(id);
  
  if (!ticket) {
    throw new NotFoundError("工单不存在");
  }
  
  if (ticket.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const transitions = ticketStatusTransitions.findByTicketId(id);
  res.json(transitions);
});

export default router;
