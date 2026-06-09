import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { ticketSchema, ticketConversationSchema } from "../lib/validators";
import { tickets, ticketConversations, ticketStatusTransitions } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("ticket:view"), (req, res) => {
  const { tenantId } = req.user;
  const { status, priority, category, assigneeId } = req.query as Record<string, string>;
  
  let ticketList = tickets.findByTenantId(tenantId);
  
  if (status) {
    ticketList = ticketList.filter(t => t.status === status);
  }
  if (priority) {
    ticketList = ticketList.filter(t => t.priority === priority);
  }
  if (category) {
    ticketList = ticketList.filter(t => t.category === category);
  }
  if (assigneeId) {
    ticketList = ticketList.filter(t => t.assigneeId === assigneeId);
  }
  
  res.json(ticketList);
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
  const { title, description, priority, category, tags } = req.body;
  
  const newTicket = tickets.create({
    tenantId,
    title,
    description,
    priority,
    status: "open",
    category,
    creatorId: req.user.id,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  ticketStatusTransitions.recordTransition(newTicket.id, "open", "open", req.user.id);
  
  res.status(201).json(newTicket);
});

router.put("/:id", requirePermission("ticket:edit"), validate(ticketSchema), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { title, description, priority, category, assigneeId, tags } = req.body;
  
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
    updatedAt: new Date().toISOString()
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
    ticketId: id,
    userId: req.user.id,
    message,
    createdAt: new Date().toISOString()
  });
  
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