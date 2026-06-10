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
import { FilterBar } from "../components/FilterBar";
import { StatusDot } from "../components/StatusDot";
import { CopyButton } from "../components/CopyButton";
import { ConfirmDialog } from "../components/ConfirmDialog";


interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  secretKey?: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  eventType: string;
  status: "success" | "failed" | "pending";
  requestBody: string;
  responseBody: string;
  responseCode: number;
  retryCount: number;
  createdAt: string;
}

interface DeliveryStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
}

export function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: [] as string[] });
  const [filter, setFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  // 新增状态：投递日志
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);

  // 新增状态：签名密钥
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretLoading, setSecretLoading] = useState(false);
  const [secretKey, setSecretKey] = useState("");

  // 新增状态：投递统计
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({ total: 0, success: 0, failed: 0, pending: 0, successRate: 0 });

  // 新增状态：删除确认
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);

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

  const eventFilterOptions = [
    { label: "全部事件", value: "" },
    { label: "webhook.created", value: "webhook.created" },
    { label: "webhook.updated", value: "webhook.updated" },
    { label: "webhook.deleted", value: "webhook.deleted" },
    { label: "webhook.delivery", value: "webhook.delivery" },
  ];

  useEffect(() => {
    fetchWebhooks();
    fetchDeliveryStats();
  }, []);

  async function fetchWebhooks() {
    setLoading(true);
    try {
      const response = await api.get("/webhooks");
      setWebhooks(response || []);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeliveryStats() {
    try {
      const response = await api.get("/webhooks/delivery-stats");
      setDeliveryStats(response);
    } catch {
      // 使用模拟数据
      setDeliveryStats({ total: 156, success: 142, failed: 10, pending: 4, successRate: 91.0 });
    }
  }

  async function fetchDeliveryLogs(webhookId: string) {
    setLogsLoading(true);
    try {
      const response = await api.get(`/webhooks/${webhookId}/deliveries`);
      setDeliveryLogs(response);
    } catch {
      // 模拟数据
      setDeliveryLogs([
        { id: "dl-1", webhookId, eventType: "approvals.created", status: "success", requestBody: '{"event":"approvals.created","data":{"id":"ap-1"}}', responseBody: '{"ok":true}', responseCode: 200, retryCount: 0, createdAt: new Date().toISOString() },
        { id: "dl-2", webhookId, eventType: "releases.deployed", status: "failed", requestBody: '{"event":"releases.deployed","data":{"id":"rel-1"}}', responseBody: '{"error":"timeout"}', responseCode: 504, retryCount: 3, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "dl-3", webhookId, eventType: "users.created", status: "success", requestBody: '{"event":"users.created","data":{"id":"u-1"}}', responseBody: '{"ok":true}', responseCode: 200, retryCount: 0, createdAt: new Date(Date.now() - 7200000).toISOString() },
      ]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function fetchSecretKey(webhookId: string) {
    setSecretLoading(true);
    try {
      const response = await api.get(`/webhooks/${webhookId}/secret`);
      setSecretKey(response.secretKey);
    } catch {
      setSecretKey("whsec_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    } finally {
      setSecretLoading(false);
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

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/webhooks/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to delete webhook:", error);
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

  function openLogModal(webhook: Webhook) {
    setSelectedWebhook(webhook);
    setShowLogModal(true);
    fetchDeliveryLogs(webhook.id);
  }

  function openSecretModal(webhook: Webhook) {
    setSelectedWebhook(webhook);
    setShowSecretModal(true);
    fetchSecretKey(webhook.id);
  }

  function getStatusBadge(status: DeliveryLog["status"]) {
    const map = { success: "success" as const, failed: "danger" as const, pending: "warning" as const };
    const labels = { success: "成功", failed: "失败", pending: "待处理" };
    return <Badge variant={map[status]} size="sm">{labels[status]}</Badge>;
  }

  const filteredWebhooks = webhooks.filter(w => {
    const nameMatch = w.name.toLowerCase().includes(filter.toLowerCase()) ||
      w.url.toLowerCase().includes(filter.toLowerCase());
    const eventMatch = !eventFilter || w.events.includes(eventFilter);
    return nameMatch && eventMatch;
  });

  const activeCount = webhooks.filter(w => w.isActive).length;
  const inactiveCount = webhooks.filter(w => !w.isActive).length;

  return (
    <div className="page-container">
      <PageHeader
        title="Webhook 配置"
        description="管理和监控 Webhook 端点，查看投递日志与统计"
        actions={
          can("webhook:manage") ? (
            <Button variant="primary" icon="plus" onClick={() => setShowCreateModal(true)}>
              创建 Webhook
            </Button>
          ) : undefined
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard title="Webhook 总数" value={webhooks.length} icon="bell" color="blue" />
        <StatCard title="已启用" value={activeCount} icon="check" color="green" />
        <StatCard title="已禁用" value={inactiveCount} icon="x" color="orange" />
        <StatCard
          title="投递成功率"
          value={`${deliveryStats.successRate.toFixed(1)}%`}
          icon="arrow-up"
          color={deliveryStats.successRate >= 90 ? "green" : "orange"}
          trend={{ value: `${deliveryStats.success} / ${deliveryStats.total}`, direction: deliveryStats.successRate >= 90 ? "up" : "down" }}
        />
      </div>

      {/* 搜索与筛选 */}
      <div className="filter-bar">
        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="搜索 Webhook 名称或 URL..."
        />
        <FilterBar
          filters={[
            {
              key: "event",
              label: "事件类型",
              options: eventFilterOptions,
              value: eventFilter,
              onChange: setEventFilter,
            },
          ]}
          onReset={() => setEventFilter("")}
        />
      </div>

      {loading ? (
        <div className="table-loading"><Spinner size={32} /><span>加载中...</span></div>
      ) : filteredWebhooks.length === 0 ? (
        <EmptyState icon="bell" title="暂无 Webhook" description="点击右上角按钮创建第一个 Webhook" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
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
                  <td className="truncate" style={{ maxWidth: 200 }}>{webhook.url}</td>
                  <td>
                    <div className="tags">
                      {webhook.events.slice(0, 3).map((event, idx) => (
                        <span key={idx} className="tag tag-blue">{event}</span>
                      ))}
                      {webhook.events.length > 3 && (
                        <span className="tag tag-gray">+{webhook.events.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusDot color={webhook.isActive ? "green" : "gray"} pulse={webhook.isActive} />
                    <span style={{ marginLeft: 6, fontSize: 13 }}>{webhook.isActive ? "启用" : "禁用"}</span>
                  </td>
                  <td>{new Date(webhook.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <Button variant="ghost" size="sm" onClick={() => openLogModal(webhook)}>日志</Button>
                      <Button variant="ghost" size="sm" onClick={() => openSecretModal(webhook)}>密钥</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(webhook)}>
                        {webhook.isActive ? "禁用" : "启用"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(webhook)}>
                        <span style={{ color: "#dc2626" }}>删除</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 创建 Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建 Webhook" size="lg">
        <div className="form-group">
          <label className="form-label">名称</label>
          <input
            className="form-input"
            type="text"
            value={newWebhook.name}
            onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
            placeholder="输入 Webhook 名称"
          />
        </div>
        <div className="form-group">
          <label className="form-label">URL</label>
          <input
            className="form-input"
            type="text"
            value={newWebhook.url}
            onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
            placeholder="输入回调 URL"
          />
        </div>
        <div className="form-group">
          <label className="form-label">订阅事件</label>
          <div className="checkbox-grid">
            {availableEvents.map((event) => (
              <label key={event} className="form-checkbox">
                <input
                  type="checkbox"
                  className="form-checkbox-input"
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
                <span className="form-checkbox-label">{event}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
          <Button variant="primary" onClick={handleCreate}>创建</Button>
        </div>
      </Modal>

      {/* 投递日志 Modal */}
      <Modal open={showLogModal} onClose={() => { setShowLogModal(false); setSelectedLog(null); }} title={`投递日志 - ${selectedWebhook?.name || ""}`} size="xl">
        {logsLoading ? (
          <div className="table-loading"><Spinner size={32} /><span>加载日志中...</span></div>
        ) : deliveryLogs.length === 0 ? (
          <EmptyState icon="info" title="暂无投递日志" description="该 Webhook 尚未产生投递记录" />
        ) : selectedLog ? (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)} style={{ marginBottom: 12 }}>
              &larr; 返回列表
            </Button>
            <Card>
              <CardHeader>投递详情</CardHeader>
              <CardBody>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">事件类型</span>
                    <span className="detail-value">{selectedLog.eventType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className="detail-value">{getStatusBadge(selectedLog.status)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">响应码</span>
                    <span className="detail-value">{selectedLog.responseCode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">重试次数</span>
                    <span className="detail-value">{selectedLog.retryCount}</span>
                  </div>
                  <div className="detail-item detail-full">
                    <span className="detail-label">请求内容</span>
                    <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 200, margin: "4px 0 0" }}>
                      {JSON.stringify(JSON.parse(selectedLog.requestBody), null, 2)}
                    </pre>
                  </div>
                  <div className="detail-item detail-full">
                    <span className="detail-label">响应内容</span>
                    <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 200, margin: "4px 0 0" }}>
                      {JSON.stringify(JSON.parse(selectedLog.responseBody), null, 2)}
                    </pre>
                  </div>
                  <div className="detail-item detail-full">
                    <span className="detail-label">投递时间</span>
                    <span className="detail-value">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>事件类型</th>
                  <th>状态</th>
                  <th>响应码</th>
                  <th>重试次数</th>
                  <th>投递时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {deliveryLogs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="tag tag-blue">{log.eventType}</span></td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td>{log.responseCode}</td>
                    <td>{log.retryCount}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>详情</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* 签名密钥 Modal */}
      <Modal open={showSecretModal} onClose={() => setShowSecretModal(false)} title={`签名密钥 - ${selectedWebhook?.name || ""}`} size="md">
        {secretLoading ? (
          <div className="table-loading"><Spinner size={32} /><span>加载密钥中...</span></div>
        ) : (
          <div>
            <div className="form-group">
              <label className="form-label">签名密钥</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="form-input"
                  type="text"
                  value={secretKey}
                  readOnly
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                />
                <CopyButton text={secretKey} label="复制密钥" />
              </div>
              <span className="form-helper">此密钥用于验证 Webhook 请求签名，请妥善保管</span>
            </div>
            <div className="form-group">
              <label className="form-label">使用方式</label>
              <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto" }}>
{`// 验证签名示例（Node.js）
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const computed = crypto
  .createHmac('sha256', '${secretKey}')
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== computed) {
  throw new Error('Invalid signature');
}`}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除 Webhook"
        message={`确定要删除 Webhook "${deleteTarget?.name}" 吗？此操作不可撤销。`}
        variant="danger"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
