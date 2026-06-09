import { store } from "../store";

import type { ApprovalRequest } from "@trae/shared";

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
