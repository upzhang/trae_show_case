import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { SearchInput } from "../components/SearchInput";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Sparkline } from "../components/Sparkline";
import { Icon } from "../components/Icon";

import type { SupportRiskView, TenantView } from "../lib/api";

const severityLabel: Record<SupportRiskView["severity"], string> = {
  critical: "P0 严重",
  high: "P1 高",
  medium: "P2 中",
  low: "P3 低"
};

const severityBadgeVariant: Record<SupportRiskView["severity"], "danger" | "warning" | "info" | "default"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
};

const statusLabel: Record<SupportRiskView["status"], string> = {
  open: "待处理",
  in_progress: "处理中",
  waiting_customer: "待客户",
  resolved: "已解决"
};

const statusBadgeVariant: Record<SupportRiskView["status"], "danger" | "warning" | "info" | "success"> = {
  open: "danger",
  in_progress: "warning",
  waiting_customer: "info",
  resolved: "success",
};

const categoryLabel: Record<string, string> = {
  support: "技术支持",
  security: "安全",
  adoption: "客户采用",
  billing: "账单",
  release: "发布相关"
};

const severityOptions = ["全部", "严重", "高", "中", "低"] as const;
const severityMap: Record<string, string> = {
  "严重": "critical",
  "高": "high",
  "中": "medium",
  "低": "low",
};

const statusOptions = ["全部", "待处理", "处理中", "已解决"] as const;
const statusMap: Record<string, string> = {
  "待处理": "open",
  "处理中": "in_progress",
  "已解决": "resolved",
};

