import { invoices } from "../store";
import type { Invoice, InvoiceItem } from "@trae/shared";

export const invoiceService = {
  createInvoice(tenantId: string, subscriptionId: string, invoiceNumber: string, amount: number, currency: string, periodStart: string, periodEnd: string, items: InvoiceItem[]): Invoice {
    return invoices.create({
      tenantId,
      subscriptionId,
      invoiceNumber,
      status: "draft",
      amount,
      currency,
      periodStart,
      periodEnd,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items,
      createdAt: new Date().toISOString()
    });
  },

  getInvoice(id: string): Invoice | undefined {
    return invoices.get(id);
  },

  getInvoicesByTenant(tenantId: string, status?: Invoice["status"]): Invoice[] {
    let result = invoices.findByTenantId(tenantId);
    if (status) {
      result = result.filter(i => i.status === status);
    }
    return result;
  },

  getInvoicesBySubscription(subscriptionId: string): Invoice[] {
    return invoices.findBySubscriptionId(subscriptionId);
  },

  getAllInvoices(status?: Invoice["status"]): Invoice[] {
    let result = invoices.getAll();
    if (status) {
      result = result.filter(i => i.status === status);
    }
    return result;
  },

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | undefined {
    return invoices.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteInvoice(id: string): boolean {
    return invoices.delete(id);
  },

  sendInvoice(id: string): Invoice | undefined {
    return invoices.update(id, {
      status: "sent",
      updatedAt: new Date().toISOString()
    });
  },

  payInvoice(id: string): Invoice | undefined {
    return invoices.update(id, {
      status: "paid",
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  cancelInvoice(id: string): Invoice | undefined {
    return invoices.update(id, {
      status: "canceled",
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  getOverdueInvoices(): Invoice[] {
    return invoices.findOverdue();
  },

  generateInvoiceNumber(prefix: string = "INV"): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const count = invoices.getAll().filter(i => i.invoiceNumber.startsWith(`${prefix}-${year}-${month}`)).length + 1;
    return `${prefix}-${year}-${month}-${String(count).padStart(4, "0")}`;
  },

  calculateTotal(items: InvoiceItem[]): number {
    return items.reduce((acc, item) => acc + item.total, 0);
  },

  createSubscriptionInvoice(subscriptionId: string, periodStart: string, periodEnd: string): Invoice | undefined {
    const subscription = require("./subscription-service").subscriptionService.getSubscription(subscriptionId);
    if (!subscription) return undefined;
    
    const amount = subscription.period === "yearly" ? subscription.annualRate : subscription.monthlyRate;
    const items: InvoiceItem[] = [{
      id: `inv-item-${Date.now()}`,
      description: `${subscription.plan} 订阅费 (${subscription.period})`,
      quantity: 1,
      unitPrice: amount,
      total: amount
    }];
    
    const invoiceNumber = this.generateInvoiceNumber();
    
    return this.createInvoice(
      subscription.tenantId,
      subscriptionId,
      invoiceNumber,
      amount,
      "CNY",
      periodStart,
      periodEnd,
      items
    );
  },

  /**
   * 税金计算：根据金额和地区计算税额
   */
  calculateTax(amount: number, region?: string): { subtotal: number; taxRate: number; taxAmount: number; total: number } {
    // 默认税率映射（中国 6% 增值税，其他地区默认 0%）
    const taxRates: Record<string, number> = {
      "CN": 0.06,
      "US": 0.085,
      "EU": 0.20,
      "UK": 0.20,
      "JP": 0.10,
      "SG": 0.07
    };

    const effectiveRegion = region || "CN";
    const taxRate = taxRates[effectiveRegion] ?? 0;
    const taxAmount = Math.round(amount * taxRate * 100) / 100;
    const total = Math.round((amount + taxAmount) * 100) / 100;

    return {
      subtotal: amount,
      taxRate,
      taxAmount,
      total
    };
  },

  /**
   * 付款匹配：将付款与发票进行匹配，返回匹配结果和剩余金额
   */
  matchPayment(invoiceId: string, payment: { amount: number; method: string; reference: string }): { matched: boolean; remaining: number } {
    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return { matched: false, remaining: payment.amount };
    }

    // 已支付或已取消的发票不能再次匹配
    if (invoice.status === "paid" || invoice.status === "canceled" || invoice.status === "refunded") {
      return { matched: false, remaining: payment.amount };
    }

    const remaining = Math.round((payment.amount - invoice.amount) * 100) / 100;

    if (remaining >= 0) {
      // 付款金额足够，标记为已支付
      invoices.update(invoiceId, {
        status: "paid",
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { matched: true, remaining };
    } else {
      // 付款金额不足
      return { matched: false, remaining: Math.abs(remaining) };
    }
  },

  /**
   * 逾期处理：检查发票是否逾期，计算逾期天数和罚金
   */
  handleOverdue(invoiceId: string): { isOverdue: boolean; daysOverdue: number; penaltyAmount: number } {
    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return { isOverdue: false, daysOverdue: 0, penaltyAmount: 0 };
    }

    // 已支付或已取消的发票不算逾期
    if (invoice.status === "paid" || invoice.status === "canceled" || invoice.status === "refunded") {
      return { isOverdue: false, daysOverdue: 0, penaltyAmount: 0 };
    }

    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffMs = now.getTime() - dueDate.getTime();
    const daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (daysOverdue <= 0) {
      return { isOverdue: false, daysOverdue: 0, penaltyAmount: 0 };
    }

    // 罚金计算：每天 0.1% 的滞纳金，上限为发票金额的 30%
    const dailyPenaltyRate = 0.001;
    const rawPenalty = invoice.amount * dailyPenaltyRate * daysOverdue;
    const maxPenalty = invoice.amount * 0.30;
    const penaltyAmount = Math.round(Math.min(rawPenalty, maxPenalty) * 100) / 100;

    // 如果当前状态不是 overdue，自动更新
    if (invoice.status !== "overdue") {
      invoices.update(invoiceId, {
        status: "overdue",
        updatedAt: new Date().toISOString()
      });
    }

    return { isOverdue: true, daysOverdue, penaltyAmount };
  },

  /**
   * 发票统计：汇总所有发票的关键指标
   */
  getInvoiceStats(): { total: number; paid: number; pending: number; overdue: number; totalRevenue: number; outstandingAmount: number } {
    const allInvoices = invoices.getAll();
    const total = allInvoices.length;
    const paid = allInvoices.filter((i) => i.status === "paid").length;
    const pending = allInvoices.filter((i) => i.status === "draft" || i.status === "sent" || i.status === "pending").length;
    const overdue = allInvoices.filter((i) => i.status === "overdue").length;

    // 已收收入：已支付发票的金额总和
    const totalRevenue = allInvoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0);

    // 未收金额：非 paid/canceled/refunded 状态的发票金额总和
    const outstandingAmount = allInvoices
      .filter((i) => i.status !== "paid" && i.status !== "canceled" && i.status !== "refunded")
      .reduce((sum, i) => sum + i.amount, 0);

    return { total, paid, pending, overdue, totalRevenue, outstandingAmount };
  }
};