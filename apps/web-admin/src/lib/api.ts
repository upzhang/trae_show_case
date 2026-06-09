import { fetchHeaders } from "./session";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...fetchHeaders(),
      ...(init?.headers ?? {})
    }
  });
  const text = await res.text();
  const payload = text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  if (!res.ok) {
    throw new Error((payload as { error?: string })?.error ?? `HTTP ${res.status}`);
  }
  return payload;
}

export interface SessionView {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId: string;
}

export interface ApprovalView {
  id: string;
  tenantId: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  decidedBy?: string;
}

export interface ReleaseView {
  id: string;
  tenantId: string;
  version: string;
  environment: "staging" | "production";
  status: "pending" | "deployed" | "rolled_back";
  operatorId: string;
  createdAt: string;
  description?: string;
}

export interface AuditLogView {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface UserView {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: string[];
}

export interface TenantView {
  id: string;
  name: string;
  plan: "standard" | "enterprise";
}

export const api = {
  me: () => request<SessionView>("/api/session/me"),
  findUserByEmail: (email: string) =>
    request<SessionView | { error: string }>(`/api/users/by-email/${encodeURIComponent(email)}`),
  listTenants: () => request<TenantView[]>("/api/tenants"),
  listUsers: () => request<UserView[]>("/api/users"),
  listApprovals: () => request<ApprovalView[]>("/api/approvals"),
  listReleases: () => request<ReleaseView[]>("/api/releases"),
  listAuditLogs: () => request<AuditLogView[]>("/api/audit-logs"),
  approveApproval: (id: string) =>
    request<ApprovalView>(`/api/approvals/${id}/approve`, { method: "PUT" }),
  rejectApproval: (id: string) =>
    request<ApprovalView>(`/api/approvals/${id}/reject`, { method: "PUT" }),
  deployRelease: (id: string) =>
    request<ReleaseView>(`/api/releases/${id}/deploy`, { method: "PUT" }),
  rollbackRelease: (id: string) =>
    request<ReleaseView>(`/api/releases/${id}/rollback`, { method: "PUT" }),
  updateUserRoles: (id: string, roles: string[]) =>
    request<UserView>(`/api/users/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles })
    }),
  createApproval: (title: string) =>
    request<ApprovalView>("/api/approvals", {
      method: "POST",
      body: JSON.stringify({ title })
    }),
  createUser: (payload: { name: string; email: string; roles: string[] }) =>
    request<UserView>("/api/users", { method: "POST", body: JSON.stringify(payload) })
};
