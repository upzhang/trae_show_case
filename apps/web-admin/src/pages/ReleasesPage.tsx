import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { SearchInput } from "../components/SearchInput";
import { FilterBar } from "../components/FilterBar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { StatusDot } from "../components/StatusDot";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";

import type { ReleaseView, TenantView } from "../lib/api";

const statusLabel: Record<ReleaseView["status"], string> = {
  pending: "待发布",
  deployed: "已部署",
  rolled_back: "已回滚"
};

const statusVariant: Record<ReleaseView["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  deployed: "success",
  rolled_back: "danger"
};

const envLabel: Record<ReleaseView["environment"], string> = {
  staging: "预发布",
  production: "生产"
};

const envVariant: Record<ReleaseView["environment"], "info" | "danger"> = {
  staging: "info",
  production: "danger"
};

export default function ReleasesPage() {
  const [list, setList] = useState<ReleaseView[]>([]);
  const [tenants, setTenants] = useState<TenantView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailItem, setDetailItem] = useState<ReleaseView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    const [rels, tenantRows] = await Promise.all([
      can("release:view") ? api.listReleases() : [],
      can("tenant:view") ? api.listTenants() : []
    ]);
    setList(rels);
    setTenants(tenantRows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function deploy(id: string): Promise<void> {
    await api.deployRelease(id);
    load();
  }

  async function rollback(id: string): Promise<void> {
    await api.rollbackRelease(id);
    load();
  }

  // 筛选 + 搜索
  const filteredList = useMemo(() => {
    let result = [...list];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.version.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      );
    }

    if (envFilter !== "all") {
      result = result.filter((item) => item.environment === envFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [list, search, envFilter, statusFilter]);

  const tenantNameById = new Map(tenants.map((item) => [item.id, item.name]));
  const deployed = list.filter((item) => item.status === "deployed");
  const rolledBack = list.filter((item) => item.status === "rolled_back");
  const pending = list.filter((item) => item.status === "pending");
  const production = list.filter((item) => item.environment === "production");
  const staging = list.filter((item) => item.environment === "staging");

  function openDetail(item: ReleaseView): void {
    setDetailItem(item);
    setDetailOpen(true);
  }

  function closeDetail(): void {
    setDetailOpen(false);
    setDetailItem(null);
  }

  return (
    <>
      <PageHeader
        title="发布中心"
        description="管理发布记录，查看部署状态、回滚历史与环境分布"
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon="refresh"
            onClick={() => { load(); }}
            disabled={loading}
          >
            刷新
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard
          title="发布总数"
          value={list.length}
          icon="rocket"
          color="blue"
        />
        <StatCard
          title="已部署"
          value={deployed.length}
          icon="check-circle"
          color="green"
        />
        <StatCard
          title="已回滚"
          value={rolledBack.length}
          icon="rotate-ccw"
          color="red"
        />
        <StatCard
          title="待发布"
          value={pending.length}
          icon="clock"
          color="orange"
        />
        <StatCard
          title="生产环境"
          value={production.length}
          icon="server"
          color="purple"
        />
        <StatCard
          title="预发布环境"
          value={staging.length}
          icon="cpu"
          color="blue"
        />
      </div>

      {/* 搜索与筛选 */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索版本号或 ID..."
          />
          <FilterBar
            filters={[
              {
                key: "env",
                label: "全部环境",
                options: [
                  { label: "全部", value: "all" },
                  { label: "生产", value: "production" },
                  { label: "预发布", value: "staging" }
                ],
                value: envFilter,
                onChange: setEnvFilter
              },
              {
                key: "status",
                label: "全部状态",
                options: [
                  { label: "全部", value: "all" },
                  { label: "待发布", value: "pending" },
                  { label: "已部署", value: "deployed" },
                  { label: "已回滚", value: "rolled_back" }
                ],
                value: statusFilter,
                onChange: setStatusFilter
              }
            ]}
            onReset={() => {
              setSearch("");
              setEnvFilter("all");
              setStatusFilter("all");
            }}
          />
        </div>
      </div>

      {/* 发布记录列表 */}
      <div className="card">
        <h3>发布记录</h3>
        {loading ? (
          <div className="table-loading">
            <Spinner size={32} />
            <span>加载中...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon="search"
            title={list.length === 0 ? "无权限或无发布记录" : "未找到匹配的发布记录"}
            description={list.length === 0 ? undefined : "尝试调整搜索条件或筛选器"}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>客户</th>
                <th>版本</th>
                <th>环境</th>
                <th>状态</th>
                <th>操作员</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span
                      style={{ cursor: "pointer", color: "#2563eb" }}
                      onClick={() => openDetail(item)}
                    >
                      {item.id}
                    </span>
                  </td>
                  <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
                  <td>
                    <strong
                      style={{ cursor: "pointer" }}
                      onClick={() => openDetail(item)}
                    >
                      {item.version}
                    </strong>
                  </td>
                  <td>
                    <Badge variant={envVariant[item.environment]}>
                      {envLabel[item.environment]}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={statusVariant[item.status]}>
                      {statusLabel[item.status]}
                    </Badge>
                  </td>
                  <td>{item.operatorId}</td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    {item.createdAt}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {can("release:deploy") && item.status === "pending" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => deploy(item.id)}
                        >
                          部署
                        </Button>
                      )}
                      {can("release:deploy") && item.status === "deployed" && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rollback(item.id)}
                        >
                          回滚
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(item)}
                      >
                        详情
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 发布详情 Modal */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={detailItem ? `发布详情 — ${detailItem.version}` : ""}
        size="lg"
      >
        {detailItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 基本信息 */}
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">发布 ID</span>
                <span className="detail-value">{detailItem.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">版本</span>
                <span className="detail-value">{detailItem.version}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">客户</span>
                <span className="detail-value">
                  {tenantNameById.get(detailItem.tenantId) ?? detailItem.tenantId}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">环境</span>
                <span className="detail-value">
                  <Badge variant={envVariant[detailItem.environment]}>
                    {envLabel[detailItem.environment]}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态</span>
                <span className="detail-value">
                  <Badge variant={statusVariant[detailItem.status]}>
                    {statusLabel[detailItem.status]}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">操作员</span>
                <span className="detail-value">{detailItem.operatorId}</span>
              </div>
            </div>

            {/* 变更内容 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>变更内容</h4>
              {detailItem.changelog ? (
                <pre style={{
                  background: "#f9fafb",
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#374151",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6
                }}>
                  {detailItem.changelog}
                </pre>
              ) : (
                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                  {detailItem.description ?? "暂无变更记录"}
                </p>
              )}
            </div>

            {/* 审批记录 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>审批记录</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusDot color="green" />
                <span style={{ fontSize: 13 }}>
                  <strong>{detailItem.operatorId}</strong> 提交了发布请求
                </span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {detailItem.createdAt}
                </span>
              </div>
              {detailItem.status !== "pending" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <StatusDot
                    color={detailItem.status === "deployed" ? "green" : "red"}
                  />
                  <span style={{ fontSize: 13 }}>
                    发布已{detailItem.status === "deployed" ? "部署" : "回滚"}
                  </span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    {detailItem.status === "deployed"
                      ? detailItem.deployedAt ?? "—"
                      : detailItem.rolledBackAt ?? "—"}
                  </span>
                </div>
              )}
            </div>

            {/* 回滚历史 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>回滚历史</h4>
              {detailItem.status === "rolled_back" ? (
                <div className="alert alert-error">
                  <span className="alert-content">
                    <span className="alert-title">已回滚</span>
                    <span className="alert-message">
                      此发布已于 {detailItem.rolledBackAt ?? "—"} 被 {detailItem.operatorId} 回滚
                    </span>
                  </span>
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                  暂无回滚记录
                </p>
              )}
            </div>

            {/* 部署时间线 */}
            <div className="card">
              <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>部署时间线</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-title">发布创建</span>
                    <span className="timeline-desc">
                      {detailItem.operatorId} 创建了版本 {detailItem.version} 的发布记录
                    </span>
                    <span className="timeline-time">{detailItem.createdAt}</span>
                  </div>
                </div>
                {detailItem.status === "deployed" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#16a34a" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">部署成功</span>
                      <span className="timeline-desc">
                        版本 {detailItem.version} 已成功部署到{" "}
                        {envLabel[detailItem.environment]} 环境
                      </span>
                      <span className="timeline-time">
                        {detailItem.deployedAt ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
                {detailItem.status === "rolled_back" && (
                  <>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "#16a34a" }} />
                      <div className="timeline-content">
                        <span className="timeline-title">已部署</span>
                        <span className="timeline-desc">
                          版本 {detailItem.version} 曾部署到{" "}
                          {envLabel[detailItem.environment]} 环境
                        </span>
                        <span className="timeline-time">
                          {detailItem.deployedAt ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: "#dc2626" }} />
                      <div className="timeline-content">
                        <span className="timeline-title">已回滚</span>
                        <span className="timeline-desc">
                          版本 {detailItem.version} 已从{" "}
                          {envLabel[detailItem.environment]} 环境回滚
                        </span>
                        <span className="timeline-time">
                          {detailItem.rolledBackAt ?? "—"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {detailItem.status === "pending" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#ca8a04" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">等待部署</span>
                      <span className="timeline-desc">
                        版本 {detailItem.version} 正在等待部署到{" "}
                        {envLabel[detailItem.environment]} 环境
                      </span>
                      <span className="timeline-time">进行中</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer" style={{ padding: "12px 0 0", borderTop: "1px solid #e5e7eb", marginTop: 16 }}>
          {detailItem && can("release:deploy") && detailItem.status === "pending" && (
            <Button variant="primary" onClick={() => { deploy(detailItem.id); closeDetail(); }}>
              部署
            </Button>
          )}
          {detailItem && can("release:deploy") && detailItem.status === "deployed" && (
            <Button variant="danger" onClick={() => { rollback(detailItem.id); closeDetail(); }}>
              回滚
            </Button>
          )}
          <Button variant="ghost" onClick={closeDetail}>
            关闭
          </Button>
        </div>
      </Modal>
    </>
  );
}
