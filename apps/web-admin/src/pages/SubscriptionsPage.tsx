import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";

interface Subscription {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "trial" | "cancelled" | "expired";
  startDate: string;
  endDate?: string;
  seats: number;
  monthlyRate: number;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceHistoryItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  issueDate: string;
  paidAt?: string;
}

interface UsageStats {
  currentPeriod: string;
  apiCalls: number;
  apiCallsLimit: number;
  storageUsedGB: number;
  storageLimitGB: number;
  activeUsers: number;
  seatsLimit: number;
}

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    plan: "all" as "all" | "free" | "pro" | "enterprise",
    status: "all" as "all" | "active" | "trial" | "cancelled" | "expired"
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryItem[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [targetPlan, setTargetPlan] = useState<Subscription["plan"]>("pro");
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);

  const planNames = { free: "免费版", pro: "专业版", enterprise: "企业版" };
  const statusNames = { active: "活跃", trial: "试用", cancelled: "已取消", expired: "已过期" };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.plan !== "all") params.append("plan", filter.plan);
      if (filter.status !== "all") params.append("status", filter.status);

      const response = await api.get(`/subscriptions?${params.toString()}`);
      setSubscriptions(response || []);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  async function handleCancel(id: string) {
    if (confirm("确定要取消订阅吗？")) {
      try {
        await api.post(`/subscriptions/${id}/cancel`);
        fetchSubscriptions();
      } catch (error) {
        console.error("Failed to cancel subscription:", error);
      }
    }
  }

  async function handleRenew(id: string) {
    setShowRenewConfirm(true);
  }

  async function confirmRenew() {
    if (!selectedSubscription) return;
    try {
      await api.post(`/subscriptions/${selectedSubscription.id}/renew`);
      setShowRenewConfirm(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error("Failed to renew subscription:", error);
    }
  }

  async function handleShowDetail(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const [invoiceRes, usageRes] = await Promise.all([
        api.get(`/subscriptions/${subscription.id}/invoices`).catch(() => []),
        api.get(`/subscriptions/${subscription.id}/usage`).catch(() => null)
      ]);
      setInvoiceHistory(invoiceRes || []);
      setUsageStats(usageRes || null);
    } catch (error) {
      console.error("Failed to fetch subscription details:", error);
      setInvoiceHistory([]);
      setUsageStats(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleChangePlan(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setTargetPlan(subscription.plan === "free" ? "pro" : subscription.plan === "pro" ? "enterprise" : "pro");
    setShowChangePlanModal(true);
  }

  async function confirmChangePlan() {
    if (!selectedSubscription) return;
    try {
      await api.put(`/subscriptions/${selectedSubscription.id}/plan`, { plan: targetPlan });
      setShowChangePlanModal(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error("Failed to change plan:", error);
    }
  }

  function getStatusClass(status: Subscription["status"]) {
    return `status-${status}`;
  }

  function getPlanClass(plan: Subscription["plan"]) {
    return `plan-${plan}`;
  }

  function isExpiringSoon(subscription: Subscription): boolean {
    if (!subscription.endDate) return false;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active" || s.status === "trial");
  const expiringThisMonth = subscriptions.filter((s) => {
    if (!s.endDate) return false;
    const endDate = new Date(s.endDate);
    const now = new Date();
    return endDate.getMonth() === now.getMonth() && endDate.getFullYear() === now.getFullYear();
  });
  const totalMRR = subscriptions
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((sum, s) => sum + s.monthlyRate, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>订阅管理</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">活跃订阅数</div>
          <div className="value">{activeSubscriptions.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">本月到期数</div>
          <div className="value">{expiringThisMonth.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">总 MRR</div>
          <div className="value">¥{totalMRR.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">总订阅数</div>
          <div className="value">{subscriptions.length}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>套餐类型</label>
          <select
            value={filter.plan}
            onChange={(e) => setFilter({ ...filter, plan: e.target.value as typeof filter.plan })}
          >
            <option value="all">全部</option>
            <option value="free">免费版</option>
            <option value="pro">专业版</option>
            <option value="enterprise">企业版</option>
          </select>
        </div>
        <div className="filter-group">
          <label>状态</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as typeof filter.status })}
          >
            <option value="all">全部</option>
            <option value="active">活跃</option>
            <option value="trial">试用</option>
            <option value="cancelled">已取消</option>
            <option value="expired">已过期</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>租户名称</th>
                <th>套餐类型</th>
                <th>状态</th>
                <th>席位数量</th>
                <th>月费 (元)</th>
                <th>开始日期</th>
                <th>到期日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <button
                      onClick={() => handleShowDetail(subscription)}
                      className="btn-link"
                      style={{ fontSize: "14px" }}
                    >
                      {subscription.tenantName}
                    </button>
                  </td>
                  <td>
                    <span className={`plan-tag ${getPlanClass(subscription.plan)}`}>
                      {planNames[subscription.plan]}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(subscription.status)}`}>
                      {statusNames[subscription.status]}
                    </span>
                    {isExpiringSoon(subscription) && (
                      <span className="badge badge-warning badge-sm" style={{ marginLeft: "6px" }}>
                        即将到期
                      </span>
                    )}
                  </td>
                  <td>{subscription.seats}</td>
                  <td>{subscription.monthlyRate.toLocaleString()}</td>
                  <td>{new Date(subscription.startDate).toLocaleDateString()}</td>
                  <td>{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : "永久"}</td>
                  <td className="actions">
                    {can("subscription:manage") && (
                      <button onClick={() => handleChangePlan(subscription)} className="btn-secondary">
                        变更套餐
                      </button>
                    )}
                    {subscription.status === "active" && can("subscription:manage") && (
                      <button onClick={() => handleCancel(subscription.id)} className="btn-warning">
                        取消
                      </button>
                    )}
                    {(subscription.status === "expired" || subscription.status === "cancelled") && can("subscription:manage") && (
                      <button onClick={() => { setSelectedSubscription(subscription); handleRenew(subscription.id); }} className="btn-primary">
                        续费
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && (
            <div className="empty-state">暂无订阅记录</div>
          )}
        </div>
      )}

      {showDetailModal && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">订阅详情 - {selectedSubscription.tenantName}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="loading">加载中...</div>
              ) : (
                <>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">套餐类型</span>
                      <span className="detail-value">{planNames[selectedSubscription.plan]}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">状态</span>
                      <span className="detail-value">{statusNames[selectedSubscription.status]}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">席位数量</span>
                      <span className="detail-value">{selectedSubscription.seats}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">月费</span>
                      <span className="detail-value">¥{selectedSubscription.monthlyRate.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">开始日期</span>
                      <span className="detail-value">{new Date(selectedSubscription.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">到期日期</span>
                      <span className="detail-value">{selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toLocaleDateString() : "永久"}</span>
                    </div>
                  </div>

                  {usageStats && (
                    <>
                      <h3 style={{ marginTop: "20px", marginBottom: "12px", fontSize: "15px" }}>用量统计</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">API 调用</span>
                          <div style={{ marginTop: "4px" }}>
                            <div className="progress-bar progress-sm" style={{ maxWidth: "200px" }}>
                              <div
                                className={`progress-fill ${usageStats.apiCalls / usageStats.apiCallsLimit > 0.9 ? "progress-red" : usageStats.apiCalls / usageStats.apiCallsLimit > 0.7 ? "progress-orange" : "progress-blue"}`}
                                style={{ width: `${Math.min((usageStats.apiCalls / usageStats.apiCallsLimit) * 100, 100)}%` }}
                              />
                            </div>
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>
                              {usageStats.apiCalls.toLocaleString()} / {usageStats.apiCallsLimit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">存储用量</span>
                          <div style={{ marginTop: "4px" }}>
                            <div className="progress-bar progress-sm" style={{ maxWidth: "200px" }}>
                              <div
                                className={`progress-fill ${usageStats.storageUsedGB / usageStats.storageLimitGB > 0.9 ? "progress-red" : usageStats.storageUsedGB / usageStats.storageLimitGB > 0.7 ? "progress-orange" : "progress-blue"}`}
                                style={{ width: `${Math.min((usageStats.storageUsedGB / usageStats.storageLimitGB) * 100, 100)}%` }}
                              />
                            </div>
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>
                              {usageStats.storageUsedGB} GB / {usageStats.storageLimitGB} GB
                            </span>
                          </div>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">活跃用户</span>
                          <span className="detail-value">{usageStats.activeUsers} / {usageStats.seatsLimit}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">当前计费周期</span>
                          <span className="detail-value">{usageStats.currentPeriod}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <h3 style={{ marginTop: "20px", marginBottom: "12px", fontSize: "15px" }}>发票历史</h3>
                  {invoiceHistory.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>发票编号</th>
                          <th>金额</th>
                          <th>状态</th>
                          <th>开票日期</th>
                          <th>支付时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceHistory.map((inv) => (
                          <tr key={inv.id}>
                            <td className="mono">{inv.invoiceNumber}</td>
                            <td>¥{inv.amount.toLocaleString()}</td>
                            <td><span className={`badge ${inv.status === "paid" ? "badge-success" : inv.status === "overdue" ? "badge-danger" : "badge-warning"}`}>{inv.status}</span></td>
                            <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                            <td>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-title">暂无发票记录</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      )}

      {showChangePlanModal && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setShowChangePlanModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">变更套餐</h2>
              <button className="modal-close" onClick={() => setShowChangePlanModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p className="confirm-message">
                  当前套餐: <strong>{planNames[selectedSubscription.plan]}</strong>
                </p>
                <div className="form-group">
                  <label>目标套餐</label>
                  <select
                    value={targetPlan}
                    onChange={(e) => setTargetPlan(e.target.value as Subscription["plan"])}
                    className="form-select"
                    style={{ width: "100%", padding: "8px 12px", marginTop: "8px" }}
                  >
                    {(["free", "pro", "enterprise"] as const)
                      .filter((p) => p !== selectedSubscription.plan)
                      .map((plan) => (
                        <option key={plan} value={plan}>{planNames[plan]}</option>
                      ))}
                  </select>
                </div>
                <p className="confirm-message" style={{ marginTop: "16px", color: "#6b7280", fontSize: "13px" }}>
                  {targetPlan === "enterprise" && selectedSubscription.plan === "free"
                    ? "从免费版升级到企业版，将立即生效并按企业版计费。"
                    : targetPlan === "pro" && selectedSubscription.plan === "free"
                    ? "从免费版升级到专业版，将解锁更多功能。"
                    : targetPlan === "free"
                    ? "降级到免费版将失去高级功能，当前周期结束后生效。"
                    : "套餐变更将在当前计费周期结束后生效。"}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowChangePlanModal(false)} className="btn-secondary">取消</button>
              <button onClick={confirmChangePlan} className="btn-primary">确认变更</button>
            </div>
          </div>
        </div>
      )}

      {showRenewConfirm && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setShowRenewConfirm(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">确认续费</h2>
              <button className="modal-close" onClick={() => setShowRenewConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p className="confirm-message">
                  确认为 <strong>{selectedSubscription.tenantName}</strong> 续费 {planNames[selectedSubscription.plan]} 套餐？
                </p>
                <p className="confirm-message" style={{ color: "#6b7280", fontSize: "13px" }}>
                  月费: ¥{selectedSubscription.monthlyRate.toLocaleString()}，续费后将立即生效。
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowRenewConfirm(false)} className="btn-secondary">取消</button>
              <button onClick={confirmRenew} className="btn-primary">确认续费</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
