import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { ApprovalView, ReleaseView, SessionView, UserView } from "../lib/api";

interface Props {
  session: SessionView | null;
}

export default function DashboardPage({ session }: Props) {
  const [users, setUsers] = useState<UserView[]>([]);
  const [approvals, setApprovals] = useState<ApprovalView[]>([]);
  const [releases, setReleases] = useState<ReleaseView[]>([]);

  async function load(): Promise<void> {
    const [us, aps, rels] = await Promise.all([
      can("user:view") ? api.listUsers() : [],
      can("approval:view") ? api.listApprovals() : [],
      can("release:view") ? api.listReleases() : []
    ]);
    setUsers(us);
    setApprovals(aps);
    setReleases(rels);
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, [session?.id]);

  const pendingApprovals = approvals.filter((item) => item.status === "pending");

  return (
    <>
      <div className="notice">演示场景下已自动以 {session?.email ?? "未知用户"} 身份登录。请在右上角切换身份验证不同权限。</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">用户</div>
          <div className="value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">待审批</div>
          <div className="value">{pendingApprovals.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">总审批</div>
          <div className="value">{approvals.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">发布记录</div>
          <div className="value">{releases.length}</div>
        </div>
      </div>
      <div className="card">
        <h3>最近审批</h3>
        {approvals.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {approvals.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td><span className={`badge ${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
