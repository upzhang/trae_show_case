import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { ApprovalView, TenantView } from "../lib/api";

const statusLabel: Record<ApprovalView["status"], string> = {
  pending: "待处理",
  approved: "已通过",
  rejected: "已拒绝"
};

export default function ApprovalsPage() {
  const [list, setList] = useState<ApprovalView[]>([]);
  const [tenants, setTenants] = useState<TenantView[]>([]);
  const [title, setTitle] = useState("");

  async function load(): Promise<void> {
    const [approvals, tenantRows] = await Promise.all([
      can("approval:view") ? api.listApprovals() : [],
      can("tenant:view") ? api.listTenants() : []
    ]);
    setList(approvals);
    setTenants(tenantRows);
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  async function create(): Promise<void> {
    if (!title.trim()) {
      window.alert("请填写审批标题");
      return;
    }
    await api.createApproval(title.trim());
    setTitle("");
    load().catch((err) => console.error(err));
  }

  async function approve(id: string): Promise<void> {
    await api.approveApproval(id);
    load().catch((err) => console.error(err));
  }

  async function reject(id: string): Promise<void> {
    await api.rejectApproval(id);
    load().catch((err) => console.error(err));
  }

  const tenantNameById = new Map(tenants.map((item) => [item.id, item.name]));
  const pending = list.filter((item) => item.status === "pending");

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">审批总数</div><div className="value">{list.length}</div></div>
        <div className="stat-card"><div className="label">待处理</div><div className="value">{pending.length}</div></div>
        <div className="stat-card"><div className="label">已通过</div><div className="value">{list.filter((item) => item.status === "approved").length}</div></div>
        <div className="stat-card"><div className="label">已拒绝</div><div className="value">{list.filter((item) => item.status === "rejected").length}</div></div>
      </div>
      <div className="card">
        <h3>发起审批</h3>
        <div className="form-row">
          <input placeholder="审批标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="primary" onClick={create}>发起</button>
        </div>
      </div>
      <div className="card">
        <h3>审批列表</h3>
        {list.length === 0 ? (
          <div className="empty">无权限或无审批</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>客户</th>
                <th>状态</th>
                <th>决定人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
                  <td><span className={`badge ${item.status}`}>{statusLabel[item.status]}</span></td>
                  <td>{item.decidedBy ?? "—"}</td>
                  <td>
                    {can("approval:approve") && item.status === "pending" && (
                      <>
                        <button className="primary" onClick={() => approve(item.id)}>通过</button>{" "}
                        <button className="danger" onClick={() => reject(item.id)}>拒绝</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
