import { useState, useEffect } from "react";
import { api } from "../lib/api";

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

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    plan: "all" as "all" | "free" | "pro" | "enterprise",
    status: "all" as "all" | "active" | "trial" | "cancelled" | "expired"
  });

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
      setSubscriptions(response.data);
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
    try {
      await api.post(`/subscriptions/${id}/renew`);
      fetchSubscriptions();
    } catch (error) {
      console.error("Failed to renew subscription:", error);
    }
  }

  function getStatusClass(status: Subscription["status"]) {
    return `status-${status}`;
  }

  function getPlanClass(plan: Subscription["plan"]) {
    return `plan-${plan}`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>订阅管理</h1>
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
                  <td>{subscription.tenantName}</td>
                  <td>
                    <span className={`plan-tag ${getPlanClass(subscription.plan)}`}>
                      {planNames[subscription.plan]}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(subscription.status)}`}>
                      {statusNames[subscription.status]}
                    </span>
                  </td>
                  <td>{subscription.seats}</td>
                  <td>{subscription.monthlyRate.toLocaleString()}</td>
                  <td>{new Date(subscription.startDate).toLocaleDateString()}</td>
                  <td>{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : "永久"}</td>
                  <td className="actions">
                    {subscription.status === "active" && (
                      <button onClick={() => handleCancel(subscription.id)} className="btn-warning">
                        取消
                      </button>
                    )}
                    {(subscription.status === "expired" || subscription.status === "cancelled") && (
                      <button onClick={() => handleRenew(subscription.id)} className="btn-primary">
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
    </div>
  );
}