import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  subscriptionId: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "refunded";
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "all" as "all" | "pending" | "paid" | "overdue" | "refunded",
    period: "all" as "all" | "this_month" | "last_month" | "this_year"
  });

  const statusNames = { pending: "待支付", paid: "已支付", overdue: "逾期", refunded: "已退款" };

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status !== "all") params.append("status", filter.status);
      if (filter.period !== "all") params.append("period", filter.period);
      
      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  async function handleMarkPaid(id: string) {
    try {
      await api.post(`/invoices/${id}/pay`);
      fetchInvoices();
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
    }
  }

  async function handleRefund(id: string) {
    if (confirm("确定要退款吗？")) {
      try {
        await api.post(`/invoices/${id}/refund`);
        fetchInvoices();
      } catch (error) {
        console.error("Failed to refund invoice:", error);
      }
    }
  }

  function getStatusClass(status: Invoice["status"]) {
    return `status-${status}`;
  }

  function isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date() && !invoices.find(i => i.id === dueDate)?.paidAt;
  }

  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingAmount = invoices
    .filter(i => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueAmount = invoices
    .filter(i => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>发票管理</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">已收款项</span>
          <span className="stat-value">¥{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-label">待收款项</span>
          <span className="stat-value">¥{pendingAmount.toLocaleString()}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">逾期款项</span>
          <span className="stat-value">¥{overdueAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>状态</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as typeof filter.status })}
          >
            <option value="all">全部</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="overdue">逾期</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
        <div className="filter-group">
          <label>时间范围</label>
          <select
            value={filter.period}
            onChange={(e) => setFilter({ ...filter, period: e.target.value as typeof filter.period })}
          >
            <option value="all">全部</option>
            <option value="this_month">本月</option>
            <option value="last_month">上月</option>
            <option value="this_year">本年</option>
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
                <th>发票编号</th>
                <th>租户名称</th>
                <th>金额</th>
                <th>状态</th>
                <th>开票日期</th>
                <th>到期日期</th>
                <th>支付时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="mono">{invoice.invoiceNumber}</td>
                  <td>{invoice.tenantName}</td>
                  <td className="amount">¥{invoice.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                      {statusNames[invoice.status]}
                    </span>
                  </td>
                  <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td className={isOverdue(invoice.dueDate) ? "overdue" : ""}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : "-"}</td>
                  <td className="actions">
                    {invoice.status === "pending" && (
                      <button onClick={() => handleMarkPaid(invoice.id)} className="btn-primary">
                        确认支付
                      </button>
                    )}
                    {invoice.status === "paid" && (
                      <button onClick={() => handleRefund(invoice.id)} className="btn-warning">
                        退款
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="empty-state">暂无发票记录</div>
          )}
        </div>
      )}
    </div>
  );
}