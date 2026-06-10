import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";

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

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
}

interface InvoiceDetail {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
  payments: PaymentRecord[];
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "all" as "all" | "pending" | "paid" | "overdue" | "refunded",
    period: "all" as "all" | "this_month" | "last_month" | "this_year"
  });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailData, setDetailData] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response || []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, [filter, dateRange]);

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

  async function handleShowDetail(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/invoices/${invoice.id}/detail`).catch(() => null);
      if (response) {
        setDetailData(response);
      } else {
        setDetailData({
          invoice,
          lineItems: [],
          payments: []
        });
      }
    } catch (error) {
      console.error("Failed to fetch invoice detail:", error);
      setDetailData({ invoice, lineItems: [], payments: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  function getStatusClass(status: Invoice["status"]) {
    return `status-${status}`;
  }

  function isOverdue(dueDate: string, status: string): boolean {
    if (status === "paid" || status === "refunded") return false;
    return new Date(dueDate) < new Date();
  }

  function getPaymentStatusTimeline(invoice: Invoice, payments: PaymentRecord[]) {
    const steps: { label: string; date?: string; active: boolean }[] = [
      { label: "已开票", date: invoice.issueDate, active: true },
      { label: "待支付", date: invoice.dueDate, active: invoice.status === "pending" || invoice.status === "overdue" || invoice.status === "paid" },
      { label: "已支付", date: invoice.paidAt, active: invoice.status === "paid" || invoice.status === "refunded" },
    ];
    if (invoice.status === "refunded") {
      steps.push({ label: "已退款", date: undefined, active: true });
    }
    return steps;
  }

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingAmount = invoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueAmount = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  const thisMonthRevenue = invoices
    .filter((i) => {
      if (i.status !== "paid" || !i.paidAt) return false;
      const paidDate = new Date(i.paidAt);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>发票管理</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">本月收入</div>
          <div className="value">¥{thisMonthRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">已收款项</div>
          <div className="value">¥{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">待收金额</div>
          <div className="value" style={{ color: "#ea580c" }}>¥{pendingAmount.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">逾期金额</div>
          <div className="value" style={{ color: "#dc2626" }}>¥{overdueAmount.toLocaleString()}</div>
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
        <div className="filter-group">
          <label>开始日期</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
          />
        </div>
        <div className="filter-group">
          <label>结束日期</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
          />
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
                  <td className="mono">
                    <button
                      onClick={() => handleShowDetail(invoice)}
                      className="btn-link"
                      style={{ fontSize: "13px" }}
                    >
                      {invoice.invoiceNumber}
                    </button>
                  </td>
                  <td>{invoice.tenantName}</td>
                  <td className="amount">¥{invoice.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                      {statusNames[invoice.status]}
                    </span>
                  </td>
                  <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td className={isOverdue(invoice.dueDate, invoice.status) ? "overdue" : ""}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : "-"}</td>
                  <td className="actions">
                    {invoice.status === "pending" && can("invoice:manage") && (
                      <button onClick={() => handleMarkPaid(invoice.id)} className="btn-primary">
                        确认支付
                      </button>
                    )}
                    {invoice.status === "paid" && can("invoice:manage") && (
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

      {showDetailModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">发票详情 - {selectedInvoice.invoiceNumber}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="loading">加载中...</div>
              ) : detailData ? (
                <>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">发票编号</span>
                      <span className="detail-value mono">{detailData.invoice.invoiceNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">租户名称</span>
                      <span className="detail-value">{detailData.invoice.tenantName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">金额</span>
                      <span className="detail-value">¥{detailData.invoice.amount.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">状态</span>
                      <span className={`badge ${detailData.invoice.status === "paid" ? "badge-success" : detailData.invoice.status === "overdue" ? "badge-danger" : detailData.invoice.status === "refunded" ? "badge-info" : "badge-warning"}`}>
                        {statusNames[detailData.invoice.status]}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">开票日期</span>
                      <span className="detail-value">{new Date(detailData.invoice.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">到期日期</span>
                      <span className="detail-value">{new Date(detailData.invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">支付时间</span>
                      <span className="detail-value">{detailData.invoice.paidAt ? new Date(detailData.invoice.paidAt).toLocaleString() : "未支付"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">创建时间</span>
                      <span className="detail-value">{new Date(detailData.invoice.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <h3 style={{ marginTop: "20px", marginBottom: "12px", fontSize: "15px" }}>付款状态时间线</h3>
                  <div className="timeline">
                    {getPaymentStatusTimeline(detailData.invoice, detailData.payments).map((step, idx) => (
                      <div key={idx} className="timeline-item">
                        <div
                          className="timeline-dot"
                          style={{ background: step.active ? "#2563eb" : "#d1d5db" }}
                        />
                        <div className="timeline-content">
                          <div className="timeline-title" style={{ color: step.active ? "#111827" : "#9ca3af" }}>
                            {step.label}
                          </div>
                          {step.date && (
                            <div className="timeline-time">
                              {new Date(step.date).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {detailData.lineItems.length > 0 && (
                    <>
                      <h3 style={{ marginTop: "20px", marginBottom: "12px", fontSize: "15px" }}>明细行项目</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>描述</th>
                            <th>数量</th>
                            <th>单价</th>
                            <th>小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.lineItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.description}</td>
                              <td>{item.quantity}</td>
                              <td>¥{item.unitPrice.toLocaleString()}</td>
                              <td>¥{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {detailData.payments.length > 0 && (
                    <>
                      <h3 style={{ marginTop: "20px", marginBottom: "12px", fontSize: "15px" }}>付款记录</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>金额</th>
                            <th>支付方式</th>
                            <th>状态</th>
                            <th>支付时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>¥{payment.amount.toLocaleString()}</td>
                              <td>{payment.method}</td>
                              <td><span className="badge badge-success">{payment.status}</span></td>
                              <td>{new Date(payment.paidAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-title">无法加载发票详情</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
