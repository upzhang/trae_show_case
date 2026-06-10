import { tenants, users, approvals, releases, supportRisks, tickets, subscriptions } from "../store";
import type { Tenant, User, ApprovalRequest, ReleaseRecord, SupportRisk, Ticket, Subscription } from "@trae/shared";

/** 平台总览指标 */
export interface MetricsOverview {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalApprovals: number;
  approvalRate: number;
  totalReleases: number;
  releaseSuccessRate: number;
  totalTickets: number;
  openTickets: number;
  totalRisks: number;
  criticalRisks: number;
  mrr: number;
  mrrGrowth: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
}

/** 趋势数据点 */
export interface TrendDataPoint {
  date: string;
  value: number;
}

/** 健康分布 */
export interface HealthDistribution {
  good: number;
  watch: number;
  risk: number;
}

/** 发布统计 */
export interface ReleaseStats {
  total: number;
  deployed: number;
  rolledBack: number;
  pending: number;
  byEnvironment: Record<string, number>;
}

/** 审批统计 */
export interface ApprovalStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  avgResponseHours: number;
}

/** 计算平台总览指标 */
export function getOverview(): MetricsOverview {
  const allTenants: Tenant[] = tenants.getAll();
  const allUsers: User[] = users.getAll();
  const allApprovals: ApprovalRequest[] = approvals.getAll();
  const allReleases: ReleaseRecord[] = releases.getAll();
  const allTickets: Ticket[] = tickets.getAll();
  const allRisks: SupportRisk[] = supportRisks.getAll();
  const allSubscriptions: Subscription[] = subscriptions.getAll();

  const activeTenants = allTenants.filter((t: Tenant) => t.healthScore !== undefined && t.healthScore >= 60).length;
  const approvedApprovals = allApprovals.filter((a: ApprovalRequest) => a.status === "approved").length;
  const approvalRate = allApprovals.length > 0 ? Math.round((approvedApprovals / allApprovals.length) * 100) : 0;
  const deployedReleases = allReleases.filter((r: ReleaseRecord) => r.status === "deployed").length;
  const releaseSuccessRate = allReleases.length > 0 ? Math.round((deployedReleases / allReleases.length) * 100) : 0;
  const openTickets = allTickets.filter((t: Ticket) => t.status !== "closed" && t.status !== "resolved").length;
  const criticalRisks = allRisks.filter((r: SupportRisk) => r.severity === "critical").length;
  const activeSubs = allSubscriptions.filter((s: Subscription) => s.status === "active").length;
  const trialSubs = allSubscriptions.filter((s: Subscription) => s.status === "trial").length;

  const mrr = activeSubs * 999 + trialSubs * 199;
  const mrrGrowth = 12.5;

  return {
    totalTenants: allTenants.length,
    activeTenants,
    totalUsers: allUsers.length,
    totalApprovals: allApprovals.length,
    approvalRate,
    totalReleases: allReleases.length,
    releaseSuccessRate,
    totalTickets: allTickets.length,
    openTickets,
    totalRisks: allRisks.length,
    criticalRisks,
    mrr,
    mrrGrowth,
    activeSubscriptions: activeSubs,
    trialSubscriptions: trialSubs,
  };
}

/** 生成趋势数据 */
export function getTrends(range: string): TrendDataPoint[] {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const points: TrendDataPoint[] = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const baseValue = 50 + Math.sin(i * 0.3) * 20 + Math.random() * 10;
    points.push({
      date: dateStr,
      value: Math.round(baseValue),
    });
  }

  return points;
}

/** 获取健康分布 */
export function getHealthDistribution(): HealthDistribution {
  const allTenants: Tenant[] = tenants.getAll();
  const good = allTenants.filter((t: Tenant) => (t.healthScore ?? 0) >= 80).length;
  const watch = allTenants.filter((t: Tenant) => {
    const score = t.healthScore ?? 0;
    return score >= 50 && score < 80;
  }).length;
  const risk = allTenants.filter((t: Tenant) => (t.healthScore ?? 0) < 50).length;

  return { good, watch, risk };
}

/** 获取发布统计 */
export function getReleaseStats(): ReleaseStats {
  const allReleases: ReleaseRecord[] = releases.getAll();
  const deployed = allReleases.filter((r: ReleaseRecord) => r.status === "deployed").length;
  const rolledBack = allReleases.filter((r: ReleaseRecord) => r.status === "rolled_back").length;
  const pending = allReleases.filter((r: ReleaseRecord) => r.status === "pending").length;

  const byEnvironment: Record<string, number> = {};
  for (const r of allReleases) {
    const env = r.environment ?? "unknown";
    byEnvironment[env] = (byEnvironment[env] || 0) + 1;
  }

  return {
    total: allReleases.length,
    deployed,
    rolledBack,
    pending,
    byEnvironment,
  };
}

/** 获取审批统计 */
export function getApprovalStats(): ApprovalStats {
  const allApprovals: ApprovalRequest[] = approvals.getAll();
  const approved = allApprovals.filter((a: ApprovalRequest) => a.status === "approved").length;
  const rejected = allApprovals.filter((a: ApprovalRequest) => a.status === "rejected").length;
  const pending = allApprovals.filter((a: ApprovalRequest) => a.status === "pending").length;

  return {
    total: allApprovals.length,
    approved,
    rejected,
    pending,
    avgResponseHours: 4.2,
  };
}
