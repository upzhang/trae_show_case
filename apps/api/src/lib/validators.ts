import { z } from "zod";
import { errorFactory } from "./errors";

export const emailSchema = z.string().email("无效的邮箱格式");

export const uuidSchema = z.string().min(1, "ID 不能为空");

export const urlSchema = z.string().url("无效的 URL 格式");

export const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  "无效的日期格式"
);

export const currencySchema = z.number().positive("金额必须为正数");

export const phoneSchema = z.string().regex(
  /^1[3-9]\d{9}$/,
  "无效的手机号码格式"
);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});

export const idParamSchema = z.object({
  id: uuidSchema
});

export const emailParamSchema = z.object({
  email: emailSchema
});

export const tenantIdParamSchema = z.object({
  tenantId: uuidSchema
});

export const tenantCreateSchema = z.object({
  name: z.string().min(1, "租户名称不能为空").max(100, "租户名称不能超过100个字符"),
  plan: z.enum(["standard", "enterprise"]),
  industry: z.string().min(1, "行业不能为空"),
  seatsLimit: z.coerce.number().int().positive("席位限制必须为正整数"),
  customerSuccessManager: z.string().optional()
});

export const tenantUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plan: z.enum(["standard", "enterprise"]).optional(),
  industry: z.string().optional(),
  seatsLimit: z.coerce.number().int().positive().optional(),
  customerSuccessManager: z.string().optional()
});

export const userCreateSchema = z.object({
  name: z.string().min(1, "用户名称不能为空").max(100, "用户名称不能超过100个字符"),
  email: emailSchema,
  tenantId: uuidSchema,
  roles: z.array(z.enum(["platform_admin", "tenant_admin", "auditor", "release_manager", "member"])).nonempty("至少需要一个角色")
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
  roles: z.array(z.enum(["platform_admin", "tenant_admin", "auditor", "release_manager", "member"])).optional()
});

export const approvalCreateSchema = z.object({
  title: z.string().min(1, "审批标题不能为空").max(200, "审批标题不能超过200个字符"),
  description: z.string().optional()
});

export const releaseCreateSchema = z.object({
  version: z.string().min(1, "版本号不能为空").max(50, "版本号不能超过50个字符"),
  environment: z.enum(["staging", "production"]),
  description: z.string().optional(),
  changelog: z.string().optional()
});

export const webhookCreateSchema = z.object({
  name: z.string().min(1, "Webhook 名称不能为空").max(100, "Webhook 名称不能超过100个字符"),
  url: urlSchema,
  events: z.array(z.string().min(1)).nonempty("至少需要订阅一个事件类型")
});

export const webhookUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: urlSchema.optional(),
  events: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional()
});

export const tokenCreateSchema = z.object({
  name: z.string().min(1, "Token 名称不能为空").max(100, "Token 名称不能超过100个字符"),
  scopes: z.array(z.enum(["read", "write", "admin"])).nonempty("至少需要一个权限范围"),
  expiresAt: dateSchema.optional()
});

export const teamCreateSchema = z.object({
  name: z.string().min(1, "团队名称不能为空").max(100, "团队名称不能超过100个字符"),
  description: z.string().max(500, "团队描述不能超过500个字符").optional()
});

export const teamUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional()
});

export const teamMemberAddSchema = z.object({
  userId: uuidSchema,
  role: z.string().max(50).optional()
});

export const integrationConfigSchema = z.object({
  type: z.enum(["slack", "salesforce", "zendesk", "jira", "github", "stripe", "webhook", "custom"]),
  name: z.string().min(1).max(100),
  config: z.record(z.string(), z.any()).optional()
});

export const featureFlagCreateSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/, "功能开关 key 必须以小写字母开头，只能包含小写字母、数字和下划线"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["boolean", "string", "number", "json", "select", "feature", "system", "beta"]),
  defaultValue: z.any().optional(),
  isEnabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.coerce.number().min(0).max(100).optional()
});

export const featureFlagUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(["boolean", "string", "number", "json", "select", "feature", "system", "beta"]).optional(),
  defaultValue: z.any().optional(),
  isEnabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.coerce.number().min(0).max(100).optional()
});

export const roleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).nonempty("至少需要一个权限")
});

export const roleUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export const ticketCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum(["support", "feature_request", "bug_report", "billing", "security"]).optional(),
  type: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const ticketUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  category: z.enum(["support", "feature_request", "bug_report", "billing", "security"]).optional(),
  assigneeId: uuidSchema.optional(),
  tags: z.array(z.string()).optional()
});

export const ticketStatusUpdateSchema = z.object({
  status: z.enum(["new", "in_progress", "waiting_customer", "resolved", "closed"]),
  comment: z.string().optional()
});

export const ticketCommentSchema = z.object({
  message: z.string().min(1).max(1000).optional(),
  content: z.string().min(1).max(1000).optional(),
  isInternal: z.boolean().default(false)
});

export const notificationPreferenceSchema = z.object({
  preferences: z.record(z.enum([
    "system_announcement",
    "approval_request",
    "approval_decision",
    "release_deployed",
    "release_rolled_back",
    "risk_created",
    "risk_updated",
    "invoice_ready",
    "invoice_overdue",
    "subscription_renewal",
    "feature_released"
  ]), z.boolean())
});

// 兼容旧路由中 validate(schema) 的调用方式：schema 接收完整 req 容器。
export const webhookSchema = z.object({ body: webhookCreateSchema });
export const tokenSchema = z.object({ body: tokenCreateSchema });
export const teamSchema = z.object({ body: teamCreateSchema });
export const teamMemberSchema = z.object({ body: teamMemberAddSchema });
export const integrationSchema = z.object({ body: integrationConfigSchema });
export const featureFlagSchema = z.object({ body: featureFlagCreateSchema });
export const ticketSchema = z.object({ body: ticketCreateSchema });
export const ticketConversationSchema = z.object({ body: ticketCommentSchema });

export async function validateAndThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): Promise<T> {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message
    }));

    throw errorFactory.validation.error(
      context ? `${context} 验证失败` : "验证失败",
      { errors }
    );
  }

  return result.data;
}

export function validateSync<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message
    }));

    throw errorFactory.validation.error(
      context ? `${context} 验证失败` : "验证失败",
      { errors }
    );
  }

  return result.data;
}

export function validateEmail(email: string): void {
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    throw errorFactory.validation.invalidEmail(email);
  }
}

export function validateUuid(uuid: string): void {
  const result = uuidSchema.safeParse(uuid);
  if (!result.success) {
    throw errorFactory.validation.invalidUuid(uuid);
  }
}

export function validateUrl(url: string): void {
  const result = urlSchema.safeParse(url);
  if (!result.success) {
    throw errorFactory.validation.invalidUrl(url);
  }
}

export function validateDate(date: string): void {
  const result = dateSchema.safeParse(date);
  if (!result.success) {
    throw errorFactory.validation.invalidDate(date);
  }
}
