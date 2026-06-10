import { store, tenants, users, approvals, supportRisks, activityEvents, tickets } from "../store";

import type { Tenant, ActivityEvent, SupportRisk, Ticket } from "@trae/shared";

export function listTenants(): Tenant[] {
  return store.tenants;
}

export function getTenant(id: string): Tenant | undefined {
  return store.tenants.find((item) => item.id === id);
}

export function updateTenantPlan(id: string, plan: Tenant["plan"]): Tenant | undefined {
  const target = store.tenants.find((item) => item.id === id);
  if (!target) return undefined;
  target.plan = plan;
  return target;
}

// ========== 新增函数 ==========

/**
 * 综合计算租户健康分（基于用户活跃度、工单解决率、风险数量）
 * 公式：基础分 50 + 活跃度分(0-20) + 工单解决分(0-15) + 风险扣分(0-15)
 */
export function getTenantHealthScore(tenantId: string): number {
  const tenant = tenants.get(tenantId);
  if (!tenant) return 0;

  // 1. 活跃度分：基于月活用户占席位数比例 (0-20)
  const activityRatio = tenant.seatsLimit > 0
    ? Math.min(tenant.monthlyActiveUsers / tenant.seatsLimit, 1)
    : 0;
  const activityScore = Math.round(activityRatio * 20);

  // 2. 工单解决分：基于已解决工单占比 (0-15)
  const tenantTickets = tickets.findByTenantId(tenantId);
  const resolvedTickets = tenantTickets.filter((t: Ticket) => t.status === "resolved" || t.status === "closed");
  const ticketResolutionRatio = tenantTickets.length > 0
    ? resolvedTickets.length / tenantTickets.length
    : 1;
  const ticketScore = Math.round(ticketResolutionRatio * 15);

  // 3. 风险扣分：每个未解决风险扣分 (0-15)
  const tenantRisks = supportRisks.findByTenantId(tenantId);
  const openRisks = tenantRisks.filter((r: SupportRisk) =>
    r.status === "open" || r.status === "in_progress"
  );
  const riskPenalty = Math.min(openRisks.length * 3, 15);

  const score = 50 + activityScore + ticketScore - riskPenalty;
  return Math.max(0, Math.min(100, score));
}

/**
 * 按行业统计租户数量和 ARR
 */
export function getIndustryStats(): { industry: string; count: number; totalArr: number }[] {
  const allTenants = tenants.getAll();
  const industryMap = new Map<string, { count: number; totalArr: number }>();

  for (const t of allTenants) {
    const existing = industryMap.get(t.industry);
    if (existing) {
      existing.count += 1;
      existing.totalArr += t.arr;
    } else {
      industryMap.set(t.industry, { count: 1, totalArr: t.arr });
    }
  }

  const result: { industry: string; count: number; totalArr: number }[] = [];
  for (const [industry, stats] of industryMap) {
    result.push({ industry, count: stats.count, totalArr: stats.totalArr });
  }

  // 按 ARR 降序排列
  result.sort((a, b) => b.totalArr - a.totalArr);
  return result;
}

/**
 * 活跃度分析：返回 MAU、趋势和活跃用户数
 * 趋势通过对比最近两周的活动事件数量判断
 */
export function getActivityAnalysis(tenantId: string): {
  mau: number;
  trend: "up" | "down" | "stable";
  activeUsers: number;
} {
  const tenant = tenants.get(tenantId);
  if (!tenant) {
    return { mau: 0, trend: "stable", activeUsers: 0 };
  }

  // 获取该租户的所有活动事件
  const events = activityEvents.findByTenantId(tenantId);

  // 计算最近两周的活动趋势
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekEvents = events.filter((e: ActivityEvent) =>
    new Date(e.createdAt) >= oneWeekAgo
  );
  const lastWeekEvents = events.filter((e: ActivityEvent) =>
    new Date(e.createdAt) >= twoWeeksAgo && new Date(e.createdAt) < oneWeekAgo
  );

  let trend: "up" | "down" | "stable" = "stable";
  if (thisWeekEvents.length > lastWeekEvents.length * 1.1) {
    trend = "up";
  } else if (thisWeekEvents.length < lastWeekEvents.length * 0.9) {
    trend = "down";
  }

  // 统计活跃用户（有活动事件的去重用户数）
  const activeUserIds = new Set<string>();
  for (const e of events) {
    activeUserIds.add(e.actorId);
  }

  return {
    mau: tenant.monthlyActiveUsers,
    trend,
    activeUsers: activeUserIds.size,
  };
}

/**
 * 租户综合摘要：用户数、风险数、工单数、审批数
 */
export function getTenantSummary(tenantId: string): {
  tenant: Tenant | undefined;
  userCount: number;
  riskCount: number;
  openRiskCount: number;
  ticketCount: number;
  openTicketCount: number;
  approvalCount: number;
  pendingApprovalCount: number;
  healthScore: number;
} {
  const tenant = tenants.get(tenantId);
  const tenantUsers = users.findByTenantId(tenantId);
  const tenantRisks = supportRisks.findByTenantId(tenantId);
  const tenantTickets = tickets.findByTenantId(tenantId);
  const tenantApprovals = approvals.findByTenantId(tenantId);

  const openRisks = tenantRisks.filter((r: SupportRisk) =>
    r.status === "open" || r.status === "in_progress"
  );
  const openTickets = tenantTickets.filter((t: Ticket) =>
    t.status === "new" || t.status === "open" || t.status === "in_progress"
  );
  const pendingApprovals = tenantApprovals.filter((a) => a.status === "pending");

  return {
    tenant,
    userCount: tenantUsers.length,
    riskCount: tenantRisks.length,
    openRiskCount: openRisks.length,
    ticketCount: tenantTickets.length,
    openTicketCount: openTickets.length,
    approvalCount: tenantApprovals.length,
    pendingApprovalCount: pendingApprovals.length,
    healthScore: getTenantHealthScore(tenantId),
  };
}
