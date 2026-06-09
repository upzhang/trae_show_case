import { tickets, ticketConversations, ticketStatusTransitions } from "../store";
import type { Ticket, TicketConversation, TicketStatusTransition } from "@trae/shared";

export const ticketService = {
  createTicket(tenantId: string, title: string, description: string, priority: Ticket["priority"], category: Ticket["category"], creatorId: string, tags?: string[]): Ticket {
    const ticket = tickets.create({
      tenantId,
      title,
      description,
      priority,
      status: "open",
      category,
      creatorId,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    ticketStatusTransitions.recordTransition(ticket.id, "open", "open", creatorId);
    return ticket;
  },

  getTicket(id: string): Ticket | undefined {
    return tickets.get(id);
  },

  getTicketsByTenant(tenantId: string, filters?: { status?: Ticket["status"]; priority?: Ticket["priority"]; category?: Ticket["category"]; assigneeId?: string }): Ticket[] {
    let result = tickets.findByTenantId(tenantId);
    
    if (filters?.status) result = result.filter(t => t.status === filters.status);
    if (filters?.priority) result = result.filter(t => t.priority === filters.priority);
    if (filters?.category) result = result.filter(t => t.category === filters.category);
    if (filters?.assigneeId) result = result.filter(t => t.assigneeId === filters.assigneeId);
    
    return result;
  },

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | undefined {
    return tickets.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteTicket(id: string): boolean {
    return tickets.delete(id);
  },

  updateStatus(id: string, status: Ticket["status"], actorId: string): Ticket | undefined {
    const ticket = tickets.get(id);
    if (!ticket) return undefined;
    
    const oldStatus = ticket.status;
    
    const updated = tickets.update(id, {
      status,
      updatedAt: new Date().toISOString(),
      resolvedAt: status === "resolved" ? new Date().toISOString() : ticket.resolvedAt
    });
    
    ticketStatusTransitions.recordTransition(id, oldStatus, status, actorId);
    return updated;
  },

  addConversation(ticketId: string, userId: string, message: string): TicketConversation {
    const conversation = ticketConversations.create({
      ticketId,
      userId,
      message,
      createdAt: new Date().toISOString()
    });
    
    tickets.update(ticketId, { updatedAt: new Date().toISOString() });
    return conversation;
  },

  getConversations(ticketId: string): TicketConversation[] {
    return ticketConversations.findByTicketId(ticketId);
  },

  getStatusTransitions(ticketId: string): TicketStatusTransition[] {
    return ticketStatusTransitions.findByTicketId(ticketId);
  },

  getOpenTickets(tenantId?: string): Ticket[] {
    if (tenantId) {
      return tickets.findByFields({ tenantId, status: "open" });
    }
    return tickets.findByFields({ status: "open" });
  },

  getInProgressTickets(tenantId?: string): Ticket[] {
    if (tenantId) {
      return tickets.findByFields({ tenantId, status: "in_progress" });
    }
    return tickets.findByFields({ status: "in_progress" });
  },

  getResolvedTickets(tenantId?: string): Ticket[] {
    if (tenantId) {
      return tickets.findByFields({ tenantId, status: "resolved" });
    }
    return tickets.findByFields({ status: "resolved" });
  },

  getByPriority(priority: Ticket["priority"], tenantId?: string): Ticket[] {
    if (tenantId) {
      return tickets.findByFields({ tenantId, priority });
    }
    return tickets.findByPriority(priority);
  },

  getByTag(tag: string, tenantId?: string): Ticket[] {
    let result = tickets.findByTag(tag);
    if (tenantId) {
      result = result.filter(t => t.tenantId === tenantId);
    }
    return result;
  }
};