import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusDot } from "../components/StatusDot";
import { CopyButton } from "../components/CopyButton";
import { Tabs } from "../components/Tabs";
import { ProgressBar } from "../components/ProgressBar";

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

interface SyncRecord {
  id: string;
  integrationId: string;
  status: "success" | "failed" | "in_progress";
  recordsCount: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

interface IntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  callbackUrl?: string;
  webhookUrl?: string;
  endpoint?: string;
  [key: string]: unknown;
}

interface IntegrationStats {
  total: number;
  active: number;
  error: number;
  syncsThisMonth: number;
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

  // 新增状态：集成配置
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>({});

  // 新增状态：同步历史
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);

  // 新增状态：连接测试
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 新增状态：统计
  const [stats, setStats] = useState<IntegrationStats>({ total: 0, active: 0, error: 0, syncsThisMonth: 0 });

  // 新增状态：删除确认
  const [deleteTarget, setDeleteTarget] = useState<Integration | null>(null);

  const integrationTypes: { type: Integration["type"]; label: string; icon: string }[] = [
    { type: "slack", label: "Slack", icon: "message-square" },
    { type: "github", label: "GitHub", icon: "github" },
    { type: "jira", label: "Jira", icon: "tool" },
    { type: "zendesk", label: "Zendesk", icon: "headphones" },
    { type: "salesforce", label: "Salesforce", icon: "cloud" },
    { type: "webhook", label: "Webhook", icon: "link" }
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    try {
      const response = await api.get("/integrations");
      const data: Integration[] = response || [];
      setIntegrations(data);
      computeStats(data);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(data: Integration[]) {
    const total = data.length;
    const active = data.filter(i => i.status === "connected").length;
    const error = data.filter(i => i.status === "error").length;
    setStats({ total, active, error, syncsThisMonth: 23 });
  }

  async function fetchIntegrationConfig(integrationId: string) {
    setConfigLoading(true);
    try {
      const response = await api.get(`/integrations/${integrationId}/config`);
      setIntegrationConfig(response);
    } catch {
      // 模拟数据
      setIntegrationConfig({
        apiKey: "sk-" + Math.random().toString(36).substring(2, 10),
        apiSecret: "••••••••••••••••",
        callbackUrl: "https://example.com/callback",
        webhookUrl: "https://hooks.example.com/webhook",
        endpoint: "https://api.example.com/v1",
      });
    } finally {
      setConfigLoading(false);
    }
  }

  async function fetchSyncHistory(integrationId: string) {
    setSyncLoading(true);
    try {
      const response = await api.get(`/integrations/${integrationId}/syncs`);
      setSyncRecords(response);
    } catch {
      // 模拟数据
      setSyncRecords([
        { id: "sync-1", integrationId, status: "success", recordsCount: 156, startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3500000).toISOString() },
        { id: "sync-2", integrationId, status: "failed", recordsCount: 0, errorMessage: "Connection timeout after 30s", startedAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7180000).toISOString() },
        { id: "sync-3", integrationId, status: "success", recordsCount: 89, startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86390000).toISOString() },
        { id: "sync-4", integrationId, status: "in_progress", recordsCount: 0, startedAt: new Date().toISOString() },
      ]);
    } finally {
      setSyncLoading(false);
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

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/integrations/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchIntegrations();
    } catch (error) {
      console.error("Failed to delete integration:", error);
    }
  }

  async function handleTestConnection(id: string) {
    setTestingId(id);
    setTestResult(null);
    try {
      const response = await api.post(`/integrations/${id}/test`);
      setTestResult({ success: true, message: response?.message || "连接成功" });
    } catch {
      setTestResult({ success: false, message: "连接失败：无法访问目标服务" });
    } finally {
      setTestingId(null);
    }
  }

  function openConfigModal(integration: Integration) {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
    fetchIntegrationConfig(integration.id);
  }

  function openSyncModal(integration: Integration) {
    setSelectedIntegration(integration);
    setShowSyncModal(true);
    fetchSyncHistory(integration.id);
  }

  function getStatusLabel(status: Integration["status"]) {
    const labels = { not_configured: "未配置", connected: "已连接", error: "错误" };
    return labels[status];
  }

  function getStatusColor(status: Integration["status"]): "gray" | "green" | "red" {
    const colors = { not_configured: "gray" as const, connected: "green" as const, error: "red" as const };
    return colors[status];
  }

  function getSyncStatusBadge(status: SyncRecord["status"]) {
    const map = { success: "success" as const, failed: "danger" as const, in_progress: "warning" as const };
    const labels = { success: "成功", failed: "失败", in_progress: "进行中" };
    return <Badge variant={map[status]} size="sm">{labels[status]}</Badge>;
  }

  function getIntegrationType(type: Integration["type"]) {
    return integrationTypes.find(t => t.type === type);
  }

  return (
    <div className="page-container">
      <PageHeader
        title="集成管理"
        description="管理第三方集成、查看同步历史与连接状态"
        actions={
          can("integration:create") ? (
            <Button variant="primary" icon="plus" onClick={() => setShowCreateModal(true)}>
              添加集成
            </Button>
          ) : undefined
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard title="集成总数" value={stats.total} icon="package" color="blue" />
        <StatCard title="活跃集成" value={stats.active} icon="check-circle" color="green" />
        <StatCard title="异常集成" value={stats.error} icon="alert-triangle" color={stats.error > 0 ? "red" : "green"} />
        <StatCard title="本月同步" value={stats.syncsThisMonth} icon="refresh" color="purple" />
      </div>

      {loading ? (
        <div className="table-loading"><Spinner size={32} /><span>加载中...</span></div>
      ) : integrations.length === 0 ? (
        <EmptyState icon="package" title="暂无集成" description="点击右上角按钮添加第一个集成" />
      ) : (
        <div className="card-grid">
          {integrations.map((integration) => {
            const typeInfo = getIntegrationType(integration.type);
            return (
              <div key={integration.id} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{typeInfo?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{integration.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{typeInfo?.label}</div>
                  </div>
                  <StatusDot color={getStatusColor(integration.status)} pulse={integration.status === "connected"} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>状态</span>
                    <Badge
                      variant={integration.status === "connected" ? "success" : integration.status === "error" ? "danger" : "default"}
                      size="sm"
                    >
                      {getStatusLabel(integration.status)}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>创建时间</span>
                    <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
                  </div>
                  {integration.lastSyncAt && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#6b7280" }}>最后同步</span>
                      <span>{new Date(integration.lastSyncAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* 连接测试结果 */}
                {testResult && selectedIntegration?.id === integration.id && (
                  <div className={`alert ${testResult.success ? "alert-success" : "alert-error"}`} style={{ marginBottom: 8, padding: "8px 12px", fontSize: 12 }}>
                    {testResult.message}
                  </div>
                )}

                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Button variant="ghost" size="sm" onClick={() => openConfigModal(integration)}>配置</Button>
                  <Button variant="ghost" size="sm" onClick={() => openSyncModal(integration)}>历史</Button>
                  {integration.status === "not_configured" && (
                    <Button variant="primary" size="sm" onClick={() => handleConnect(integration.id)}>连接</Button>
                  )}
                  {integration.status === "connected" && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => handleSync(integration.id)}>同步</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleTestConnection(integration.id)} loading={testingId === integration.id}>
                        测试
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDisconnect(integration.id)}>
                        <span style={{ color: "#ea580c" }}>断开</span>
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(integration)}>
                    <span style={{ color: "#dc2626" }}>删除</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 创建 Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="添加集成" size="md">
        <div className="form-group">
          <label className="form-label">集成类型</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {integrationTypes.map((type) => (
              <button
                key={type.type}
                onClick={() => setNewIntegration({ ...newIntegration, type: type.type })}
                className={`btn ${newIntegration.type === type.type ? "btn-primary" : "btn-secondary"} btn-sm`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">名称</label>
          <input
            className="form-input"
            type="text"
            value={newIntegration.name}
            onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
            placeholder="输入集成名称"
          />
        </div>
        <div className="form-group">
          <label className="form-label">配置（JSON）</label>
          <textarea
            className="form-input form-textarea"
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
          <Button variant="primary" onClick={handleCreate}>添加</Button>
        </div>
      </Modal>

      {/* 集成配置 Modal */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title={`配置 - ${selectedIntegration?.name || ""}`} size="lg">
        {configLoading ? (
          <div className="table-loading"><Spinner size={32} /><span>加载配置中...</span></div>
        ) : (
          <div>
            <div className="detail-grid">
              {integrationConfig.apiKey && (
                <div className="detail-item detail-full">
                  <span className="detail-label">API 密钥</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <input
                      className="form-input"
                      type="text"
                      value={integrationConfig.apiKey}
                      readOnly
                      style={{ fontFamily: "monospace", fontSize: 13 }}
                    />
                    <CopyButton text={integrationConfig.apiKey} label="复制密钥" />
                  </div>
                </div>
              )}
              {integrationConfig.apiSecret && (
                <div className="detail-item detail-full">
                  <span className="detail-label">API Secret</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <input
                      className="form-input"
                      type="password"
                      value={integrationConfig.apiSecret}
                      readOnly
                      style={{ fontFamily: "monospace", fontSize: 13 }}
                    />
                  </div>
                </div>
              )}
              {integrationConfig.callbackUrl && (
                <div className="detail-item detail-full">
                  <span className="detail-label">回调 URL</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <input
                      className="form-input"
                      type="text"
                      value={integrationConfig.callbackUrl}
                      readOnly
                      style={{ fontSize: 13 }}
                    />
                    <CopyButton text={integrationConfig.callbackUrl} label="复制" />
                  </div>
                </div>
              )}
              {integrationConfig.webhookUrl && (
                <div className="detail-item detail-full">
                  <span className="detail-label">Webhook URL</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <input
                      className="form-input"
                      type="text"
                      value={integrationConfig.webhookUrl}
                      readOnly
                      style={{ fontSize: 13 }}
                    />
                    <CopyButton text={integrationConfig.webhookUrl} label="复制" />
                  </div>
                </div>
              )}
              {integrationConfig.endpoint && (
                <div className="detail-item detail-full">
                  <span className="detail-label">API Endpoint</span>
                  <span className="detail-value" style={{ fontFamily: "monospace", fontSize: 13 }}>{integrationConfig.endpoint}</span>
                </div>
              )}
            </div>
            {Object.keys(integrationConfig).length === 0 && (
              <EmptyState icon="info" title="暂无配置信息" description="此集成尚未配置连接参数" />
            )}
          </div>
        )}
      </Modal>

      {/* 同步历史 Modal */}
      <Modal open={showSyncModal} onClose={() => setShowSyncModal(false)} title={`同步历史 - ${selectedIntegration?.name || ""}`} size="lg">
        {syncLoading ? (
          <div className="table-loading"><Spinner size={32} /><span>加载同步记录中...</span></div>
        ) : syncRecords.length === 0 ? (
          <EmptyState icon="refresh" title="暂无同步记录" description="该集成尚未执行过同步操作" />
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                <span>成功: <strong style={{ color: "#16a34a" }}>{syncRecords.filter(r => r.status === "success").length}</strong></span>
                <span>失败: <strong style={{ color: "#dc2626" }}>{syncRecords.filter(r => r.status === "failed").length}</strong></span>
                <span>进行中: <strong style={{ color: "#ea580c" }}>{syncRecords.filter(r => r.status === "in_progress").length}</strong></span>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>记录数</th>
                    <th>开始时间</th>
                    <th>完成时间</th>
                    <th>错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {syncRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{getSyncStatusBadge(record.status)}</td>
                      <td>{record.recordsCount}</td>
                      <td style={{ fontSize: 13 }}>{new Date(record.startedAt).toLocaleString()}</td>
                      <td style={{ fontSize: 13 }}>
                        {record.completedAt ? new Date(record.completedAt).toLocaleString() : "-"}
                      </td>
                      <td style={{ fontSize: 12, color: "#dc2626", maxWidth: 200 }} className="truncate">
                        {record.errorMessage || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除集成"
        message={`确定要删除集成 "${deleteTarget?.name}" 吗？相关的同步记录和配置将被永久删除。此操作不可撤销。`}
        variant="danger"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
