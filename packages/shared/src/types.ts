export type RoleCode =
  | "platform_admin"
  | "tenant_admin"
  | "auditor"
  | "release_manager"
  | "member";

export type PermissionCode =
  | "tenant:view" | "tenant:edit" | "tenant:read" | "tenant:write" | "tenant:delete"
  | "user:view" | "user:edit" | "user:read" | "user:write" | "user:delete"
  | "role:view" | "role:edit" | "role:read" | "role:write" | "role:delete"
  | "approval:view" | "approval:approve" | "approval:read" | "approval:write"
  | "release:view" | "release:deploy" | "release:read" | "release:write" | "release:rollback"
  | "audit:view" | "audit:read" | "audit:export"
  | "risk:read" | "risk:write"
  | "activity:read"
  | "billing:view" | "billing:edit"
  | "notification:view" | "notification:manage" | "notification:read"
  | "webhook:manage" | "webhook:read"
  | "metric:view" | "metric:read"
  | "token:manage" | "token:read"
  | "team:manage" | "team:read" | "team:create"
  | "integration:manage" | "integration:read" | "integration:create"
  | "feature:manage" | "feature:read"
  | "ticket:view" | "ticket:edit" | "ticket:manage" | "ticket:read"
  | "subscription:read" | "subscription:manage"
  | "invoice:read" | "invoice:manage";

export type ErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "AUTH_INVALID_TOKEN"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_SESSION_NOT_FOUND"
  | "RBAC_FORBIDDEN"
  | "RBAC_MISSING_PERMISSION"
  | "VALIDATION_ERROR"
  | "VALIDATION_INVALID_EMAIL"
  | "VALIDATION_INVALID_UUID"
  | "VALIDATION_INVALID_URL"
  | "VALIDATION_INVALID_DATE"
  | "VALIDATION_INVALID_CURRENCY"
  | "VALIDATION_REQUIRED_FIELD"
  | "VALIDATION_FIELD_TOO_SHORT"
  | "VALIDATION_FIELD_TOO_LONG"
  | "NOT_FOUND"
  | "NOT_FOUND_TENANT"
  | "NOT_FOUND_USER"
  | "NOT_FOUND_APPROVAL"
  | "NOT_FOUND_RELEASE"
  | "NOT_FOUND_WEBHOOK"
  | "NOT_FOUND_TOKEN"
  | "NOT_FOUND_TEAM"
  | "NOT_FOUND_INTEGRATION"
  | "NOT_FOUND_FEATURE"
  | "NOT_FOUND_ROLE"
  | "NOT_FOUND_TICKET"
  | "CONFLICT"
  | "CONFLICT_TENANT_EXISTS"
  | "CONFLICT_EMAIL_EXISTS"
  | "CONFLICT_WEBHOOK_SECRET_EXISTS"
  | "CONFLICT_ROLE_NAME_EXISTS"
  | "CONFLICT_TICKET_STATUS"
  | "LIMIT_EXCEEDED"
  | "LIMIT_TENANT_USERS"
  | "LIMIT_WEBHOOKS_PER_TENANT"
  | "LIMIT_TOKENS_PER_USER"
  | "LIMIT_TICKETS_PER_TENANT"
  | "RATE_LIMIT_EXCEEDED"
  | "TENANT_NOT_ACTIVE"
  | "TENANT_SEATS_EXCEEDED"
  | "TENANT_TRIAL_EXPIRED"
  | "INTEGRATION_NOT_CONFIGURED"
  | "INTEGRATION_AUTH_FAILED"
  | "INTEGRATION_CONNECTION_ERROR"
  | "FEATURE_DISABLED"
  | "FEATURE_TENANT_NOT_ALLOWED"
  | "INTERNAL_ERROR";

