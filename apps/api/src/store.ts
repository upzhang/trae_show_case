import {
  activityEvents as seedActivityEvents,
  approvals as seedApprovals,
  auditLogs as seedAuditLogs,
  releases as seedReleases,
  supportRisks as seedSupportRisks,
  tenants as seedTenants,
  users as seedUsers
} from "./data/seed";

import type {
  ActivityEvent,
  ApprovalRequest,
  AuditLog,
  ReleaseRecord,
  SupportRisk,
  Tenant,
  User,
  Subscription,
  Invoice,
  Notification,
  NotificationPreference,
  WebhookEndpoint,
  WebhookDeliveryLog,
  ApiToken,
  Team,
  TeamMember,
  Integration,
  FeatureFlag,
  FeatureFlagAudit,
  RoleDefinition,
  Ticket,
  TicketConversation,
  TicketStatusTransition,
  PaginatedResponse,
  PaginationParams,
  SortParams
} from "@trae/shared";

interface Identifiable {
  id: string;
}

class Repository<T extends Identifiable> {
  protected items: T[];
  protected seedData: T[];

  constructor(seedData: T[]) {
    this.seedData = seedData;
    this.items = JSON.parse(JSON.stringify(seedData));
  }

  list(filter?: Partial<T>, pagination?: PaginationParams, sort?: SortParams): PaginatedResponse<T> {
    let result = [...this.items];

    if (filter) {
      result = result.filter((item) => {
        return Object.entries(filter).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          return (item as Record<string, unknown>)[key] === value;
        });
      });
    }

    if (sort?.sortBy) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sort.sortBy] as string | number | boolean | Date | undefined;
        const bVal = (b as Record<string, unknown>)[sort.sortBy] as string | number | boolean | Date | undefined;

        if (aVal === undefined || aVal === null) return sort.sortOrder === "asc" ? -1 : 1;
        if (bVal === undefined || bVal === null) return sort.sortOrder === "asc" ? 1 : -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sort.sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sort.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const total = result.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: result.slice(startIndex, endIndex),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  get(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  findByField<K extends keyof T>(field: K, value: T[K]): T | undefined {
    return this.items.find((item) => item[field] === value);
  }

  findByFields(fields: Partial<T>): T[] {
    return this.items.filter((item) => {
      return Object.entries(fields).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return (item as Record<string, unknown>)[key] === value;
      });
    });
  }

  create(item: Omit<T, "id"> & { id?: string }): T {
    const newItem = { ...item, id: (item as T).id || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` } as T;
    this.items.push(newItem);
    return newItem;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...updates };
    return this.items[index];
  }

  delete(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  count(filter?: Partial<T>): number {
    if (!filter) return this.items.length;
    return this.findByFields(filter).length;
  }

  exists(id: string): boolean {
    return this.items.some((item) => item.id === id);
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(this.seedData));
  }

  getAll(): T[] {
    return [...this.items];
  }
}

export class TenantRepository extends Repository<Tenant> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedTenants)));
  }

  findByIndustry(industry: string): Tenant[] {
    return this.findByFields({ industry });
  }

  findByPlan(plan: Tenant["plan"]): Tenant[] {
    return this.findByFields({ plan });
  }

  findByHealthScoreRange(min: number, max: number): Tenant[] {
    return this.items.filter((t) => t.healthScore >= min && t.healthScore <= max);
  }
}

export class UserRepository extends Repository<User> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedUsers)));
  }

  findByTenantId(tenantId: string): User[] {
    return this.findByFields({ tenantId });
  }

  findByEmail(email: string): User | undefined {
    return this.items.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findByRole(role: string): User[] {
    return this.items.filter((u) => u.roles.includes(role as never));
  }

  findActiveUsers(): User[] {
    return this.items.filter((u) => u.isActive !== false);
  }
}

export class ApprovalRepository extends Repository<ApprovalRequest> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedApprovals)));
  }

  findByTenantId(tenantId: string): ApprovalRequest[] {
    return this.findByFields({ tenantId });
  }

  findByStatus(status: ApprovalRequest["status"]): ApprovalRequest[] {
    return this.findByFields({ status });
  }

  findPending(): ApprovalRequest[] {
    return this.findByStatus("pending");
  }
}

export class ReleaseRepository extends Repository<ReleaseRecord> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedReleases)));
  }

  findByTenantId(tenantId: string): ReleaseRecord[] {
    return this.findByFields({ tenantId });
  }

  findByEnvironment(environment: ReleaseRecord["environment"]): ReleaseRecord[] {
    return this.findByFields({ environment });
  }

  findByStatus(status: ReleaseRecord["status"]): ReleaseRecord[] {
    return this.findByFields({ status });
  }
}

export class AuditLogRepository extends Repository<AuditLog> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedAuditLogs)));
  }

  findByTenantId(tenantId: string): AuditLog[] {
    return this.findByFields({ tenantId });
  }

  findByActorId(actorId: string): AuditLog[] {
    return this.findByFields({ actorId });
  }

  findByAction(action: string): AuditLog[] {
    return this.findByFields({ action });
  }
}

export class SupportRiskRepository extends Repository<SupportRisk> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedSupportRisks)));
  }

  findByTenantId(tenantId: string): SupportRisk[] {
    return this.findByFields({ tenantId });
  }

  findBySeverity(severity: SupportRisk["severity"]): SupportRisk[] {
    return this.findByFields({ severity });
  }

  findByStatus(status: SupportRisk["status"]): SupportRisk[] {
    return this.findByFields({ status });
  }

  findByCategory(category: SupportRisk["category"]): SupportRisk[] {
    return this.findByFields({ category });
  }

  findOpenRisks(): SupportRisk[] {
    return this.findByFields({ status: "open" });
  }

  findCriticalRisks(): SupportRisk[] {
    return this.findByFields({ severity: "critical", status: "open" });
  }
}

export class ActivityEventRepository extends Repository<ActivityEvent> {
  constructor() {
    super(JSON.parse(JSON.stringify(seedActivityEvents)));
  }

  findByTenantId(tenantId: string): ActivityEvent[] {
    return this.findByFields({ tenantId });
  }

  findByType(type: ActivityEvent["type"]): ActivityEvent[] {
    return this.findByFields({ type });
  }

  findRecent(limit: number = 20): ActivityEvent[] {
    return [...this.items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export class SubscriptionRepository extends Repository<Subscription> {
  private seedSubscriptions: Subscription[] = [
    { id: "sub-1", tenantId: "tenant-acme", plan: "enterprise", period: "yearly", status: "active", seats: 300, seatsUsed: 238, monthlyRate: 155000, annualRate: 1860000, nextBillingAt: "2027-03-01T00:00:00.000Z", createdAt: "2025-03-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "sub-2", tenantId: "tenant-orbit", plan: "standard", period: "monthly", status: "past_due", seats: 120, seatsUsed: 84, monthlyRate: 51667, nextBillingAt: "2026-06-15T00:00:00.000Z", createdAt: "2025-09-15T00:00:00.000Z", updatedAt: "2026-05-15T00:00:00.000Z" },
    { id: "sub-3", tenantId: "tenant-nova", plan: "enterprise", period: "yearly", status: "active", seats: 220, seatsUsed: 156, monthlyRate: 81667, annualRate: 980000, nextBillingAt: "2026-12-20T00:00:00.000Z", createdAt: "2025-12-20T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "sub-4", tenantId: "tenant-nexus", plan: "enterprise", period: "yearly", status: "active", seats: 150, seatsUsed: 98, monthlyRate: 61667, annualRate: 740000, nextBillingAt: "2027-01-18T00:00:00.000Z", createdAt: "2026-01-18T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "sub-5", tenantId: "tenant-pivot", plan: "standard", period: "monthly", status: "active", seats: 80, seatsUsed: 52, monthlyRate: 35000, nextBillingAt: "2026-07-02T00:00:00.000Z", createdAt: "2025-05-02T00:00:00.000Z", updatedAt: "2026-06-02T00:00:00.000Z" },
    { id: "sub-6", tenantId: "tenant-helios", plan: "enterprise", period: "yearly", status: "active", seats: 200, seatsUsed: 180, monthlyRate: 131667, annualRate: 1580000, nextBillingAt: "2027-08-18T00:00:00.000Z", createdAt: "2026-08-18T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "sub-7", tenantId: "tenant-verdant", plan: "standard", period: "monthly", status: "canceled", seats: 100, seatsUsed: 28, monthlyRate: 23333, cancelAt: "2026-08-10T00:00:00.000Z", createdAt: "2025-08-10T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedSubscriptions)));
  }

  findByTenantId(tenantId: string): Subscription | undefined {
    return this.items.find((s) => s.tenantId === tenantId);
  }

  findByStatus(status: Subscription["status"]): Subscription[] {
    return this.findByFields({ status });
  }

  findActive(): Subscription[] {
    return this.findByStatus("active");
  }

  findPastDue(): Subscription[] {
    return this.findByStatus("past_due");
  }
}

export class InvoiceRepository extends Repository<Invoice> {
  private seedInvoices: Invoice[] = [
    { id: "inv-1", tenantId: "tenant-acme", subscriptionId: "sub-1", invoiceNumber: "INV-2026-0001", status: "paid", amount: 155000, currency: "CNY", periodStart: "2026-06-01", periodEnd: "2026-06-30", issueDate: "2026-06-01", dueDate: "2026-06-15", paidAt: "2026-06-05T00:00:00.000Z", items: [{ id: "inv-item-1", description: "Enterprise 订阅费", quantity: 1, unitPrice: 155000, total: 155000 }], createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "inv-2", tenantId: "tenant-acme", subscriptionId: "sub-1", invoiceNumber: "INV-2026-0002", status: "draft", amount: 155000, currency: "CNY", periodStart: "2026-07-01", periodEnd: "2026-07-31", issueDate: "2026-07-01", dueDate: "2026-07-15", items: [{ id: "inv-item-2", description: "Enterprise 订阅费", quantity: 1, unitPrice: 155000, total: 155000 }], createdAt: "2026-07-01T00:00:00.000Z" },
    { id: "inv-3", tenantId: "tenant-orbit", subscriptionId: "sub-2", invoiceNumber: "INV-2026-0003", status: "overdue", amount: 51667, currency: "CNY", periodStart: "2026-05-01", periodEnd: "2026-05-31", issueDate: "2026-05-01", dueDate: "2026-05-15", items: [{ id: "inv-item-3", description: "Standard 订阅费", quantity: 1, unitPrice: 51667, total: 51667 }], createdAt: "2026-05-01T00:00:00.000Z" },
    { id: "inv-4", tenantId: "tenant-nova", subscriptionId: "sub-3", invoiceNumber: "INV-2026-0004", status: "paid", amount: 81667, currency: "CNY", periodStart: "2026-06-01", periodEnd: "2026-06-30", issueDate: "2026-06-01", dueDate: "2026-06-15", paidAt: "2026-06-10T00:00:00.000Z", items: [{ id: "inv-item-4", description: "Enterprise 订阅费", quantity: 1, unitPrice: 81667, total: 81667 }], createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "inv-5", tenantId: "tenant-nexus", subscriptionId: "sub-4", invoiceNumber: "INV-2026-0005", status: "sent", amount: 61667, currency: "CNY", periodStart: "2026-06-01", periodEnd: "2026-06-30", issueDate: "2026-06-01", dueDate: "2026-06-15", items: [{ id: "inv-item-5", description: "Enterprise 订阅费", quantity: 1, unitPrice: 61667, total: 61667 }], createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "inv-6", tenantId: "tenant-pivot", subscriptionId: "sub-5", invoiceNumber: "INV-2026-0006", status: "paid", amount: 35000, currency: "CNY", periodStart: "2026-06-01", periodEnd: "2026-06-30", issueDate: "2026-06-01", dueDate: "2026-06-15", paidAt: "2026-06-08T00:00:00.000Z", items: [{ id: "inv-item-6", description: "Standard 订阅费", quantity: 1, unitPrice: 35000, total: 35000 }], createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "inv-7", tenantId: "tenant-helios", subscriptionId: "sub-6", invoiceNumber: "INV-2026-0007", status: "paid", amount: 131667, currency: "CNY", periodStart: "2026-06-01", periodEnd: "2026-06-30", issueDate: "2026-06-01", dueDate: "2026-06-15", paidAt: "2026-06-03T00:00:00.000Z", items: [{ id: "inv-item-7", description: "Enterprise 订阅费", quantity: 1, unitPrice: 131667, total: 131667 }], createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "inv-8", tenantId: "tenant-verdant", subscriptionId: "sub-7", invoiceNumber: "INV-2026-0008", status: "canceled", amount: 23333, currency: "CNY", periodStart: "2026-06-01", periodEnd: "2026-06-30", issueDate: "2026-06-01", dueDate: "2026-06-15", canceledAt: "2026-06-05T00:00:00.000Z", items: [{ id: "inv-item-8", description: "Standard 订阅费", quantity: 1, unitPrice: 23333, total: 23333 }], createdAt: "2026-06-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedInvoices)));
  }

  findByTenantId(tenantId: string): Invoice[] {
    return this.findByFields({ tenantId });
  }

  findBySubscriptionId(subscriptionId: string): Invoice[] {
    return this.findByFields({ subscriptionId });
  }

  findByStatus(status: Invoice["status"]): Invoice[] {
    return this.findByFields({ status });
  }

  findOverdue(): Invoice[] {
    return this.findByStatus("overdue");
  }
}

export class NotificationRepository extends Repository<Notification> {
  private seedNotifications: Notification[] = [
    { id: "notif-1", tenantId: "tenant-acme", userId: "u-tenant-admin", type: "approval_request", title: "有新的审批请求", message: "苏嘉宁提交了审批请求：开通生产环境 SSO 单点登录", isRead: false, resourceType: "approval", resourceId: "ap-1001", createdAt: "2026-06-09T09:40:00.000Z" },
    { id: "notif-2", tenantId: "tenant-orbit", userId: "u-orbit-admin", type: "invoice_overdue", title: "发票逾期提醒", message: "您有一张发票已逾期，请尽快支付", isRead: false, resourceType: "invoice", resourceId: "inv-3", createdAt: "2026-06-16T00:00:00.000Z" },
    { id: "notif-3", tenantId: "tenant-acme", userId: "u-release", type: "release_deployed", title: "发布已部署", message: "版本 2026.06.01 已成功部署到生产环境", isRead: true, resourceType: "release", resourceId: "rel-20260601", createdAt: "2026-06-01T10:05:00.000Z" },
    { id: "notif-4", tenantId: "tenant-nova", userId: "u-nova-admin", type: "risk_created", title: "风险告警", message: "检测到门店批量导入失败率高于阈值", isRead: false, resourceType: "risk", resourceId: "risk-1003", createdAt: "2026-06-08T16:40:00.000Z" },
    { id: "notif-5", tenantId: "tenant-nexus", userId: "u-nexus-admin", type: "approval_decision", title: "审批已通过", message: "您的审批请求已通过：医疗数据接口白名单调整", isRead: false, resourceType: "approval", resourceId: "ap-1005", createdAt: "2026-06-09T10:00:00.000Z" },
    { id: "notif-6", tenantId: "tenant-helios", userId: "u-helios-release", type: "release_deployed", title: "发布已部署", message: "版本 2026.05.28 已成功部署到生产环境", isRead: true, resourceType: "release", resourceId: "rel-20260528", createdAt: "2026-05-28T09:48:00.000Z" },
    { id: "notif-7", tenantId: "tenant-verdant", userId: "u-verdant-admin", type: "subscription_renewal", title: "订阅即将到期", message: "您的订阅将于 2026-08-10 到期，请及时续约", isRead: false, resourceType: "subscription", resourceId: "sub-7", createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "notif-8", tenantId: "tenant-acme", userId: "u-platform", type: "system_announcement", title: "系统维护通知", message: "系统将于 2026-06-15 00:00-04:00 进行维护升级", isRead: true, createdAt: "2026-06-08T10:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedNotifications)));
  }

  findByTenantId(tenantId: string): Notification[] {
    return this.findByFields({ tenantId });
  }

  findByUserId(userId: string): Notification[] {
    return this.findByFields({ userId });
  }

  findByType(type: Notification["type"]): Notification[] {
    return this.findByFields({ type });
  }

  findUnread(userId?: string): Notification[] {
    if (userId) {
      return this.items.filter((n) => !n.isRead && n.userId === userId);
    }
    return this.items.filter((n) => !n.isRead);
  }

  markAsRead(id: string): Notification | undefined {
    return this.update(id, { isRead: true });
  }

  markAllAsRead(userId: string): void {
    this.items.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
  }
}

export class NotificationPreferenceRepository extends Repository<NotificationPreference> {
  private seedPreferences: NotificationPreference[] = [
    { userId: "u-platform", preferences: { system_announcement: true, approval_request: true, approval_decision: true, release_deployed: true, release_rolled_back: true, risk_created: true, risk_updated: true, invoice_ready: true, invoice_overdue: true, subscription_renewal: true, feature_released: true }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { userId: "u-tenant-admin", preferences: { system_announcement: true, approval_request: true, approval_decision: true, release_deployed: true, release_rolled_back: false, risk_created: true, risk_updated: false, invoice_ready: true, invoice_overdue: true, subscription_renewal: true, feature_released: false }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-05-15T00:00:00.000Z" },
    { userId: "u-auditor", preferences: { system_announcement: true, approval_request: false, approval_decision: false, release_deployed: false, release_rolled_back: false, risk_created: true, risk_updated: false, invoice_ready: false, invoice_overdue: false, subscription_renewal: false, feature_released: false }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedPreferences)));
  }

  findByUserId(userId: string): NotificationPreference | undefined {
    return this.findByFields({ userId })[0];
  }
}

export class WebhookRepository extends Repository<WebhookEndpoint> {
  private seedWebhooks: WebhookEndpoint[] = [
    { id: "webhook-1", tenantId: "tenant-acme", name: "审批通知", url: "https://webhook.acme-mfg.example.com/approvals", events: ["approvals.created", "approvals.approved", "approvals.rejected"], secret: "whsec_abc123", isActive: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-15T00:00:00.000Z", lastDeliveredAt: "2026-06-09T09:40:00.000Z" },
    { id: "webhook-2", tenantId: "tenant-acme", name: "发布通知", url: "https://webhook.acme-mfg.example.com/releases", events: ["releases.deployed", "releases.rolled_back"], secret: "whsec_xyz789", isActive: true, createdAt: "2026-05-10T00:00:00.000Z", updatedAt: "2026-05-10T00:00:00.000Z", lastDeliveredAt: "2026-06-01T10:05:00.000Z" },
    { id: "webhook-3", tenantId: "tenant-nova", name: "工单通知", url: "https://webhook.nova-retail.example.com/tickets", events: ["tickets.created", "tickets.updated", "tickets.resolved"], secret: "whsec_nova123", isActive: false, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-05T00:00:00.000Z" },
    { id: "webhook-4", tenantId: "tenant-orbit", name: "计费通知", url: "https://webhook.orbit-fin.example.com/billing", events: ["billing.invoice.paid", "billing.invoice.overdue"], secret: "whsec_orbit456", isActive: true, createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-04-01T00:00:00.000Z", lastDeliveredAt: "2026-06-05T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedWebhooks)));
  }

  findByTenantId(tenantId: string): WebhookEndpoint[] {
    return this.findByFields({ tenantId });
  }

  findActive(): WebhookEndpoint[] {
    return this.findByFields({ isActive: true });
  }

  generateSecret(): string {
    return `whsec_${Math.random().toString(36).substr(2, 15)}`;
  }
}

export class WebhookDeliveryLogRepository extends Repository<WebhookDeliveryLog> {
  private seedLogs: WebhookDeliveryLog[] = [
    { id: "log-1", webhookId: "webhook-1", eventType: "approvals.created", statusCode: 200, responseTime: 120, deliveredAt: "2026-06-09T09:40:00.000Z", createdAt: "2026-06-09T09:40:00.000Z" },
    { id: "log-2", webhookId: "webhook-1", eventType: "approvals.approved", statusCode: 200, responseTime: 85, deliveredAt: "2026-06-09T10:00:00.000Z", createdAt: "2026-06-09T10:00:00.000Z" },
    { id: "log-3", webhookId: "webhook-2", eventType: "releases.deployed", statusCode: 500, responseTime: 5000, response: "Internal Server Error", deliveredAt: "2026-06-01T10:05:00.000Z", createdAt: "2026-06-01T10:05:00.000Z" },
    { id: "log-4", webhookId: "webhook-4", eventType: "billing.invoice.overdue", statusCode: 200, responseTime: 45, deliveredAt: "2026-06-16T00:00:00.000Z", createdAt: "2026-06-16T00:00:00.000Z" },
    { id: "log-5", webhookId: "webhook-1", eventType: "approvals.rejected", statusCode: 404, responseTime: 200, response: "Not Found", deliveredAt: "2026-06-04T17:20:00.000Z", createdAt: "2026-06-04T17:20:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedLogs)));
  }

  findByWebhookId(webhookId: string): WebhookDeliveryLog[] {
    return this.findByFields({ webhookId });
  }

  findRecent(limit: number = 50): WebhookDeliveryLog[] {
    return [...this.items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export class TokenRepository extends Repository<ApiToken> {
  private seedTokens: ApiToken[] = [
    { id: "token-1", tenantId: "tenant-acme", userId: "u-tenant-admin", name: "CI/CD 自动化", token: "sk_tenant_admin_abc123", scopes: ["read", "write"], expiresAt: "2027-06-09T00:00:00.000Z", createdAt: "2026-06-01T00:00:00.000Z", lastUsedAt: "2026-06-09T08:00:00.000Z", usageCount: 156 },
    { id: "token-2", tenantId: "tenant-acme", userId: "u-release", name: "发布脚本", token: "sk_release_mgr_xyz789", scopes: ["read", "write"], expiresAt: "2026-12-31T00:00:00.000Z", createdAt: "2026-01-15T00:00:00.000Z", lastUsedAt: "2026-06-08T15:00:00.000Z", usageCount: 89 },
    { id: "token-3", tenantId: "tenant-nova", userId: "u-nova-admin", name: "数据导出", token: "sk_nova_admin_123xyz", scopes: ["read"], expiresAt: "2026-09-01T00:00:00.000Z", createdAt: "2026-03-01T00:00:00.000Z", lastUsedAt: "2026-06-07T10:00:00.000Z", usageCount: 42 },
    { id: "token-4", tenantId: "tenant-orbit", userId: "u-orbit-admin", name: "BI 集成", token: "sk_orbit_admin_456abc", scopes: ["read"], expiresAt: "2027-03-15T00:00:00.000Z", createdAt: "2026-03-15T00:00:00.000Z", lastUsedAt: "2026-06-09T09:30:00.000Z", usageCount: 203 }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedTokens)));
  }

  findByTenantId(tenantId: string): ApiToken[] {
    return this.findByFields({ tenantId });
  }

  findByUserId(userId: string): ApiToken[] {
    return this.findByFields({ userId });
  }

  generateToken(): string {
    return `sk_${Math.random().toString(36).substr(2, 20)}`;
  }

  incrementUsage(id: string): void {
    const token = this.get(id);
    if (token) {
      token.usageCount += 1;
      token.lastUsedAt = new Date().toISOString();
    }
  }
}

export class TeamRepository extends Repository<Team> {
  private seedTeams: Team[] = [
    { id: "team-1", tenantId: "tenant-acme", name: "研发团队", description: "负责产品开发和维护", isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "team-2", tenantId: "tenant-acme", name: "运维团队", description: "负责系统运维和部署", isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "team-3", tenantId: "tenant-nova", name: "运营团队", description: "负责日常运营工作", isActive: true, createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-15T00:00:00.000Z" },
    { id: "team-4", tenantId: "tenant-orbit", name: "风控团队", description: "负责风险控制和合规", isActive: true, createdAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z" },
    { id: "team-5", tenantId: "tenant-nexus", name: "医疗数据团队", description: "负责医疗数据处理", isActive: true, createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-04-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedTeams)));
  }

  findByTenantId(tenantId: string): Team[] {
    return this.findByFields({ tenantId });
  }

  findActive(): Team[] {
    return this.findByFields({ isActive: true });
  }
}

export class TeamMemberRepository extends Repository<TeamMember> {
  private seedMembers: TeamMember[] = [
    { teamId: "team-1", userId: "u-tenant-admin", role: "leader", joinedAt: "2026-01-01T00:00:00.000Z" },
    { teamId: "team-1", userId: "u-release", joinedAt: "2026-01-15T00:00:00.000Z" },
    { teamId: "team-2", userId: "u-release", role: "leader", joinedAt: "2026-01-01T00:00:00.000Z" },
    { teamId: "team-3", userId: "u-nova-admin", role: "leader", joinedAt: "2026-02-15T00:00:00.000Z" },
    { teamId: "team-3", userId: "u-nova-member", joinedAt: "2026-02-20T00:00:00.000Z" },
    { teamId: "team-4", userId: "u-orbit-admin", role: "leader", joinedAt: "2026-03-01T00:00:00.000Z" },
    { teamId: "team-4", userId: "u-orbit-auditor", joinedAt: "2026-03-05T00:00:00.000Z" },
    { teamId: "team-5", userId: "u-nexus-admin", role: "leader", joinedAt: "2026-04-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedMembers)));
  }

  findByTeamId(teamId: string): TeamMember[] {
    return this.findByFields({ teamId });
  }

  findByUserId(userId: string): TeamMember[] {
    return this.findByFields({ userId });
  }

  addMember(teamId: string, userId: string, role?: string): TeamMember {
    return this.create({ teamId, userId, role, joinedAt: new Date().toISOString() });
  }

  removeMember(teamId: string, userId: string): boolean {
    const member = this.findByFields({ teamId, userId })[0];
    if (member) {
      return this.delete(member.id);
    }
    return false;
  }
}

export class IntegrationRepository extends Repository<Integration> {
  private seedIntegrations: Integration[] = [
    { id: "int-1", tenantId: "tenant-acme", type: "slack", name: "Slack", status: "connected", config: { webhookUrl: "https://hooks.slack.com/services/xxx/yyy/zzz", channel: "#notifications" }, lastSyncAt: "2026-06-09T09:00:00.000Z", createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "int-2", tenantId: "tenant-acme", type: "github", name: "GitHub", status: "connected", config: { repoUrl: "https://github.com/acme-mfg/platform", webhookSecret: "github_secret_123" }, lastSyncAt: "2026-06-09T08:00:00.000Z", createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "int-3", tenantId: "tenant-nova", type: "zendesk", name: "Zendesk", status: "error", config: { subdomain: "nova-retail", apiToken: "zendesk_token_456" }, createdAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-06-05T00:00:00.000Z" },
    { id: "int-4", tenantId: "tenant-orbit", type: "jira", name: "Jira", status: "connected", config: { host: "orbit-fin.atlassian.net", projectKey: "ORB" }, lastSyncAt: "2026-06-09T10:00:00.000Z", createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "int-5", tenantId: "tenant-nexus", type: "salesforce", name: "Salesforce", status: "not_configured", config: {}, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "int-6", tenantId: "tenant-helios", type: "webhook", name: "自定义 Webhook", status: "connected", config: { url: "https://hooks.helios-aero.example.com/events", secret: "webhook_secret_789" }, lastSyncAt: "2026-06-09T07:00:00.000Z", createdAt: "2026-05-15T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedIntegrations)));
  }

  findByTenantId(tenantId: string): Integration[] {
    return this.findByFields({ tenantId });
  }

  findByType(type: Integration["type"]): Integration[] {
    return this.findByFields({ type });
  }

  findByStatus(status: Integration["status"]): Integration[] {
    return this.findByFields({ status });
  }

  findConnected(): Integration[] {
    return this.findByStatus("connected");
  }
}

export class FeatureFlagRepository extends Repository<FeatureFlag> {
  private seedFlags: FeatureFlag[] = [
    { id: "feat-1", key: "new_ui", name: "新界面", description: "启用新版用户界面", type: "boolean", defaultValue: true, isEnabled: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "feat-2", key: "sso_enabled", name: "SSO 登录", description: "启用单点登录功能", type: "boolean", defaultValue: false, isEnabled: true, tenantOverrides: [{ tenantId: "tenant-acme", value: true, createdAt: "2026-03-01T00:00:00.000Z" }, { tenantId: "tenant-nova", value: true, createdAt: "2026-04-01T00:00:00.000Z" }], createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    { id: "feat-3", key: "audit_log_retention_days", name: "审计日志保留天数", description: "审计日志保留天数配置", type: "number", defaultValue: 90, isEnabled: true, createdAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z" },
    { id: "feat-4", key: "api_rate_limit", name: "API 限流", description: "API 请求限流配置", type: "number", defaultValue: 100, isEnabled: true, tenantOverrides: [{ tenantId: "tenant-verdant", value: 50, createdAt: "2026-05-01T00:00:00.000Z" }], createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" },
    { id: "feat-5", key: "release_channel", name: "发布通道", description: "选择发布通道", type: "select", defaultValue: "stable", isEnabled: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" },
    { id: "feat-6", key: "beta_access", name: "Beta 功能访问", description: "允许访问 Beta 功能", type: "boolean", defaultValue: false, isEnabled: true, rolloutPercentage: 25, createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedFlags)));
  }

  findByKey(key: string): FeatureFlag | undefined {
    return this.findByFields({ key })[0];
  }

  getValue(key: string, tenantId?: string): unknown {
    const flag = this.findByKey(key);
    if (!flag || !flag.isEnabled) {
      return flag?.defaultValue;
    }

    if (tenantId && flag.tenantOverrides) {
      const override = flag.tenantOverrides.find((o) => o.tenantId === tenantId);
      if (override) {
        return override.value;
      }
    }

    return flag.defaultValue;
  }

  addTenantOverride(key: string, tenantId: string, value: unknown): void {
    const flag = this.findByKey(key);
    if (flag) {
      if (!flag.tenantOverrides) {
        flag.tenantOverrides = [];
      }
      const existingIndex = flag.tenantOverrides.findIndex((o) => o.tenantId === tenantId);
      if (existingIndex >= 0) {
        flag.tenantOverrides[existingIndex] = { tenantId, value, createdAt: new Date().toISOString() };
      } else {
        flag.tenantOverrides.push({ tenantId, value, createdAt: new Date().toISOString() });
      }
    }
  }

  removeTenantOverride(key: string, tenantId: string): void {
    const flag = this.findByKey(key);
    if (flag?.tenantOverrides) {
      flag.tenantOverrides = flag.tenantOverrides.filter((o) => o.tenantId !== tenantId);
    }
  }
}

export class FeatureFlagAuditRepository extends Repository<FeatureFlagAudit> {
  private seedAudits: FeatureFlagAudit[] = [
    { id: "audit-1", featureKey: "new_ui", actorId: "u-platform", changeType: "created", newValue: true, createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "audit-2", featureKey: "sso_enabled", actorId: "u-platform", changeType: "created", newValue: false, createdAt: "2026-02-01T00:00:00.000Z" },
    { id: "audit-3", featureKey: "sso_enabled", actorId: "u-platform", changeType: "updated", oldValue: false, newValue: true, createdAt: "2026-06-01T00:00:00.000Z" },
    { id: "audit-4", featureKey: "sso_enabled", actorId: "u-platform", changeType: "override_added", newValue: { tenantId: "tenant-acme", value: true }, createdAt: "2026-03-01T00:00:00.000Z" },
    { id: "audit-5", featureKey: "api_rate_limit", actorId: "u-platform", changeType: "updated", oldValue: 100, newValue: 100, createdAt: "2026-05-01T00:00:00.000Z" },
    { id: "audit-6", featureKey: "beta_access", actorId: "u-platform", changeType: "created", newValue: { defaultValue: false, rolloutPercentage: 25 }, createdAt: "2026-06-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedAudits)));
  }

  findByFeatureKey(featureKey: string): FeatureFlagAudit[] {
    return this.findByFields({ featureKey });
  }

  findByActorId(actorId: string): FeatureFlagAudit[] {
    return this.findByFields({ actorId });
  }

  recordChange(featureKey: string, actorId: string, changeType: FeatureFlagAudit["changeType"], oldValue?: unknown, newValue?: unknown): void {
    this.create({ featureKey, actorId, changeType, oldValue, newValue, createdAt: new Date().toISOString() });
  }
}

export class RoleDefinitionRepository extends Repository<RoleDefinition> {
  private seedRoles: RoleDefinition[] = [
    { id: "role-1", name: "平台管理员", description: "拥有平台所有权限", type: "system", permissions: ["tenant:view", "tenant:edit", "user:view", "user:edit", "role:view", "role:edit", "approval:view", "approval:approve", "release:view", "release:deploy", "audit:view", "billing:view", "billing:edit", "notification:view", "notification:manage", "webhook:manage", "metric:view", "token:manage", "team:manage", "integration:manage", "feature:manage", "ticket:view", "ticket:edit", "ticket:manage"], isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "role-2", name: "租户管理员", description: "管理租户内所有资源", type: "system", permissions: ["tenant:view", "tenant:edit", "user:view", "user:edit", "role:view", "role:edit", "approval:view", "approval:approve", "release:view", "billing:view", "notification:view", "notification:manage", "webhook:manage", "metric:view", "token:manage", "team:manage", "integration:manage", "ticket:view", "ticket:edit", "ticket:manage"], isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "role-3", name: "审计员", description: "只读审计权限", type: "system", permissions: ["tenant:view", "user:view", "role:view", "approval:view", "release:view", "audit:view", "billing:view", "notification:view", "metric:view", "ticket:view"], isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "role-4", name: "发布经理", description: "负责发布管理", type: "system", permissions: ["tenant:view", "approval:view", "approval:approve", "release:view", "release:deploy", "notification:view", "metric:view"], isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "role-5", name: "普通成员", description: "基础访问权限", type: "system", permissions: ["tenant:view", "user:view", "approval:view", "release:view", "notification:view", "ticket:view"], isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "role-6", name: "工单专员", description: "负责工单处理", type: "custom", permissions: ["tenant:view", "ticket:view", "ticket:edit", "ticket:manage"], isActive: true, createdAt: "2026-03-15T00:00:00.000Z", updatedAt: "2026-03-15T00:00:00.000Z" },
    { id: "role-7", name: "财务专员", description: "负责财务相关", type: "custom", permissions: ["tenant:view", "billing:view", "billing:edit"], isActive: true, createdAt: "2026-04-01T00:00:00.000Z", updatedAt: "2026-04-01T00:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedRoles)));
  }

  findByType(type: RoleDefinition["type"]): RoleDefinition[] {
    return this.findByFields({ type });
  }

  findActive(): RoleDefinition[] {
    return this.findByFields({ isActive: true });
  }

  findSystemRoles(): RoleDefinition[] {
    return this.findByType("system");
  }

  findCustomRoles(): RoleDefinition[] {
    return this.findByType("custom");
  }
}

export class TicketRepository extends Repository<Ticket> {
  private seedTickets: Ticket[] = [
    { id: "ticket-1", tenantId: "tenant-orbit", title: "生产环境回滚后客户仍收到旧版账单通知", description: "2026-06-06 生产发布后触发回滚，但部分客户反馈仍收到旧版账单通知。需要紧急调查原因并修复。", priority: "critical", status: "in_progress", category: "bug_report", assigneeId: "u-platform", creatorId: "u-orbit-admin", tags: ["生产问题", "紧急"], createdAt: "2026-06-06T09:25:00.000Z", updatedAt: "2026-06-09T10:30:00.000Z" },
    { id: "ticket-2", tenantId: "tenant-acme", title: "SSO 元数据即将过期", description: "SSO 元数据证书将于 2026-06-30 过期，请提前更新。", priority: "high", status: "open", category: "security", assigneeId: "u-tenant-admin", creatorId: "u-release", tags: ["SSO", "安全"], createdAt: "2026-06-09T10:20:00.000Z", updatedAt: "2026-06-09T10:20:00.000Z" },
    { id: "ticket-3", tenantId: "tenant-nova", title: "门店批量导入失败率高于阈值", description: "华东区域门店批量导入失败率达到 15%，高于阈值 10%。需要排查导入流程问题。", priority: "medium", status: "waiting_customer", category: "support", assigneeId: "u-release", creatorId: "u-nova-admin", tags: ["数据导入", "性能"], createdAt: "2026-06-08T16:40:00.000Z", updatedAt: "2026-06-09T09:00:00.000Z" },
    { id: "ticket-4", tenantId: "tenant-orbit", title: "月活连续两周下降超过 15%", description: "用户活跃度连续两周下降超过 15%，需要分析原因并制定改进措施。", priority: "medium", status: "open", category: "support", creatorId: "u-orbit-admin", tags: ["用户增长", "分析"], createdAt: "2026-06-07T11:15:00.000Z", updatedAt: "2026-06-07T11:15:00.000Z" },
    { id: "ticket-5", tenantId: "tenant-acme", title: "合同增购报价待客户确认", description: "Acme 精密制造合同增购 60 个席位的报价已发送，等待客户确认。", priority: "low", status: "resolved", category: "billing", assigneeId: "u-platform", creatorId: "u-platform", tags: ["合同", "增购"], createdAt: "2026-06-06T14:05:00.000Z", updatedAt: "2026-06-08T10:00:00.000Z", resolvedAt: "2026-06-08T10:00:00.000Z" },
    { id: "ticket-6", tenantId: "tenant-nexus", title: "医疗数据接口白名单审批超时", description: "医疗数据接口白名单审批已超过 48 小时，影响试点医院数据同步。", priority: "critical", status: "open", category: "security", assigneeId: "u-platform", creatorId: "u-nexus-admin", tags: ["医疗数据", "安全", "紧急"], createdAt: "2026-06-09T07:50:00.000Z", updatedAt: "2026-06-09T07:50:00.000Z" },
    { id: "ticket-7", tenantId: "tenant-verdant", title: "客户活跃数据连续三周未上报", description: "Verdant 绿色农业客户活跃数据连续三周未上报，需要联系客户确认。", priority: "high", status: "in_progress", category: "support", assigneeId: "u-verdant-admin", creatorId: "u-platform", tags: ["数据上报", "客户触达"], createdAt: "2026-06-08T10:00:00.000Z", updatedAt: "2026-06-09T09:30:00.000Z" },
    { id: "ticket-8", tenantId: "tenant-helios", title: "生产环境新增节点审计合规性评估", description: "需要完成新增部署节点的合规自评后才可部署。", priority: "medium", status: "open", category: "security", assigneeId: "u-helios-release", creatorId: "u-helios-admin", tags: ["合规", "审计"], createdAt: "2026-06-09T08:20:00.000Z", updatedAt: "2026-06-09T08:20:00.000Z" },
    { id: "ticket-9", tenantId: "tenant-pivot", title: "场站接入数据导出权限调整工单", description: "新能源场站数据导出权限已按最新策略调整完成。", priority: "low", status: "resolved", category: "support", assigneeId: "u-pivot-admin", creatorId: "u-pivot-admin", tags: ["权限", "数据导出"], createdAt: "2026-06-07T09:00:00.000Z", updatedAt: "2026-06-08T10:20:00.000Z", resolvedAt: "2026-06-08T10:20:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedTickets)));
  }

  findByTenantId(tenantId: string): Ticket[] {
    return this.findByFields({ tenantId });
  }

  findByStatus(status: Ticket["status"]): Ticket[] {
    return this.findByFields({ status });
  }

  findByPriority(priority: Ticket["priority"]): Ticket[] {
    return this.findByFields({ priority });
  }

  findByCategory(category: Ticket["category"]): Ticket[] {
    return this.findByFields({ category });
  }

  findByAssigneeId(assigneeId: string): Ticket[] {
    return this.findByFields({ assigneeId });
  }

  findByCreatorId(creatorId: string): Ticket[] {
    return this.findByFields({ creatorId });
  }

  findOpen(): Ticket[] {
    return this.findByFields({ status: "open" });
  }

  findInProgress(): Ticket[] {
    return this.findByFields({ status: "in_progress" });
  }

  findResolved(): Ticket[] {
    return this.findByFields({ status: "resolved" });
  }

  findByTag(tag: string): Ticket[] {
    return this.items.filter((t) => t.tags?.includes(tag));
  }
}

export class TicketConversationRepository extends Repository<TicketConversation> {
  private seedConversations: TicketConversation[] = [
    { id: "conv-1", ticketId: "ticket-1", userId: "u-orbit-admin", message: "生产环境回滚后客户仍收到旧版账单通知，请紧急处理", createdAt: "2026-06-06T09:25:00.000Z" },
    { id: "conv-2", ticketId: "ticket-1", userId: "u-platform", message: "已收到，正在调查问题原因", createdAt: "2026-06-06T09:30:00.000Z" },
    { id: "conv-3", ticketId: "ticket-1", userId: "u-platform", message: "问题已定位，是缓存刷新机制导致的，正在修复", createdAt: "2026-06-06T11:00:00.000Z" },
    { id: "conv-4", ticketId: "ticket-2", userId: "u-release", message: "SSO 元数据证书即将过期，请提前更新", createdAt: "2026-06-09T10:20:00.000Z" },
    { id: "conv-5", ticketId: "ticket-3", userId: "u-nova-admin", message: "华东区域门店批量导入失败率达到 15%", createdAt: "2026-06-08T16:40:00.000Z" },
    { id: "conv-6", ticketId: "ticket-3", userId: "u-release", message: "收到，我们需要更多信息来排查问题", createdAt: "2026-06-08T16:45:00.000Z" },
    { id: "conv-7", ticketId: "ticket-6", userId: "u-nexus-admin", message: "医疗数据接口白名单审批已超过 48 小时", createdAt: "2026-06-09T07:50:00.000Z" },
    { id: "conv-8", ticketId: "ticket-6", userId: "u-platform", message: "非常抱歉，已加急处理，预计今天内完成", createdAt: "2026-06-09T08:00:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedConversations)));
  }

  findByTicketId(ticketId: string): TicketConversation[] {
    return this.findByFields({ ticketId });
  }

  findByUserId(userId: string): TicketConversation[] {
    return this.findByFields({ userId });
  }
}

export class TicketStatusTransitionRepository extends Repository<TicketStatusTransition> {
  private seedTransitions: TicketStatusTransition[] = [
    { id: "trans-1", ticketId: "ticket-1", fromStatus: "open", toStatus: "in_progress", actorId: "u-platform", createdAt: "2026-06-06T09:30:00.000Z" },
    { id: "trans-2", ticketId: "ticket-5", fromStatus: "open", toStatus: "in_progress", actorId: "u-platform", createdAt: "2026-06-06T14:10:00.000Z" },
    { id: "trans-3", ticketId: "ticket-5", fromStatus: "in_progress", toStatus: "resolved", actorId: "u-platform", createdAt: "2026-06-08T10:00:00.000Z" },
    { id: "trans-4", ticketId: "ticket-3", fromStatus: "open", toStatus: "waiting_customer", actorId: "u-release", createdAt: "2026-06-09T09:00:00.000Z" },
    { id: "trans-5", ticketId: "ticket-7", fromStatus: "open", toStatus: "in_progress", actorId: "u-verdant-admin", createdAt: "2026-06-09T09:30:00.000Z" },
    { id: "trans-6", ticketId: "ticket-9", fromStatus: "open", toStatus: "in_progress", actorId: "u-pivot-admin", createdAt: "2026-06-07T09:05:00.000Z" },
    { id: "trans-7", ticketId: "ticket-9", fromStatus: "in_progress", toStatus: "resolved", actorId: "u-pivot-admin", createdAt: "2026-06-08T10:20:00.000Z" }
  ];

  constructor() {
    super(JSON.parse(JSON.stringify(this.seedTransitions)));
  }

  findByTicketId(ticketId: string): TicketStatusTransition[] {
    return this.findByFields({ ticketId });
  }

  findByActorId(actorId: string): TicketStatusTransition[] {
    return this.findByFields({ actorId });
  }

  recordTransition(ticketId: string, fromStatus: Ticket["status"], toStatus: Ticket["status"], actorId: string): void {
    this.create({ ticketId, fromStatus, toStatus, actorId, createdAt: new Date().toISOString() });
  }
}

export const tenants = new TenantRepository();
export const users = new UserRepository();
export const approvals = new ApprovalRepository();
export const releases = new ReleaseRepository();
export const auditLogs = new AuditLogRepository();
export const supportRisks = new SupportRiskRepository();
export const activityEvents = new ActivityEventRepository();
export const subscriptions = new SubscriptionRepository();
export const invoices = new InvoiceRepository();
export const notifications = new NotificationRepository();
export const notificationPreferences = new NotificationPreferenceRepository();
export const webhooks = new WebhookRepository();
export const webhookDeliveryLogs = new WebhookDeliveryLogRepository();
export const tokens = new TokenRepository();
export const teams = new TeamRepository();
export const teamMembers = new TeamMemberRepository();
export const integrations = new IntegrationRepository();
export const featureFlags = new FeatureFlagRepository();
export const featureFlagAudits = new FeatureFlagAuditRepository();
export const roleDefinitions = new RoleDefinitionRepository();
export const tickets = new TicketRepository();
export const ticketConversations = new TicketConversationRepository();
export const ticketStatusTransitions = new TicketStatusTransitionRepository();