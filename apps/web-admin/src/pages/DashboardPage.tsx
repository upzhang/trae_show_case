import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type {
  ActivityEventView,
  ApprovalView,
  ReleaseView,
  SessionView,
  SupportRiskView,
  TenantView,
  UserView
} from "../lib/api";

interface Props {
  session: SessionView | null;
}

export default function DashboardPage({ session }: Props) {
  const [tenants, setTenants] = useState<TenantView[]>([]);
  const [users, setUsers] = useState<UserView[]>([]);
  const [approvals, setApprovals] = useState<ApprovalView[]>([]);
  const [releases, setReleases] = useState<ReleaseView[]>([]);
  const [risks, setRisks] = useState<SupportRiskView[]>([]);
  const [activities, setActivities] = useState<ActivityEventView[]>([]);

  async function load(): Promise<void> {
    const [tenantRows, us, aps, rels, riskRows, activityRows] = await Promise.all([
      can("tenant:view") ? api.listTenants() : [],
      can("user:view") ? api.listUsers() : [],
      can("approval:view") ? api.listApprovals() : [],
      can("release:view") ? api.listReleases() : [],
      can("tenant:view") ? api.listSupportRisks() : [],
      can("tenant:view") ? api.listActivityEvents() : []
    ]);
    setTenants(tenantRows);
    setUsers(us);
    setApprovals(aps);
    setReleases(rels);
    setRisks(riskRows);
    setActivities(activityRows);
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, [session?.id]);

  const pendingApprovals = approvals.filter((item) => item.status === "pending");
  const activeRisks = risks.filter((item) => item.status !== "resolved");
  const totalArr = tenants.reduce((sum, tenant) => sum + tenant.arr, 0);
  const averageHealth = tenants.length
    ? Math.round(tenants.reduce((sum, tenant) => sum + tenant.healthScore, 0) / tenants.length)
    : 0;
  const releaseHealth = releases.length
    ? Math.round((releases.filter((item) => item.status === "deployed").length / releases.length) * 100)
    : 0;
  const deployedReleases = releases.filter((item) => item.status === "deployed");
  const rolledBack = releases.filter((item) => item.status === "rolled_back");
  const memberUsers = users.length;

  const tenantNameById = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0
    }).format(value);

  return (
    <>
      <div className="notice">
        当前以 {session?.email ?? "未知用户"} 身份查看客户运营数据。你的权限角色决定了可见的客户、审批、发布事件与审计范围。
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">年度经常性收入 (ARR)</div>
          <div className="value">{formatCurrency(totalArr)}</div>
        </div>
        <div className="stat-card">
          <div className="label">活跃客户</div>
          <div className="value">{tenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">待处理审批</div>
          <div className="value">{pendingApprovals.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">活跃风险工单</div>
          <div className="value">{activeRisks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">成功发布数</div>
          <div className="value">{deployedReleases.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">回滚发布数</div>
          <div className="value">{rolledBack.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">客户平均健康分</div>
          <div className="value">{averageHealth}</div>
        </div>
        <div className="stat-card">
          <div className="label">平台成员数</div>
          <div className="value">{memberUsers}</div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <h3>风险与工单队列</h3>
          {risks.length === 0 ? (
            <div className="empty">暂无可见风险工单</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>客户</th>
                  <th>标题</th>
                  <th>级别</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {risks.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
                    <td>{item.title}</td>
                    <td><span className={`badge severity-${item.severity}`}>{item.severity}</span></td>
                    <td>{item.slaDueAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h3>最近活动</h3>
          {activities.length === 0 ? (
            <div className="empty">暂无可见活动</div>
          ) : (
            <div className="activity-list">
              {activities.slice(0, 8).map((item) => (
                <div className="activity-item" key={item.id}>
                  <span className="activity-type">{item.type}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{tenantNameById.get(item.tenantId) ?? item.tenantId} · {item.actorId} · {item.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <h3>发布健康与最近审批</h3>
        {approvals.length === 0 && releases.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>类型</th>
                <th>对象</th>
                <th>客户</th>
                <th>当前状态</th>
              </tr>
            </thead>
            <tbody>
              {approvals.slice(0, 3).map((item) => (
                <tr key={item.id}>
                  <td>审批</td>
                  <td>{item.title}</td>
                  <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
                  <td><span className={`badge ${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
              {releases.slice(0, 3).map((item) => (
                <tr key={item.id}>
                  <td>发布</td>
                  <td>{item.version} / {item.environment}</td>
                  <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
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
