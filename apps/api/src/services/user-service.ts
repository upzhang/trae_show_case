import { store, users, activityEvents, auditLogs, approvals, tickets } from "../store";

import type { User, ActivityEvent, AuditLog, ApprovalRequest, Ticket } from "@trae/shared";

export function listUsers(tenantId?: string): User[] {
  if (!tenantId) return store.users;
  return store.users.filter((item) => item.tenantId === tenantId);
}

export function getUser(id: string): User | undefined {
  return store.users.find((item) => item.id === id);
}

export function addUser(user: User): User {
  store.users.push(user);
  return user;
}

export function updateUserRoles(id: string, roles: User["roles"]): User | undefined {
  const target = store.users.find((item) => item.id === id);
  if (!target) return undefined;
  target.roles = roles;
  return target;
}

// ========== 新增函数 ==========

/**
 * 获取用户最近活动
 */
export function getUserRecentActivity(
  userId: string,
  limit: number = 20
): {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  details?: Record<string, unknown>;
}[] {
  const userActivity = activityEvents.items.filter(
    (e: ActivityEvent) => e.actorId === userId
  );

  // 按时间倒序
  userActivity.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return userActivity.slice(0, limit).map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    createdAt: e.createdAt,
    details: e.details,
  }));
}

/**
 * 按角色筛选用户
 */
export function getUsersByRole(role: string): User[] {
  return users.findByRole(role);
}

/**
 * 批量启用/禁用用户
 */
export function batchUpdateUserStatus(
  userIds: string[],
  isActive: boolean
): { success: number; failed: number } {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const updated = users.update(userId, { isActive } as Partial<User>);
    if (updated) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * 用户统计：总数、活跃数、按角色分布
 */
export function getUserStats(): {
  total: number;
  active: number;
  byRole: Record<string, number>;
} {
  const allUsers = users.getAll();
  const total = allUsers.length;
  const active = allUsers.filter((u) => u.isActive !== false).length;

  const byRole: Record<string, number> = {};
  for (const u of allUsers) {
    for (const role of u.roles) {
      byRole[role] = (byRole[role] || 0) + 1;
    }
  }

  return { total, active, byRole };
}

/**
 * 获取用户的审计日志
 */
export function getUserAuditLogs(
  userId: string,
  limit: number = 50
): AuditLog[] {
  const logs = auditLogs.findByActorId(userId);
  return logs
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

/**
 * 获取用户参与的审批列表
 */
export function getUserApprovals(userId: string): {
  requested: ApprovalRequest[];
  decided: ApprovalRequest[];
} {
  const allApprovals = approvals.getAll();
  const requested = allApprovals.filter((a) => a.requestedBy === userId);
  const decided = allApprovals.filter((a) => a.decidedBy === userId);
  return { requested, decided };
}

/**
 * 获取用户创建的工单
 */
export function getUserTickets(userId: string): Ticket[] {
  return tickets.findByCreatorId(userId);
}

/**
 * 获取用户被分配的工单
 */
export function getUserAssignedTickets(userId: string): Ticket[] {
  return tickets.findByAssigneeId(userId);
}

/**
 * 获取用户的活跃度摘要
 */
export function getUserActivitySummary(userId: string): {
  totalEvents: number;
  lastActiveAt: string | null;
  eventTypeBreakdown: Record<string, number>;
} {
  const userEvents = activityEvents.items.filter(
    (e: ActivityEvent) => e.actorId === userId
  );

  const eventTypeBreakdown: Record<string, number> = {};
  for (const e of userEvents) {
    eventTypeBreakdown[e.type] = (eventTypeBreakdown[e.type] || 0) + 1;
  }

  let lastActiveAt: string | null = null;
  if (userEvents.length > 0) {
    const sorted = [...userEvents].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    lastActiveAt = sorted[0].createdAt;
  }

  return {
    totalEvents: userEvents.length,
    lastActiveAt,
    eventTypeBreakdown,
  };
}
