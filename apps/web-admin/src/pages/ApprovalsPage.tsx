import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { SearchInput } from "../components/SearchInput";
import { Tabs } from "../components/Tabs";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { StatusDot } from "../components/StatusDot";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";

import type { ApprovalView, TenantView } from "../lib/api";

const statusLabel: Record<ApprovalView["status"], string> = {
  pending: "待处理",
  approved: "已通过",
  rejected: "已拒绝"
};

const statusVariant: Record<ApprovalView["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
};

const statusDotColor: Record<ApprovalView["status"], "yellow" | "green" | "red"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red"
};

export default function ApprovalsPage() {
  const [list, setList] = useState<ApprovalView[]>([]);
  const [tenants, setTenants] = useState<TenantView[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [detailItem, setDetailItem] = useState<ApprovalView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    const [approvals, tenantRows] = await Promise.all([
      can("approval:view") ? api.listApprovals() : [],
      can("tenant:view") ? api.listTenants() : []
    ]);
    setList(approvals);
    setTenants(tenantRows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(): Promise<void> {
    if (!title.trim()) {
      window.alert("请填写审批标题");
      return;
    }
    await api.createApproval(title.trim());
    setTitle("");
    load();
  }

  async function approve(id: string): Promise<void> {
    await api.approveApproval(id);
    load();
  }

  async function reject(id: string): Promise<void> {
    await api.rejectApproval(id);
    load();
  }

  // 筛选 + 搜索
  const filteredList = useMemo(() => {
    let result = [...list];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      );
    }

    if (statusTab !== "all") {
      result = result.filter((item) => item.status === statusTab);
    }

    return result;
  }, [list, search, statusTab]);

  const tenantNameById = new Map(tenants.map((item) => [item.id, item.name]));
  const pending = list.filter((item) => item.status === "pending");
  const approved = list.filter((item) => item.status === "approved");
  const rejected = list.filter((item) => item.status === "rejected");

  function openDetail(item: ApprovalView): void {
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
        title="审批中心"
        description="管理审批请求，查看审批状态与决策历史"
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
          title="审批总数"
          value={list.length}
          icon="file-text"
          color="blue"
        />
        <StatCard
          title="待处理"
          value={pending.length}
          icon="clock"
          color="orange"
        />
        <StatCard
          title="已通过"
          value={approved.length}
          icon="check-circle"
          color="green"
        />
        <StatCard
          title="已拒绝"
          value={rejected.length}
          icon="x-circle"
          color="red"
        />
      </div>

      {/* 发起审批 */}
      <div className="card">
        <h3>发起审批</h3>
        <div className="form-row">
          <input placeholder="审批标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button variant="primary" onClick={create}>
            发起
          </Button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="card">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="搜索审批标题或 ID..."
        />
      </div>

      {/* 审批列表 */}
      <div className="card">
        <h3>审批列表</h3>
        <Tabs
          items={[
            {
              key: "all",
              label: "全部",
              badge: list.length,
              content: null
            },
            {
              key: "pending",
              label: "待审批",
              badge: pending.length,
              content: null
            },
            {
              key: "approved",
              label: "已通过",
              badge: approved.length,
              content: null
            },
            {
              key: "rejected",
              label: "已拒绝",
              badge: rejected.length,
              content: null
            }
          ]}
          activeKey={statusTab}
          onChange={setStatusTab}
        />
        {loading ? (
          <div className="table-loading">
            <Spinner size={32} />
            <span>加载中...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon="search"
            title={list.length === 0 ? "无权限或无审批" : "未找到匹配的审批"}
            description={list.length === 0 ? undefined : "尝试调整搜索条件或筛选标签"}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>客户</th>
                <th>状态</th>
                <th>申请人</th>
                <th>决定人</th>
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
                  <td>
                    <strong
                      style={{ cursor: "pointer" }}
                      onClick={() => openDetail(item)}
                    >
                      {item.title}
                    </strong>
                  </td>
                  <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
                  <td>
                    <Badge variant={statusVariant[item.status]}>
                      {statusLabel[item.status]}
                    </Badge>
                  </td>
                  <td>{item.requestedBy}</td>
                  <td>{item.decidedBy ?? "—"}</td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>
                    {item.createdAt ?? "—"}
                  </td>
                  <td>
                    {can("approval:approve") && item.status === "pending" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => approve(item.id)}
                        >
                          通过
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => reject(item.id)}
                        >
                          拒绝
                        </Button>
                      </div>
                    )}
                    {item.status !== "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(item)}
                      >
                        详情
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 审批详情 Modal */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={detailItem ? `审批详情 — ${detailItem.title}` : ""}
        size="lg"
      >
        {detailItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 基本信息 */}
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">审批 ID</span>
                <span className="detail-value">{detailItem.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">标题</span>
                <span className="detail-value">{detailItem.title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">客户</span>
                <span className="detail-value">
                  {tenantNameById.get(detailItem.tenantId) ?? detailItem.tenantId}
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
                <span className="detail-label">申请人</span>
                <span className="detail-value">{detailItem.requestedBy}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">决定人</span>
                <span className="detail-value">{detailItem.decidedBy ?? "—"}</span>
              </div>
            </div>

            {/* 请求内容 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>请求内容</h4>
              <p style={{ color: "#374151", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                {detailItem.description ?? "暂无详细描述"}
              </p>
            </div>

            {/* 审批链 / 审批人列表 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>审批链</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusDot color="green" />
                  <span style={{ fontSize: 13 }}>
                    <strong>{detailItem.requestedBy}</strong> 提交审批
                  </span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    {detailItem.createdAt ?? "—"}
                  </span>
                </div>
                {detailItem.status !== "pending" && detailItem.decidedBy && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot
                      color={detailItem.status === "approved" ? "green" : "red"}
                    />
                    <span style={{ fontSize: 13 }}>
                      <strong>{detailItem.decidedBy}</strong>{" "}
                      {detailItem.status === "approved" ? "通过" : "拒绝"}了审批
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {detailItem.decidedAt ?? "—"}
                    </span>
                  </div>
                )}
                {detailItem.status === "pending" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot color="yellow" pulse />
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                      等待审批人处理...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 决策历史 / 时间线 */}
            <div className="card">
              <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>时间线</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-title">审批创建</span>
                    <span className="timeline-desc">
                      {detailItem.requestedBy} 发起了审批请求
                    </span>
                    <span className="timeline-time">
                      {detailItem.createdAt ?? "—"}
                    </span>
                  </div>
                </div>
                {detailItem.status === "approved" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#16a34a" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">审批通过</span>
                      <span className="timeline-desc">
                        {detailItem.decidedBy ?? "系统"} 通过了此审批
                      </span>
                      <span className="timeline-time">
                        {detailItem.decidedAt ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
                {detailItem.status === "rejected" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#dc2626" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">审批拒绝</span>
                      <span className="timeline-desc">
                        {detailItem.decidedBy ?? "系统"} 拒绝了此审批
                      </span>
                      <span className="timeline-time">
                        {detailItem.decidedAt ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
                {detailItem.status === "pending" && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#ca8a04" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">等待决策</span>
                      <span className="timeline-desc">
                        当前正在等待审批人做出决策
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
          {detailItem && detailItem.status === "pending" && can("approval:approve") && (
            <>
              <Button variant="primary" onClick={() => { approve(detailItem.id); closeDetail(); }}>
                通过
              </Button>
              <Button variant="danger" onClick={() => { reject(detailItem.id); closeDetail(); }}>
                拒绝
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={closeDetail}>
            关闭
          </Button>
        </div>
      </Modal>
    </>
  );
}