export interface AppError {
  errorCode: ErrorCode;
  message: string;
  httpStatus: number;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Tenant {
  id: string;
  name: string;
  plan: "standard" | "enterprise";
  industry: string;
  healthScore: number;
  contractEndsAt: string;
  customerSuccessManager: string;
  seatsUsed: number;
  seatsLimit: number;
  monthlyActiveUsers: number;
  arr: number;
  subscriptionStatus?: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roles: RoleCode[];
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  decidedBy?: string;
  description?: string;
  createdAt?: string;
  decidedAt?: string;
}

export interface ReleaseRecord {
  id: string;
  tenantId: string;
  version: string;
  environment: "staging" | "production";
  status: "pending" | "deployed" | "rolled_back";
  operatorId: string;
  createdAt: string;
  deployedAt?: string;
  rolledBackAt?: string;
  description?: string;
  changelog?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  summary: string;
  createdAt: string;
  details?: Record<string, unknown>;
  resourceType?: string;
  resourceId?: string;
}

export interface SupportRisk {
  id: string;
  tenantId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting_customer" | "resolved";
  slaDueAt: string;
  ownerId: string;
  category: "support" | "security" | "adoption" | "billing" | "release";
  impact: string;
  createdAt: string;
  resolvedAt?: string;
  description?: string;
}

export interface ActivityEvent {
  id: string;
  tenantId: string;
  type: "user" | "approval" | "release" | "audit" | "risk" | "billing" | "ticket";
  title: string;
  actorId: string;
  targetId?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "cancelled" | "expired";

export type SubscriptionPlan = "free" | "pro" | "standard" | "enterprise";

export type BillingPeriod = "monthly" | "yearly";

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  period: BillingPeriod;
  status: SubscriptionStatus;
  seats: number;
  seatsUsed: number;
  monthlyRate: number;
  annualRate?: number;
  trialEndsAt?: string;
  nextBillingAt?: string;
  cancelAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "draft" | "pending" | "sent" | "paid" | "overdue" | "canceled" | "refunded";

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  canceledAt?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type BillingSummary = {
  mrr: number;
  arr: number;
  totalRevenueThisMonth: number;
  totalRevenueLastMonth: number;
  growthRate: number;
  churnRate: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  churnedCustomersThisMonth: number;
};

export type NotificationType =
  | "system_announcement"
  | "approval_request"
  | "approval_decision"
  | "release_deployed"
  | "release_rolled_back"
  | "risk_created"
  | "risk_updated"
  | "invoice_ready"
  | "invoice_overdue"
  | "subscription_renewal"
  | "feature_released"
  | "info"
  | "warning"
  | "error"
  | "success"
  | "system";

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: string;
  status?: string;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  preferences: Partial<Record<NotificationType, boolean>>;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEvent =
  | "approvals.created"
  | "approvals.approved"
  | "approvals.rejected"
  | "releases.deployed"
  | "releases.rolled_back"
  | "tickets.created"
  | "tickets.updated"
  | "tickets.resolved"
  | "billing.invoice.paid"
  | "billing.invoice.overdue"
  | "billing.subscription.updated"
  | "users.created"
  | "users.updated"
  | "tenants.updated"
  | string;

export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastDeliveredAt?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  eventType: WebhookEvent;
  statusCode: number;
  responseTime: number;
  payload?: Record<string, unknown>;
  response?: string;
  deliveredAt: string;
  createdAt: string;
}

export type MetricPeriod = "7d" | "30d" | "90d";

export interface MetricPoint {
  date: string;
  value: number;
}

export interface PlatformMetrics {
  activeTenants: number;
  activeUsers: number;
  totalUsers: number;
  avgHealthScore: number;
  releaseSuccessRate: number;
  approvalThroughput: number;
  ticketResolutionRate: number;
  avgTicketAge: number;
}

export interface TenantTrend {
  period: MetricPeriod;
  data: MetricPoint[];
}

export interface HealthScoreDistribution {
  good: number;
  watch: number;
  risk: number;
}

export type TokenScope = "read" | "write" | "admin" | string;

export interface ApiToken {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  token?: string;
  scopes: TokenScope[];
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
  usageCount: number;
}

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role?: string;
  joinedAt: string;
}

export type IntegrationType =
  | "slack"
  | "salesforce"
  | "zendesk"
  | "jira"
  | "github"
  | "stripe"
  | "webhook"
  | "custom";

export type IntegrationStatus = "not_configured" | "connected" | "error" | "disabled";

export interface Integration {
  id: string;
  tenantId: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConfigSchema {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "password" | "select";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export type FeatureFlagType = "boolean" | "string" | "number" | "json" | "select";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  defaultValue: unknown;
  isEnabled: boolean;
  tenantOverrides?: TenantFeatureOverride[];
  rolloutPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureOverride {
  tenantId: string;
  value: unknown;
  createdAt: string;
}

export interface FeatureFlagAudit {
  id: string;
  featureKey: string;
  actorId: string;
  changeType: "created" | "updated" | "deleted" | "override_added" | "override_removed";
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

export type CustomRoleType = "system" | "custom";

export interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  type: CustomRoleType;
  permissions: PermissionCode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TicketPriority = "critical" | "high" | "medium" | "low";

export type TicketStatus = "new" | "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export type TicketCategory = "support" | "feature_request" | "bug_report" | "billing" | "security";

export interface Ticket {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  assigneeId?: string;
  type?: string;
  creatorId: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketConversation {
  id: string;
  ticketId: string;
  userId?: string;
  authorId: string;
  message: string;
  content?: string;
  isInternal?: boolean;
  createdAt: string;
}

export interface TicketStatusTransition {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  actorId: string;
  comment?: string;
  createdAt: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterCriteria {
  tenantId?: string;
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  dateRange?: DateRange;
  search?: string;
}

export interface QueryOptions {
  pagination?: PaginationParams;
  sort?: SortParams;
  filter?: FilterCriteria;
}

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  includeTime?: boolean;
}

export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface RelativeTimeOptions {
  locale?: string;
  style?: "long" | "short" | "narrow";
}
