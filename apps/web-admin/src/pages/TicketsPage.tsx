import { useState, useEffect, useMemo } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { SearchInput } from "../components/SearchInput";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { Icon } from "../components/Icon";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting_customer" | "resolved";
  category: "bug_report" | "security" | "support" | "billing";
  assigneeId?: string;
  creatorId: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface TicketConversation {
  id: string;
  ticketId: string;
  authorId: string;
  message: string;
  isInternal?: boolean;
  createdAt: string;
}

interface TicketStatusTransition {
  id: string;
  ticketId: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  comment?: string;
  createdAt: string;
}

interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as Ticket["priority"],
    category: "support" as Ticket["category"],
    tags: [] as string[]
  });
  const [filterStatus, setFilterStatus] = useState<Ticket["status"] | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Ticket["priority"] | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Ticket["category"] | "all">("all");
  const [search, setSearch] = useState("");

  // Batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Detail modal tabs
  const [detailTab, setDetailTab] = useState<"info" | "timeline" | "conversations" | "attachments">("info");

  // Mock data for detail modal
  const [conversations, setConversations] = useState<TicketConversation[]>([]);
  const [transitions, setTransitions] = useState<TicketStatusTransition[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);

  const priorities: Ticket["priority"][] = ["critical", "high", "medium", "low"];
  const categories: Ticket["category"][] = ["bug_report", "security", "support", "billing"];

  const priorityLabel: Record<string, string> = {
    critical: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };

  const statusLabel: Record<string, string> = {
    open: "待处理",
    in_progress: "处理中",
    waiting_customer: "等待客户",
    resolved: "已解决",
  };

  const categoryLabel: Record<string, string> = {
    bug_report: "缺陷",
    security: "安全",
    support: "支持",
    billing: "计费",
  };

  const statusBadgeVariant: Record<string, "danger" | "warning" | "info" | "success"> = {
    open: "danger",
    in_progress: "warning",
    waiting_customer: "info",
    resolved: "success",
  };

  const priorityBadgeVariant: Record<string, "danger" | "warning" | "info" | "default"> = {
    critical: "danger",
    high: "danger",
    medium: "warning",
    low: "info",
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterPriority, filterCategory]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterPriority !== "all") params.priority = filterPriority;
      if (filterCategory !== "all") params.category = filterCategory;

      const response = await api.get("/tickets", { params });
      setTickets(response || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await api.post("/tickets", newTicket);
      setShowCreateModal(false);
      setNewTicket({ title: "", description: "", priority: "medium", category: "support", tags: [] });
      fetchTickets();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  }

  async function handleUpdateStatus(ticket: Ticket, status: Ticket["status"]) {
    try {
      await api.post(`/tickets/${ticket.id}/status`, { status });
      fetchTickets();
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error("Failed to update ticket status:", error);
    }
  }

  function getPriorityLabel(priority: Ticket["priority"]) {
    return priorityLabel[priority];
  }

  function getPriorityClass(priority: Ticket["priority"]) {
    return `priority-${priority}`;
  }

  function getStatusLabel(status: Ticket["status"]) {
    return statusLabel[status];
  }

  function getStatusClass(status: Ticket["status"]) {
    return `status-${status}`;
  }

  // Filtering with search
  const filteredTickets = useMemo(() => {
    let result = tickets.filter((ticket) => {
      if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
      if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
      if (filterCategory !== "all" && ticket.category !== filterCategory) return false;
      return true;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [tickets, filterStatus, filterPriority, filterCategory, search]);

  // Pagination
  const paginatedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    critical: tickets.filter((t) => t.priority === "critical").length,
    slaOverdue: tickets.filter((t) => {
      if (t.status === "resolved") return false;
      const created = new Date(t.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return t.priority === "critical" ? hoursSinceCreation > 4 : hoursSinceCreation > 24;
    }).length,
  }), [tickets]);

  function handleSelectTicket(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === filteredTickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTickets.map((t) => t.id)));
    }
  }

  async function handleBatchClose() {
    if (selectedIds.size === 0) return;
    try {
      for (const id of selectedIds) {
        await api.post(`/tickets/${id}/status`, { status: "resolved" });
      }
      setSelectedIds(new Set());
      fetchTickets();
    } catch (error) {
      console.error("Failed to batch close tickets:", error);
    }
  }

  async function handleBatchAssign(assigneeId: string) {
    if (selectedIds.size === 0) return;
    try {
      for (const id of selectedIds) {
        await api.post(`/tickets/${id}/assign`, { assigneeId });
      }
      setSelectedIds(new Set());
      fetchTickets();
    } catch (error) {
      console.error("Failed to batch assign tickets:", error);
    }
  }

  function handleOpenDetail(ticket: Ticket) {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
    setDetailTab("info");
    // Load mock detail data
    setConversations([
      {
        id: "conv-1",
        ticketId: ticket.id,
        authorId: ticket.creatorId,
        message: "已收到您的工单，我们会尽快处理。",
        isInternal: false,
        createdAt: ticket.createdAt,
      },
      {
        id: "conv-2",
        ticketId: ticket.id,
        authorId: "support-agent",
        message: "正在排查问题根因，预计 2 小时内给出初步结论。",
        isInternal: true,
        createdAt: new Date(new Date(ticket.createdAt).getTime() + 3600000).toISOString(),
      },
    ]);
    setTransitions([
      {
        id: "tr-1",
        ticketId: ticket.id,
        fromStatus: "open",
        toStatus: ticket.status,
        actorId: ticket.assigneeId || ticket.creatorId,
        comment: ticket.status === "in_progress" ? "开始处理工单" : "状态更新",
        createdAt: ticket.updatedAt,
      },
    ]);
    setAttachments([
      {
        id: "att-1",
        ticketId: ticket.id,
        fileName: "error_screenshot.png",
        fileSize: 245760,
        uploadedBy: ticket.creatorId,
        uploadedAt: ticket.createdAt,
      },
      {
        id: "att-2",
        ticketId: ticket.id,
        fileName: "diagnostic_logs.txt",
        fileSize: 102400,
        uploadedBy: "support-agent",
        uploadedAt: new Date(new Date(ticket.createdAt).getTime() + 7200000).toISOString(),
      },
    ]);
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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getSlaRemaining(ticket: Ticket): { hours: number; isOverdue: boolean } {
    if (ticket.status === "resolved") return { hours: 0, isOverdue: false };
    const created = new Date(ticket.createdAt);
    const now = new Date();
    const maxHours = ticket.priority === "critical" ? 4 : ticket.priority === "high" ? 8 : 24;
    const elapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const remaining = maxHours - elapsed;
    return { hours: Math.max(0, Math.round(remaining * 10) / 10), isOverdue: remaining < 0 };
  }

  function handleResetFilters() {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterCategory("all");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="page-container">
      <PageHeader
        title="工单管理"
        description="管理和跟踪客户工单，支持按优先级、状态、分类筛选和批量操作"
        actions={
          <div className="page-header-actions">
            <Button variant="secondary" size="sm" icon="refresh" onClick={fetchTickets}>
              刷新
            </Button>
            <Button
              variant={batchMode ? "primary" : "secondary"}
              size="sm"
              icon="check"
              onClick={() => {
                setBatchMode(!batchMode);
                if (batchMode) setSelectedIds(new Set());
              }}
            >
              {batchMode ? "退出批量模式" : "批量操作"}
            </Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setShowCreateModal(true)}>
              创建工单
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="stat-grid">
        <StatCard
          title="总工单"
          value={stats.total}
          icon="edit"
          color="blue"
        />
        <StatCard
          title="待处理"
          value={stats.open}
          icon="clock"
          color="orange"
        />
        <StatCard
          title="紧急工单"
          value={stats.critical}
          icon="warning"
          color="red"
        />
        <StatCard
          title="SLA 逾期"
          value={stats.slaOverdue}
          icon="bell"
          color={stats.slaOverdue > 0 ? "red" : "green"}
          subtitle={stats.slaOverdue > 0 ? "需立即处理" : "全部达标"}
        />
      </div>

      {/* Filter bar */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <SearchInput
            placeholder="按标题、描述、标签搜索..."
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as Ticket["status"] | "all");
              setPage(1);
            }}
          >
            <option value="all">全部状态</option>
            <option value="open">待处理</option>
            <option value="in_progress">处理中</option>
            <option value="waiting_customer">等待客户</option>
            <option value="resolved">已解决</option>
          </select>
          <select
            className="filter-select"
            value={filterPriority}
            onChange={(e) => {
              setFilterPriority(e.target.value as Ticket["priority"] | "all");
              setPage(1);
            }}
          >
            <option value="all">全部优先级</option>
            <option value="critical">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value as Ticket["category"] | "all");
              setPage(1);
            }}
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel[c]}
              </option>
            ))}
          </select>
          {(search || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all") && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              重置筛选
            </Button>
          )}
        </div>
      </div>

      {/* Batch action bar */}
      {batchMode && selectedIds.size > 0 && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 8,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "#1e40af" }}>
            已选择 {selectedIds.size} 个工单
          </span>
          <Button variant="primary" size="sm" onClick={handleBatchClose}>
            批量关闭
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleBatchAssign("support-agent")}>
            批量分配给支持团队
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            取消选择
          </Button>
        </div>
      )}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="two-column">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {batchMode && (
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredTickets.length && filteredTickets.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>优先级</th>
                  <th>标题</th>
                  <th>分类</th>
                  <th>状态</th>
                  <th>SLA</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.map((ticket) => {
                  const sla = getSlaRemaining(ticket);
                  return (
                    <tr
                      key={ticket.id}
                      className={selectedTicket?.id === ticket.id ? "selected" : ""}
                    >
                      {batchMode && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(ticket.id)}
                            onChange={() => handleSelectTicket(ticket.id)}
                          />
                        </td>
                      )}
                      <td>
                        <Badge variant={priorityBadgeVariant[ticket.priority]} size="sm">
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </td>
                      <td
                        className="clickable"
                        onClick={() => handleOpenDetail(ticket)}
                      >
                        {ticket.title}
                      </td>
                      <td>
                        <Badge variant="default" size="sm">
                          {categoryLabel[ticket.category] || ticket.category}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={statusBadgeVariant[ticket.status]} size="sm">
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </td>
                      <td>
                        {ticket.status === "resolved" ? (
                          <span style={{ color: "#16a34a", fontSize: 12 }}>已完成</span>
                        ) : sla.isOverdue ? (
                          <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 12 }}>
                            已逾期
                          </span>
                        ) : (
                          <span style={{ color: "#ea580c", fontSize: 12 }}>
                            剩余 {sla.hours}h
                          </span>
                        )}
                      </td>
                      <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td className="actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="eye"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(ticket);
                          }}
                        >
                          详情
                        </Button>
                        {ticket.status !== "in_progress" && ticket.status !== "resolved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(ticket, "in_progress");
                            }}
                          >
                            开始处理
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTickets.length === 0 && (
              <div className="empty-state">暂无工单</div>
            )}
            {filteredTickets.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Pagination
                  current={page}
                  total={filteredTickets.length}
                  pageSize={pageSize}
                  onChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>

          {selectedTicket && !showDetailModal && (
            <div className="detail-panel">
              <div className="panel-header">
                <h2>{selectedTicket.title}</h2>
                <button onClick={() => setSelectedTicket(null)} className="btn-close">x</button>
              </div>
              <div className="detail-content">
                <div className="detail-row">
                  <span className="label">描述</span>
                  <p>{selectedTicket.description}</p>
                </div>
                <div className="detail-row">
                  <span className="label">优先级</span>
                  <span className={`priority-badge ${getPriorityClass(selectedTicket.priority)}`}>
                    {getPriorityLabel(selectedTicket.priority)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">分类</span>
                  <span>{categoryLabel[selectedTicket.category] || selectedTicket.category}</span>
                </div>
                <div className="detail-row">
                  <span className="label">状态</span>
                  <div className="status-selector">
                    {(["open", "in_progress", "waiting_customer", "resolved"] as Ticket["status"][]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedTicket, status)}
                        className={`status-btn ${selectedTicket.status === status ? "active" : ""}`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <div className="detail-row">
                    <span className="label">标签</span>
                    <div className="tags">
                      {selectedTicket.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">创建时间</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">更新时间</span>
                  <span>{new Date(selectedTicket.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedTicket?.title || "工单详情"}
        size="xl"
        footer={
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            关闭
          </Button>
        }
      >
        {selectedTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tabs */}
            <div className="tabs">
              <div className="tabs-header">
                <button
                  className={`tabs-tab ${detailTab === "info" ? "tabs-tab-active" : ""}`}
                  onClick={() => setDetailTab("info")}
                >
                  基本信息
                </button>
                <button
                  className={`tabs-tab ${detailTab === "timeline" ? "tabs-tab-active" : ""}`}
                  onClick={() => setDetailTab("timeline")}
                >
                  状态流转
                </button>
                <button
                  className={`tabs-tab ${detailTab === "conversations" ? "tabs-tab-active" : ""}`}
                  onClick={() => setDetailTab("conversations")}
                >
                  对话记录
                  <span className="tabs-badge">{conversations.length}</span>
                </button>
                <button
                  className={`tabs-tab ${detailTab === "attachments" ? "tabs-tab-active" : ""}`}
                  onClick={() => setDetailTab("attachments")}
                >
                  附件
                  <span className="tabs-badge">{attachments.length}</span>
                </button>
              </div>

              <div className="tabs-content">
                {/* Info Tab */}
                {detailTab === "info" && (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">工单 ID</span>
                      <span className="detail-value" style={{ fontFamily: "monospace" }}>
                        {selectedTicket.id}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">创建时间</span>
                      <span className="detail-value">
                        {formatDateTime(selectedTicket.createdAt)}
                      </span>
                    </div>
                    <div className="detail-item detail-full">
                      <span className="detail-label">标题</span>
                      <span className="detail-value" style={{ fontWeight: 600 }}>
                        {selectedTicket.title}
                      </span>
                    </div>
                    <div className="detail-item detail-full">
                      <span className="detail-label">描述</span>
                      <span className="detail-value" style={{ lineHeight: 1.6 }}>
                        {selectedTicket.description || "暂无描述"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">优先级</span>
                      <span className="detail-value">
                        <Badge variant={priorityBadgeVariant[selectedTicket.priority]} size="sm">
                          {getPriorityLabel(selectedTicket.priority)}
                        </Badge>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">状态</span>
                      <span className="detail-value">
                        <Badge variant={statusBadgeVariant[selectedTicket.status]} size="sm">
                          {getStatusLabel(selectedTicket.status)}
                        </Badge>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">分类</span>
                      <span className="detail-value">
                        {categoryLabel[selectedTicket.category] || selectedTicket.category}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">创建者</span>
                      <span className="detail-value">{selectedTicket.creatorId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">负责人</span>
                      <span className="detail-value">
                        {selectedTicket.assigneeId || "未分配"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">更新时间</span>
                      <span className="detail-value">
                        {formatDateTime(selectedTicket.updatedAt)}
                      </span>
                    </div>
                    {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                      <div className="detail-item detail-full">
                        <span className="detail-label">标签</span>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {selectedTicket.tags.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="detail-item detail-full">
                      <span className="detail-label">SLA 状态</span>
                      <span className="detail-value">
                        {(() => {
                          const sla = getSlaRemaining(selectedTicket);
                          if (selectedTicket.status === "resolved") {
                            return <Badge variant="success" size="sm">已完成</Badge>;
                          }
                          if (sla.isOverdue) {
                            return <Badge variant="danger" size="sm">已逾期</Badge>;
                          }
                          return (
                            <span style={{ color: "#ea580c", fontWeight: 500 }}>
                              剩余 {sla.hours} 小时
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timeline Tab */}
                {detailTab === "timeline" && (
                  <div className="timeline">
                    {transitions.length === 0 ? (
                      <div className="empty">暂无状态变更记录</div>
                    ) : (
                      transitions.map((tr) => (
                        <div className="timeline-item" key={tr.id}>
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <span className="timeline-title">
                              {statusLabel[tr.fromStatus] || tr.fromStatus} → {statusLabel[tr.toStatus] || tr.toStatus}
                            </span>
                            <span className="timeline-desc">
                              操作者: {tr.actorId}
                              {tr.comment && ` · ${tr.comment}`}
                            </span>
                            <span className="timeline-time">{formatDateTime(tr.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Conversations Tab */}
                {detailTab === "conversations" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {conversations.length === 0 ? (
                      <div className="empty">暂无对话记录</div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          style={{
                            background: conv.isInternal ? "#fef3c7" : "#f0fdf4",
                            border: `1px solid ${conv.isInternal ? "#fcd34d" : "#bbf7d0"}`,
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                              {conv.authorId}
                              {conv.isInternal && (
                                <span style={{ marginLeft: 8 }}><Badge variant="warning" size="sm" className="">内部备注</Badge></span>
                              )}
                            </span>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>
                              {formatDateTime(conv.createdAt)}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                            {conv.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Attachments Tab */}
                {detailTab === "attachments" && (
                  <div>
                    {attachments.length === 0 ? (
                      <div className="empty">暂无附件</div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>文件名</th>
                            <th>大小</th>
                            <th>上传者</th>
                            <th>上传时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attachments.map((att) => (
                            <tr key={att.id}>
                              <td>
                                <Icon name="download" size={14} />
                                <span style={{ marginLeft: 6 }}>{att.fileName}</span>
                              </td>
                              <td>{formatFileSize(att.fileSize)}</td>
                              <td>{att.uploadedBy}</td>
                              <td>{formatDateTime(att.uploadedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建工单</h2>
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="输入工单标题"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="详细描述问题..."
                rows={4}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>优先级</label>
                <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Ticket["priority"] })}>
                  {priorities.map((p) => (
                    <option key={p} value={p}>{getPriorityLabel(p)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>分类</label>
                <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as Ticket["category"] })}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{categoryLabel[c]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>标签（逗号分隔）</label>
              <input
                type="text"
                value={newTicket.tags.join(", ")}
                onChange={(e) => setNewTicket({ ...newTicket, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="例如: bug, urgent"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleCreate} className="btn-primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
