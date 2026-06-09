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
  }
};