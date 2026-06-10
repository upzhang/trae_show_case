import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { StatCard } from "../components/StatCard";
import { Sparkline } from "../components/Sparkline";
import { ProgressBar } from "../components/ProgressBar";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";

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

const activityTypeLabel: Record<string, string> = {
  user: "用户",
  approval: "审批",
  release: "发布",
  audit: "审计",
  risk: "风险",
  billing: "账单",
  ticket: "工单",
};

const activityTypeIcon: Record<string, string> = {
  user: "user",
  approval: "check",
  release: "arrow-up",
  audit: "search",
  risk: "warning",
  billing: "star",
  ticket: "edit",
};

const activityTypeColor: Record<string, string> = {
  user: "#2563eb",
  approval: "#7c3aed",
  release: "#16a34a",
  audit: "#6b7280",
  risk: "#dc2626",
  billing: "#ea580c",
  ticket: "#0891b2",
};

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

  // Additional metrics
  const approvedApprovals = approvals.filter((item) => item.status === "approved");
  const approvalRate = approvals.length
    ? Math.round((approvedApprovals.length / approvals.length) * 100)
    : 0;
  const releaseSuccessRate = releases.length
    ? Math.round((deployedReleases.length / releases.length) * 100)
    : 0;
  const resolvedRisks = risks.filter((item) => item.status === "resolved");
  const riskResolutionRate = risks.length
    ? Math.round((resolvedRisks.length / risks.length) * 100)
    : 0;

  // Health score distribution
  const healthDistribution = useMemo(() => {
    const good = tenants.filter((t) => t.healthScore >= 80).length;
    const watch = tenants.filter((t) => t.healthScore >= 50 && t.healthScore < 80).length;
    const risk = tenants.filter((t) => t.healthScore < 50).length;
    return { good, watch, risk };
  }, [tenants]);

  // Trend data
  const tenantTrendData = useMemo(() => {
    if (tenants.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const groups: Record<string, number> = {};
    tenants.forEach((t) => {
      const day = t.contractEndsAt?.split("T")[0] || "2025-01-01";
      groups[day] = (groups[day] || 0) + 1;
    });
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    const cumulative: number[] = [];
    let sum = 0;
    sorted.forEach(([, count]) => {
      sum += count;
      cumulative.push(sum);
    });
    return cumulative.length > 1 ? cumulative : [0, 1, 2, 3, 4, 5, 6];
  }, [tenants]);

  const approvalTrendData = useMemo(() => {
    if (approvals.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const groups: Record<string, number> = {};
    approvals.forEach((a) => {
      const day = (a as any).createdAt?.split("T")[0] || "2025-01-01";
      groups[day] = (groups[day] || 0) + 1;
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, count]) => count);
  }, [approvals]);

  const releaseTrendData = useMemo(() => {
    if (releases.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const groups: Record<string, number> = {};
    releases.forEach((r) => {
      const day = r.createdAt?.split("T")[0] || "2025-01-01";
      groups[day] = (groups[day] || 0) + 1;
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, count]) => count);
  }, [releases]);

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

      {/* Primary metrics */}
      <div className="stat-grid">
        <StatCard
          title="年度经常性收入 (ARR)"
          value={formatCurrency(totalArr)}
          icon="star"
          color="blue"
        />
        <StatCard
          title="活跃客户"
          value={tenants.length}
          icon="user"
          color="green"
        />
        <StatCard
          title="待处理审批"
          value={pendingApprovals.length}
          icon="clock"
          color="orange"
        />
        <StatCard
          title="活跃风险工单"
          value={activeRisks.length}
          icon="warning"
          color="red"
        />
      </div>

      {/* Secondary metrics */}
      <div className="stat-grid">
        <StatCard
          title="审批通过率"
          value={`${approvalRate}%`}
          icon="check"
          color="purple"
          subtitle={`${approvedApprovals.length}/${approvals.length} 已通过`}
        />
        <StatCard
          title="发布成功率"
          value={`${releaseSuccessRate}%`}
          icon="arrow-up"
          color="green"
          subtitle={`${deployedReleases.length}/${releases.length} 成功`}
        />
        <StatCard
          title="工单解决率"
          value={`${riskResolutionRate}%`}
          icon="edit"
          color="blue"
          subtitle={`${resolvedRisks.length}/${risks.length} 已解决`}
        />
        <StatCard
          title="平台成员数"
          value={memberUsers}
          icon="user"
          color="orange"
        />
      </div>

      {/* Trend charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className="chart-container">
          <div className="chart-header">
            <h4 className="chart-title">租户增长趋势</h4>
            <p className="chart-subtitle">累计租户数</p>
          </div>
          <div className="chart-body" style={{ justifyContent: "flex-start", padding: "8px 0" }}>
            <Sparkline
              data={tenantTrendData}
              width={200}
              height={50}
              color="#2563eb"
            />
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-header">
            <h4 className="chart-title">审批量趋势</h4>
            <p className="chart-subtitle">按日期分布</p>
          </div>
          <div className="chart-body" style={{ justifyContent: "flex-start", padding: "8px 0" }}>
            <Sparkline
              data={approvalTrendData.length > 1 ? approvalTrendData : [0, 1, 2, 3, 2, 1, 2]}
              width={200}
              height={50}
              color="#7c3aed"
            />
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-header">
            <h4 className="chart-title">发布量趋势</h4>
            <p className="chart-subtitle">按日期分布</p>
          </div>
          <div className="chart-body" style={{ justifyContent: "flex-start", padding: "8px 0" }}>
            <Sparkline
              data={releaseTrendData.length > 1 ? releaseTrendData : [0, 1, 0, 2, 1, 0, 1]}
              width={200}
              height={50}
              color="#16a34a"
            />
          </div>
        </div>
      </div>

      {/* Health distribution + Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <h3>客户健康分布</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>健康 (80-100)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#065f46" }}>
                  {healthDistribution.good} 个租户
                </span>
              </div>
              <ProgressBar
                value={tenants.length ? (healthDistribution.good / tenants.length) * 100 : 0}
                color="green"
                size="lg"
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>观察 (50-79)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  {healthDistribution.watch} 个租户
                </span>
              </div>
              <ProgressBar
                value={tenants.length ? (healthDistribution.watch / tenants.length) * 100 : 0}
                color="orange"
                size="lg"
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>风险 (&lt;50)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
                  {healthDistribution.risk} 个租户
                </span>
              </div>
              <ProgressBar
                value={tenants.length ? (healthDistribution.risk / tenants.length) * 100 : 0}
                color="red"
                size="lg"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>快速操作</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            <Button variant="secondary" size="md" icon="plus" onClick={() => window.location.hash = "#/tenants"}>
              创建租户
            </Button>
            <Button variant="secondary" size="md" icon="edit" onClick={() => window.location.hash = "#/approvals"}>
              发起审批
            </Button>
            <Button variant="secondary" size="md" icon="arrow-up" onClick={() => window.location.hash = "#/releases"}>
              创建发布
            </Button>
            <Button variant="secondary" size="md" icon="warning" onClick={() => window.location.hash = "#/support-risks"}>
              提交工单
            </Button>
            <Button variant="secondary" size="md" icon="user" onClick={() => window.location.hash = "#/users"}>
              管理用户
            </Button>
            <Button variant="secondary" size="md" icon="search" onClick={() => window.location.hash = "#/audit-logs"}>
              查看审计
            </Button>
          </div>
        </div>
      </div>

      {/* Risk queue + Activity timeline */}
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
                  <span
                    className="activity-type"
                    style={{
                      background: `${activityTypeColor[item.type] || "#6b7280"}20`,
                      color: activityTypeColor[item.type] || "#6b7280",
                    }}
                  >
                    <Icon name={(activityTypeIcon[item.type] || "info") as any} size={12} />
                    <span style={{ marginLeft: 4 }}>{activityTypeLabel[item.type] || item.type}</span>
                  </span>
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

      {/* Release health + Recent approvals */}
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
