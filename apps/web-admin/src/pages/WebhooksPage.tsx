import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: [] as string[] });
  const [filter, setFilter] = useState("");

  const availableEvents = [
    "approvals.created",
    "approvals.approved",
    "approvals.rejected",
    "releases.deployed",
    "releases.rolled_back",
    "users.created",
    "users.updated",
    "users.deleted",
    "risk.created",
    "risk.updated",
    "ticket.created",
    "ticket.updated"
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    setLoading(true);
    try {
      const response = await api.get("/webhooks");
      setWebhooks(response.data);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await api.post("/webhooks", newWebhook);
      setShowCreateModal(false);
      setNewWebhook({ name: "", url: "", events: [] });
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to create webhook:", error);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("确定要删除这个 Webhook 吗？")) {
      try {
        await api.delete(`/webhooks/${id}`);
        fetchWebhooks();
      } catch (error) {
        console.error("Failed to delete webhook:", error);
      }
    }
  }

  async function handleToggleStatus(webhook: Webhook) {
    try {
      await api.put(`/webhooks/${webhook.id}`, { ...webhook, isActive: !webhook.isActive });
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to update webhook:", error);
    }
  }

  const filteredWebhooks = webhooks.filter(w =>
    w.name.toLowerCase().includes(filter.toLowerCase()) ||
    w.url.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Webhook 配置</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          创建 Webhook
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索 Webhook..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>URL</th>
                <th>事件</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredWebhooks.map((webhook) => (
                <tr key={webhook.id}>
                  <td>{webhook.name}</td>
                  <td className="truncate">{webhook.url}</td>
                  <td>
                    <div className="tags">
                      {webhook.events.slice(0, 3).map((event, idx) => (
                        <span key={idx} className="tag">{event}</span>
                      ))}
                      {webhook.events.length > 3 && (
                        <span className="tag tag-more">+{webhook.events.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${webhook.isActive ? "active" : "inactive"}`}>
                      {webhook.isActive ? "启用" : "禁用"}
                    </span>
                  </td>
                  <td>{new Date(webhook.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => handleToggleStatus(webhook)} className="btn-secondary">
                      {webhook.isActive ? "禁用" : "启用"}
                    </button>
                    <button onClick={() => handleDelete(webhook.id)} className="btn-danger">
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredWebhooks.length === 0 && (
            <div className="empty-state">暂无 Webhook 配置</div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建 Webhook</h2>
            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                placeholder="输入 Webhook 名称"
              />
            </div>
            <div className="form-group">
              <label>URL</label>
              <input
                type="text"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="输入回调 URL"
              />
            </div>
            <div className="form-group">
              <label>订阅事件</label>
              <div className="checkbox-grid">
                {availableEvents.map((event) => (
                  <label key={event} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={(e) => {
                        const events = [...newWebhook.events];
                        if (e.target.checked) {
                          events.push(event);
                        } else {
                          events.splice(events.indexOf(event), 1);
                        }
                        setNewWebhook({ ...newWebhook, events });
                      }}
                    />
                    {event}
                  </label>
                ))}
              </div>
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