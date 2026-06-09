import { useState, useEffect } from "react";
import { api } from "../lib/api";

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

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as Ticket["priority"],
    category: "support" as Ticket["category"],
    tags: [] as string[]
  });
  const [filterStatus, setFilterStatus] = useState<Ticket["status"] | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Ticket["priority"] | "all">("all");

  const priorities: Ticket["priority"][] = ["critical", "high", "medium", "low"];
  const categories: Ticket["category"][] = ["bug_report", "security", "support", "billing"];

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterPriority]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterPriority !== "all") params.priority = filterPriority;
      
      const response = await api.get("/tickets", { params });
      setTickets(response.data);
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
    const labels = { critical: "紧急", high: "高", medium: "中", low: "低" };
    return labels[priority];
  }

  function getPriorityClass(priority: Ticket["priority"]) {
    return `priority-${priority}`;
  }

  function getStatusLabel(status: Ticket["status"]) {
    const labels = { open: "待处理", in_progress: "处理中", waiting_customer: "等待客户", resolved: "已解决" };
    return labels[status];
  }

  function getStatusClass(status: Ticket["status"]) {
    return `status-${status}`;
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>工单管理</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          创建工单
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总工单</div>
        </div>
        <div className="stat-card stat-open">
          <div className="stat-value">{stats.open}</div>
          <div className="stat-label">待处理</div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-label">处理中</div>
        </div>
        <div className="stat-card stat-resolved">
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">已解决</div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Ticket["status"] | "all")}>
          <option value="all">全部状态</option>
          <option value="open">待处理</option>
          <option value="in_progress">处理中</option>
          <option value="waiting_customer">等待客户</option>
          <option value="resolved">已解决</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Ticket["priority"] | "all")}>
          <option value="all">全部优先级</option>
          <option value="critical">紧急</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="two-column">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>优先级</th>
                  <th>标题</th>
                  <th>分类</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className={selectedTicket?.id === ticket.id ? "selected" : ""}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td>
                      <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="clickable">{ticket.title}</td>
                    <td>{ticket.category}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket, "in_progress"); }} className="btn-secondary">
                        开始处理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTickets.length === 0 && (
              <div className="empty-state">暂无工单</div>
            )}
          </div>

          {selectedTicket && (
            <div className="detail-panel">
              <div className="panel-header">
                <h2>{selectedTicket.title}</h2>
                <button onClick={() => setSelectedTicket(null)} className="btn-close">×</button>
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
                  <span>{selectedTicket.category}</span>
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
                    <option key={c} value={c}>{c}</option>
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