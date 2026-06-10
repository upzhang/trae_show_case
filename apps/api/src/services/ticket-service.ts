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
  },

  /**
   * 计算工单 SLA 信息。
   * 根据优先级设定不同的 SLA 时限：
   * - critical: 4 小时
   * - high: 8 小时
   * - medium: 24 小时
   * - low: 72 小时
   */
  calculateSLA(ticketId: string): { deadline: string; remainingHours: number; isBreached: boolean } {
    const ticket = tickets.get(ticketId);
    if (!ticket) {
      return { deadline: "", remainingHours: 0, isBreached: false };
    }

    // 优先级对应的 SLA 小时数
    const slaHours: Record<string, number> = {
      critical: 4,
      high: 8,
      medium: 24,
      low: 72
    };

    const hours = slaHours[ticket.priority] ?? 48;
    const createdAt = new Date(ticket.createdAt);
    const deadline = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
    const now = new Date();
    const remainingMs = deadline.getTime() - now.getTime();
    const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

    // 已解决或已关闭的工单不再检查 SLA
    const isBreached = ticket.status !== "resolved" && ticket.status !== "closed" && remainingMs < 0;

    return {
      deadline: deadline.toISOString(),
      remainingHours: isBreached ? 0 : remainingHours,
      isBreached
    };
  },

  /**
   * 自动分配工单给当前负载最小的成员。
   * 负载 = 该成员当前未关闭的工单数。
   */
  autoAssignTicket(ticketId: string): string {
    const ticket = tickets.get(ticketId);
    if (!ticket) {
      return "";
    }

    // 如果已分配则返回当前分配人
    if (ticket.assigneeId) {
      return ticket.assigneeId;
    }

    // 获取所有工单，按分配人统计负载
    const allTickets = tickets.getAll();
    const activeStatuses: Ticket["status"][] = ["new", "open", "in_progress", "waiting_customer"];
    const loadMap = new Map<string, number>();

    for (const t of allTickets) {
      if (t.assigneeId && activeStatuses.includes(t.status)) {
        loadMap.set(t.assigneeId, (loadMap.get(t.assigneeId) || 0) + 1);
      }
    }

    // 找出负载最小的成员
    let minAssignee = "";
    let minLoad = Infinity;

    // 收集所有出现过的分配人
    const allAssignees = new Set<string>();
    for (const t of allTickets) {
      if (t.assigneeId) allAssignees.add(t.assigneeId);
    }

    for (const assigneeId of allAssignees) {
      const load = loadMap.get(assigneeId) || 0;
      if (load < minLoad) {
        minLoad = load;
        minAssignee = assigneeId;
      }
    }

    if (minAssignee) {
      tickets.update(ticketId, { assigneeId: minAssignee, updatedAt: new Date().toISOString() });
    }

    return minAssignee;
  },

  /**
   * 获取工单满意度统计。
   * 满意度数据从工单会话中提取（模拟评分 1-5）。
   */
  getSatisfactionStats(): { average: number; distribution: Record<string, number>; total: number } {
    const allConversations = ticketConversations.getAll();

    // 从会话消息中提取满意度评分（格式: "满意度评分: N"）
    const ratings: number[] = [];
    for (const conv of allConversations) {
      const match = conv.message.match(/满意度评分[：:]\s*(\d)/);
      if (match) {
        const rating = parseInt(match[1], 10);
        if (rating >= 1 && rating <= 5) {
          ratings.push(rating);
        }
      }
    }

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const r of ratings) {
      distribution[String(r)] = (distribution[String(r)] || 0) + 1;
    }

    const total = ratings.length;
    const average = total > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / total) * 100) / 100
      : 0;

    return { average, distribution, total };
  },

  /**
   * 获取工单趋势分析（按月统计）。
   */
  getTicketTrends(): {
    month: string;
    created: number;
    resolved: number;
    avgResolutionHours: number;
  }[] {
    const allTickets = tickets.getAll();
    const monthlyMap = new Map<string, {
      created: number;
      resolved: number;
      resolutionHours: number[];
    }>();

    for (const ticket of allTickets) {
      const createdMonth = ticket.createdAt.substring(0, 7);
      if (!monthlyMap.has(createdMonth)) {
        monthlyMap.set(createdMonth, { created: 0, resolved: 0, resolutionHours: [] });
      }
      monthlyMap.get(createdMonth)!.created++;

      if (ticket.resolvedAt) {
        const resolvedMonth = ticket.resolvedAt.substring(0, 7);
        if (!monthlyMap.has(resolvedMonth)) {
          monthlyMap.set(resolvedMonth, { created: 0, resolved: 0, resolutionHours: [] });
        }
        monthlyMap.get(resolvedMonth)!.resolved++;

        // 计算解决耗时（小时）
        const createdTime = new Date(ticket.createdAt).getTime();
        const resolvedTime = new Date(ticket.resolvedAt).getTime();
        const hours = (resolvedTime - createdTime) / (1000 * 60 * 60);
        monthlyMap.get(resolvedMonth)!.resolutionHours.push(hours);
      }
    }

    const sortedMonths = [...monthlyMap.keys()].sort();

    return sortedMonths.map((month) => {
      const data = monthlyMap.get(month)!;
      const totalHours = data.resolutionHours.reduce((sum, h) => sum + h, 0);
      const avgResolutionHours = data.resolutionHours.length > 0
        ? Math.round((totalHours / data.resolutionHours.length) * 100) / 100
        : 0;

      return {
        month,
        created: data.created,
        resolved: data.resolved,
        avgResolutionHours
      };
    });
  }
};