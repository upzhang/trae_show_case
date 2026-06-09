import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Integration {
  id: string;
  type: "slack" | "github" | "jira" | "zendesk" | "salesforce" | "webhook";
  name: string;
  status: "not_configured" | "connected" | "error";
  config: Record<string, unknown>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    type: "webhook" as Integration["type"],
    name: "",
    config: {} as Record<string, unknown>
  });

  const integrationTypes: { type: Integration["type"]; label: string; icon: string }[] = [
    { type: "slack", label: "Slack", icon: "📱" },
    { type: "github", label: "GitHub", icon: "🐙" },
    { type: "jira", label: "Jira", icon: "🔧" },
    { type: "zendesk", label: "Zendesk", icon: "🎫" },
    { type: "salesforce", label: "Salesforce", icon: "☁️" },
    { type: "webhook", label: "Webhook", icon: "🔗" }
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    try {
      const response = await api.get("/integrations");
      setIntegrations(response.data);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await api.post("/integrations", newIntegration);
      setShowCreateModal(false);
      setNewIntegration({ type: "webhook", name: "", config: {} });
      fetchIntegrations();
    } catch (error) {
      console.error("Failed to create integration:", error);
    }
  }

  async function handleConnect(id: string) {
    try {
      await api.post(`/integrations/${id}/connect`);
      fetchIntegrations();
    } catch (error) {
      console.error("Failed to connect integration:", error);
    }
  }

  async function handleDisconnect(id: string) {
    if (confirm("确定要断开连接吗？")) {
      try {
        await api.post(`/integrations/${id}/disconnect`);
        fetchIntegrations();
      } catch (error) {
        console.error("Failed to disconnect integration:", error);
      }
    }
  }

  async function handleSync(id: string) {
    try {
      await api.post(`/integrations/${id}/sync`);
      fetchIntegrations();
    } catch (error) {
      console.error("Failed to sync integration:", error);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("确定要删除这个集成吗？")) {
      try {
        await api.delete(`/integrations/${id}`);
        fetchIntegrations();
      } catch (error) {
        console.error("Failed to delete integration:", error);
      }
    }
  }

  function getStatusLabel(status: Integration["status"]) {
    const labels = { not_configured: "未配置", connected: "已连接", error: "错误" };
    return labels[status];
  }

  function getStatusClass(status: Integration["status"]) {
    return `status-${status}`;
  }

  function getIntegrationType(type: Integration["type"]) {
    return integrationTypes.find(t => t.type === type);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>集成管理</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          添加集成
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="card-grid">
          {integrations.map((integration) => {
            const typeInfo = getIntegrationType(integration.type);
            return (
              <div key={integration.id} className={`integration-card ${getStatusClass(integration.status)}`}>
                <div className="card-header">
                  <span className="type-icon">{typeInfo?.icon}</span>
                  <div>
                    <h3>{integration.name}</h3>
                    <span className={`status-badge ${getStatusClass(integration.status)}`}>
                      {getStatusLabel(integration.status)}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">类型</span>
                    <span>{typeInfo?.label}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">创建时间</span>
                    <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
                  </div>
                  {integration.lastSyncAt && (
                    <div className="info-row">
                      <span className="label">最后同步</span>
                      <span>{new Date(integration.lastSyncAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  {integration.status === "not_configured" && (
                    <button onClick={() => handleConnect(integration.id)} className="btn-primary btn-sm">
                      连接
                    </button>
                  )}
                  {integration.status === "connected" && (
                    <>
                      <button onClick={() => handleSync(integration.id)} className="btn-secondary btn-sm">
                        同步
                      </button>
                      <button onClick={() => handleDisconnect(integration.id)} className="btn-warning btn-sm">
                        断开
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(integration.id)} className="btn-danger btn-sm">
                    删除
                  </button>
                </div>
              </div>
            );
          })}
          {integrations.length === 0 && (
            <div className="empty-state">暂无集成</div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>添加集成</h2>
            <div className="form-group">
              <label>集成类型</label>
              <div className="type-selector">
                {integrationTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => setNewIntegration({ ...newIntegration, type: type.type })}
                    className={`type-btn ${newIntegration.type === type.type ? "active" : ""}`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                value={newIntegration.name}
                onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                placeholder="输入集成名称"
              />
            </div>
            <div className="form-group">
              <label>配置（JSON）</label>
              <textarea
                value={JSON.stringify(newIntegration.config, null, 2)}
                onChange={(e) => {
                  try {
                    setNewIntegration({ ...newIntegration, config: JSON.parse(e.target.value) });
                  } catch {
                    // Invalid JSON, keep as is
                  }
                }}
                placeholder='{"url": "https://example.com/webhook"}'
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleCreate} className="btn-primary">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}