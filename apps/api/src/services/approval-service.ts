import { store, approvals, users, auditLogs } from "../store";

import type { ApprovalRequest, User, AuditLog } from "@trae/shared";

export function listApprovals(tenantId?: string): ApprovalRequest[] {
  if (!tenantId) return store.approvals;
  return store.approvals.filter((item) => item.tenantId === tenantId);
}

export function getApproval(id: string): ApprovalRequest | undefined {
  return store.approvals.find((item) => item.id === id);
}

// 预置缺陷 3 — 审批流缺陷：重复审批未拦截
// 设计：当前 approveApproval 不会校验审批当前状态，可能将已通过的审批再次标记为 rejected，
// 也允许同一个审批被重复通过多次。
export function approveApproval(id: string, decidedBy: string): ApprovalRequest | undefined {
  const target = store.approvals.find((item) => item.id === id);
  if (!target) return undefined;
  target.status = "approved";
  target.decidedBy = decidedBy;
  return target;
}

export function rejectApproval(id: string, decidedBy: string): ApprovalRequest | undefined {
  const target = store.approvals.find((item) => item.id === id);
  if (!target) return undefined;
  target.status = "rejected";
  target.decidedBy = decidedBy;
  return target;
}

export function createApproval(input: Omit<ApprovalRequest, "id" | "status">): ApprovalRequest {
  const next: ApprovalRequest = {
    ...input,
    id: `ap-${Date.now()}`,
    status: "pending"
  };
  store.approvals.push(next);
  return next;
}

// ========== 新增函数 ==========

/**
 * 构建审批链：根据租户的角色结构生成多级审批步骤
 * 审批链顺序：member -> tenant_admin -> platform_admin
 */
export function buildApprovalChain(tenantId: string): {
  step: number;
  role: string;
  approverId?: string;
}[] {
  const chain: { step: number; role: string; approverId?: string }[] = [];

  // 步骤 1: 租户管理员审批
  const tenantAdmins = users.findByRole("tenant_admin").filter(
    (u: User) => u.tenantId === tenantId
  );
  chain.push({
    step: 1,
    role: "tenant_admin",
    approverId: tenantAdmins.length > 0 ? tenantAdmins[0].id : undefined,
  });

  // 步骤 2: 平台管理员审批（跨租户）
  const platformAdmins = users.findByRole("platform_admin");
  chain.push({
    step: 2,
    role: "platform_admin",
    approverId: platformAdmins.length > 0 ? platformAdmins[0].id : undefined,
  });

  // 步骤 3: 审计员复核（如果租户有审计员）
  const auditors = users.findByRole("auditor").filter(
    (u: User) => u.tenantId === tenantId
  );
  if (auditors.length > 0) {
    chain.push({
      step: 3,
      role: "auditor",
      approverId: auditors[0].id,
    });
  }

  return chain;
}

/**
 * 审批统计汇总
 */
export function getApprovalStats(): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgResponseHours: number;
} {
  const allApprovals = approvals.getAll();
  const total = allApprovals.length;
  const pending = allApprovals.filter((a) => a.status === "pending").length;
  const approved = allApprovals.filter((a) => a.status === "approved").length;
  const rejected = allApprovals.filter((a) => a.status === "rejected").length;

  // 计算平均响应时间（从创建到决定的小时数）
  const decidedApprovals = allApprovals.filter(
    (a) => a.status !== "pending" && a.createdAt && a.decidedAt
  );
  let totalResponseHours = 0;
  for (const a of decidedApprovals) {
    const created = new Date(a.createdAt!).getTime();
    const decided = new Date(a.decidedAt!).getTime();
    totalResponseHours += (decided - created) / (1000 * 60 * 60);
  }
  const avgResponseHours =
    decidedApprovals.length > 0
      ? Math.round((totalResponseHours / decidedApprovals.length) * 100) / 100
      : 0;

  return { total, pending, approved, rejected, avgResponseHours };
}

/**
 * 审批时间线：从审计日志中提取审批相关操作记录
 */
export function getApprovalTimeline(approvalId: string): {
  action: string;
  actorId: string;
  timestamp: string;
  comment?: string;
}[] {
  const approval = approvals.get(approvalId);
  if (!approval) return [];

  const timeline: {
    action: string;
    actorId: string;
    timestamp: string;
    comment?: string;
  }[] = [];

  // 创建事件
  if (approval.createdAt) {
    timeline.push({
      action: "created",
      actorId: approval.requestedBy,
      timestamp: approval.createdAt,
      comment: approval.description,
    });
  }

  // 决定事件
  if (approval.status !== "pending" && approval.decidedBy && approval.decidedAt) {
    timeline.push({
      action: approval.status === "approved" ? "approved" : "rejected",
      actorId: approval.decidedBy,
      timestamp: approval.decidedAt,
    });
  }

  // 从审计日志中查找相关记录
  const relatedLogs = auditLogs.items.filter(
    (log: AuditLog) =>
      log.resourceType === "approval" && log.resourceId === approvalId
  );
  for (const log of relatedLogs) {
    timeline.push({
      action: log.action,
      actorId: log.actorId,
      timestamp: log.createdAt,
      comment: log.summary || undefined,
    });
  }

  // 按时间排序
  timeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return timeline;
}

/**
 * 检查超时审批：返回创建超过 48 小时仍未处理的审批
 */
export function checkAutoTimeout(): {
  id: string;
  hoursSinceCreated: number;
}[] {
  const pendingApprovals = approvals.findPending();
  const now = new Date();
  const timeoutThresholdHours = 48;

  const timedOut: { id: string; hoursSinceCreated: number }[] = [];

  for (const a of pendingApprovals) {
    if (!a.createdAt) continue;
    const created = new Date(a.createdAt).getTime();
    const hoursSinceCreated = (now.getTime() - created) / (1000 * 60 * 60);

    if (hoursSinceCreated > timeoutThresholdHours) {
      timedOut.push({
        id: a.id,
        hoursSinceCreated: Math.round(hoursSinceCreated * 100) / 100,
      });
    }
  }

  // 按超时时长降序
  timedOut.sort((a, b) => b.hoursSinceCreated - a.hoursSinceCreated);

  return timedOut;
}