export default function SupportRisksPage() {
  const [risks, setRisks] = useState<SupportRiskView[]>([]);
  const [tenants, setTenants] = useState<TenantView[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");

  // Detail modal
  const [selectedRisk, setSelectedRisk] = useState<SupportRiskView | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    if (!can("tenant:view")) {
      setRisks([]);
      setTenants([]);
      setLoading(false);
      return;
    }
    try {
      const [riskRows, tenantRows] = await Promise.all([
        api.listSupportRisks(),
        api.listTenants()
      ]);
      setRisks(riskRows);
      setTenants(tenantRows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  const tenantNameById = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    [tenants]
  );

  // Filtering
  const filtered = useMemo(() => {
    let result = [...risks];

    if (severityFilter !== "全部") {
      const mapped = severityMap[severityFilter];
      result = result.filter((item) => item.severity === mapped);
    }

    if (statusFilter !== "全部") {
      const mapped = statusMap[statusFilter];
      result = result.filter((item) => item.status === mapped);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.impact.toLowerCase().includes(q) ||
          item.ownerId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [risks, severityFilter, statusFilter, search]);

  // Stats
  const openRisks = risks.filter((item) => item.status !== "resolved");
  const criticalRisks = risks.filter((item) => item.severity === "critical");
  const resolvedRisks = risks.filter((item) => item.status === "resolved");
  const slaAtRisk = risks.filter((item) => {
    if (item.status === "resolved") return false;
    const now = new Date();
    const sla = new Date(item.slaDueAt);
    return sla < now;
  });

  // Trend data: simulate severity distribution over last 7 "days" based on risk count
  const trendData = useMemo(() => {
    if (risks.length === 0) return [];
    const groups: Record<string, number> = {};
    risks.forEach((r) => {
      const day = r.createdAt.split("T")[0];
      groups[day] = (groups[day] || 0) + 1;
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, count]) => count);
  }, [risks]);

  const severityTrendData = useMemo(() => {
    if (risks.length === 0) return [];
    const groups: Record<string, number> = {};
    risks
      .filter((r) => r.severity === "critical" || r.severity === "high")
      .forEach((r) => {
        const day = r.createdAt.split("T")[0];
        groups[day] = (groups[day] || 0) + 1;
      });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, count]) => count);
  }, [risks]);

  function handleResetFilters() {
    setSearch("");
    setSeverityFilter("全部");
    setStatusFilter("全部");
  }

  function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getSlaStatus(slaDueAt: string, status: SupportRiskView["status"]): "overdue" | "warning" | "normal" {
    if (status === "resolved") return "normal";
    const now = new Date();
    const sla = new Date(slaDueAt);
    const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 0) return "overdue";
    if (hoursLeft < 24) return "warning";
    return "normal";
  }

  return (
    <>
      <PageHeader
        title="风险与工单"
        description="运营平台记录的客户报告与内部风险事件，工单状态、严重级别与 SLA 驱动响应策略"
        actions={
          <div className="page-header-actions">
            <Button variant="secondary" size="sm" icon="refresh" onClick={load}>
              刷新
            </Button>
          </div>
        }
      />

      <div className="stat-grid">
        <StatCard
          title="风险工单数"
          value={risks.length}
          icon="warning"
          color="blue"
        />
        <StatCard
          title="未解决"
          value={openRisks.length}
          icon="clock"
          color="orange"
        />
        <StatCard
          title="P0 严重"
          value={criticalRisks.length}
          icon="x"
          color="red"
        />
        <StatCard
          title="SLA 逾期"
          value={slaAtRisk.length}
          icon="bell"
          color={slaAtRisk.length > 0 ? "red" : "green"}
          subtitle={slaAtRisk.length > 0 ? "需立即处理" : "全部达标"}
        />
      </div>

      {/* Trend mini charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="chart-container">
          <div className="chart-header">
            <h4 className="chart-title">风险工单趋势</h4>
            <p className="chart-subtitle">按创建日期分布</p>
          </div>
          <div className="chart-body" style={{ justifyContent: "flex-start", padding: "8px 0" }}>
            <Sparkline
              data={trendData.length > 1 ? trendData : [0, 1, 2, 3, 4, 5, 6]}
              width={280}
              height={60}
              color="#2563eb"
            />
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-header">
            <h4 className="chart-title">严重/高风险趋势</h4>
            <p className="chart-subtitle">P0/P1 级别工单分布</p>
          </div>
          <div className="chart-body" style={{ justifyContent: "flex-start", padding: "8px 0" }}>
            <Sparkline
              data={severityTrendData.length > 1 ? severityTrendData : [0, 0, 1, 2, 1, 0, 1]}
              width={280}
              height={60}
              color="#dc2626"
            />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <SearchInput
            placeholder="按标题、工单编号、影响面搜索..."
            value={search}
            onChange={setSearch}
          />
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            {severityOptions.map((s) => (
              <option key={s} value={s}>
                {s === "全部" ? "全部严重级别" : s}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "全部" ? "全部状态" : s}
              </option>
            ))}
          </select>
          {(search || severityFilter !== "全部" || statusFilter !== "全部") && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              重置筛选
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="empty">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">无权限或暂无匹配的风险工单</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>工单编号</th>
                <th>标题</th>
                <th>客户</th>
                <th>类别</th>
                <th>严重级别</th>
                <th>状态</th>
                <th>SLA 到期时间</th>
                <th>负责人</th>
                <th>影响面</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((risk) => {
                const slaStatus = getSlaStatus(risk.slaDueAt, risk.status);
                return (
                  <tr key={risk.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{risk.id}</td>
                    <td>{risk.title}</td>
                    <td>{tenantNameById.get(risk.tenantId) ?? risk.tenantId}</td>
                    <td>{categoryLabel[risk.category] ?? risk.category}</td>
                    <td>
                      <Badge variant={severityBadgeVariant[risk.severity]} size="sm">
                        {severityLabel[risk.severity]}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={statusBadgeVariant[risk.status]} size="sm">
                        {statusLabel[risk.status]}
                      </Badge>
                    </td>
                    <td>
                      <span
                        style={{
                          color: slaStatus === "overdue" ? "#dc2626" : slaStatus === "warning" ? "#ea580c" : "#374151",
                          fontWeight: slaStatus === "overdue" ? 600 : 400,
                        }}
                      >
                        {risk.slaDueAt}
                        {slaStatus === "overdue" && " (已逾期)"}
                        {slaStatus === "warning" && " (即将到期)"}
                      </span>
                    </td>
                    <td>{risk.ownerId}</td>
                    <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {risk.impact}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="eye"
                        onClick={() => setSelectedRisk(risk)}
                      >
                        详情
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={selectedRisk !== null}
        onClose={() => setSelectedRisk(null)}
        title="风险工单详情"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedRisk(null)}>
            关闭
          </Button>
        }
      >
        {selectedRisk && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">工单编号</span>
                <span className="detail-value" style={{ fontFamily: "monospace" }}>
                  {selectedRisk.id}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">创建时间</span>
                <span className="detail-value">{formatDateTime(selectedRisk.createdAt)}</span>
              </div>
              <div className="detail-item detail-full">
                <span className="detail-label">标题</span>
                <span className="detail-value" style={{ fontWeight: 600 }}>
                  {selectedRisk.title}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">严重级别</span>
                <span className="detail-value">
                  <Badge variant={severityBadgeVariant[selectedRisk.severity]} size="sm">
                    {severityLabel[selectedRisk.severity]}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态</span>
                <span className="detail-value">
                  <Badge variant={statusBadgeVariant[selectedRisk.status]} size="sm">
                    {statusLabel[selectedRisk.status]}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">类别</span>
                <span className="detail-value">
                  {categoryLabel[selectedRisk.category] ?? selectedRisk.category}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">客户</span>
                <span className="detail-value">
                  {tenantNameById.get(selectedRisk.tenantId) ?? selectedRisk.tenantId}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">负责人</span>
                <span className="detail-value">{selectedRisk.ownerId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">SLA 到期时间</span>
                <span className="detail-value">
                  {selectedRisk.slaDueAt}
                  {getSlaStatus(selectedRisk.slaDueAt, selectedRisk.status) === "overdue" && (
                    <span style={{ marginLeft: 8 }}><Badge variant="danger" size="sm" className="">已逾期</Badge></span>
                  )}
                </span>
              </div>
            </div>

            <hr className="divider divider-horizontal" />

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>影响范围</h4>
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  color: "#991b1b",
                  lineHeight: 1.6,
                }}
              >
                {selectedRisk.impact || "暂无影响范围描述"}
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>缓解措施</h4>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  color: "#065f46",
                  lineHeight: 1.6,
                }}
              >
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>已通知客户成功经理 {selectedRisk.ownerId} 跟进处理</li>
                  <li>建议在 SLA 到期前完成根因分析与修复方案</li>
                  <li>如涉及安全类风险，需同步安全团队评估影响面</li>
                  <li>处理完成后更新工单状态为"已解决"</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>处理时间线</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-title">工单创建</span>
                    <span className="timeline-desc">
                      类别: {categoryLabel[selectedRisk.category] ?? selectedRisk.category}，
                      级别: {severityLabel[selectedRisk.severity]}
                    </span>
                    <span className="timeline-time">{formatDateTime(selectedRisk.createdAt)}</span>
                  </div>
                </div>
                {selectedRisk.status !== "open" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#ea580c" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">状态更新</span>
                      <span className="timeline-desc">
                        当前状态: {statusLabel[selectedRisk.status]}
                      </span>
                      <span className="timeline-time">
                        {selectedRisk.status === "resolved"
                          ? "已解决"
                          : "处理中"}
                      </span>
                    </div>
                  </div>
                )}
                {selectedRisk.status === "resolved" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#16a34a" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">工单关闭</span>
                      <span className="timeline-desc">问题已解决，工单关闭</span>
                      <span className="timeline-time">
                        {formatDateTime(selectedRisk.slaDueAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>关联工单</h4>
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                {risks
                  .filter(
                    (r) =>
                      r.tenantId === selectedRisk.tenantId &&
                      r.id !== selectedRisk.id
                  )
                  .slice(0, 3)
                  .map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <span>{r.title}</span>
                      <Badge variant={statusBadgeVariant[r.status]} size="sm">
                        {statusLabel[r.status]}
                      </Badge>
                    </div>
                  ))}
                {risks.filter(
                  (r) =>
                    r.tenantId === selectedRisk.tenantId &&
                    r.id !== selectedRisk.id
                ).length === 0 && <span>无关联工单</span>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
