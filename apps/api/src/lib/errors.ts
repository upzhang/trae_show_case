import type { AppError as AppErrorType, ErrorCode } from "@trae/shared";

export class AppError extends Error implements AppErrorType {
  public readonly errorCode: ErrorCode;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;

  constructor(errorCode: ErrorCode, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(message);
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
    this.details = details;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      error: this.message,
      errorCode: this.errorCode,
      ...(this.details && { details: this.details })
    };
  }
}

export class AuthError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, 401, details);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("RBAC_FORBIDDEN", message, 403, details);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, 404, details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, 409, details);
    this.name = "ConflictError";
  }
}

export class LimitError extends AppError {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, 429, details);
    this.name = "LimitError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, retryAfter?: number) {
    super("RATE_LIMIT_EXCEEDED", message, 429, retryAfter ? { retryAfter } : undefined);
    this.name = "RateLimitError";
  }
}

export const errorFactory = {
  auth: {
    unauthorized: (details?: Record<string, unknown>): AuthError =>
      new AuthError("AUTH_UNAUTHORIZED", "未授权访问", details),
    invalidToken: (details?: Record<string, unknown>): AuthError =>
      new AuthError("AUTH_INVALID_TOKEN", "无效的令牌", details),
    tokenExpired: (details?: Record<string, unknown>): AuthError =>
      new AuthError("AUTH_TOKEN_EXPIRED", "令牌已过期", details),
    sessionNotFound: (details?: Record<string, unknown>): AuthError =>
      new AuthError("AUTH_SESSION_NOT_FOUND", "会话不存在", details)
  },
  rbac: {
    forbidden: (permission?: string): ForbiddenError =>
      new ForbiddenError(permission ? `缺少权限: ${permission}` : "无权访问"),
    missingPermission: (permission: string): ForbiddenError =>
      new ForbiddenError(`缺少必需权限: ${permission}`)
  },
  validation: {
    error: (message: string, details?: Record<string, unknown>): ValidationError =>
      new ValidationError(message, details),
    invalidEmail: (value?: string): ValidationError =>
      new ValidationError(`无效的邮箱格式${value ? `: ${value}` : ""}`),
    invalidUuid: (value?: string): ValidationError =>
      new ValidationError(`无效的 UUID 格式${value ? `: ${value}` : ""}`),
    invalidUrl: (value?: string): ValidationError =>
      new ValidationError(`无效的 URL 格式${value ? `: ${value}` : ""}`),
    invalidDate: (value?: string): ValidationError =>
      new ValidationError(`无效的日期格式${value ? `: ${value}` : ""}`),
    invalidCurrency: (value?: string): ValidationError =>
      new ValidationError(`无效的金额格式${value ? `: ${value}` : ""}`),
    required: (field: string): ValidationError =>
      new ValidationError(`字段 ${field} 是必填的`),
    tooShort: (field: string, min: number): ValidationError =>
      new ValidationError(`${field} 长度不能少于 ${min} 个字符`),
    tooLong: (field: string, max: number): ValidationError =>
      new ValidationError(`${field} 长度不能超过 ${max} 个字符`)
  },
  notFound: {
    general: (details?: Record<string, unknown>): NotFoundError =>
      new NotFoundError("NOT_FOUND", "资源不存在", details),
    tenant: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_TENANT", `租户${id ? ` ${id}` : ""}不存在`, { id }),
    user: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_USER", `用户${id ? ` ${id}` : ""}不存在`, { id }),
    approval: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_APPROVAL", `审批${id ? ` ${id}` : ""}不存在`, { id }),
    release: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_RELEASE", `发布${id ? ` ${id}` : ""}不存在`, { id }),
    webhook: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_WEBHOOK", `Webhook${id ? ` ${id}` : ""}不存在`, { id }),
    token: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_TOKEN", `Token${id ? ` ${id}` : ""}不存在`, { id }),
    team: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_TEAM", `团队${id ? ` ${id}` : ""}不存在`, { id }),
    integration: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_INTEGRATION", `集成${id ? ` ${id}` : ""}不存在`, { id }),
    feature: (key?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_FEATURE", `功能开关${key ? ` ${key}` : ""}不存在`, { key }),
    role: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_ROLE", `角色${id ? ` ${id}` : ""}不存在`, { id }),
    ticket: (id?: string): NotFoundError =>
      new NotFoundError("NOT_FOUND_TICKET", `工单${id ? ` ${id}` : ""}不存在`, { id })
  },
  conflict: {
    general: (details?: Record<string, unknown>): ConflictError =>
      new ConflictError("CONFLICT", "资源冲突", details),
    tenantExists: (name: string): ConflictError =>
      new ConflictError("CONFLICT_TENANT_EXISTS", `租户 "${name}" 已存在`, { name }),
    emailExists: (email: string): ConflictError =>
      new ConflictError("CONFLICT_EMAIL_EXISTS", `邮箱 "${email}" 已被使用`, { email }),
    webhookSecretExists: (details?: Record<string, unknown>): ConflictError =>
      new ConflictError("CONFLICT_WEBHOOK_SECRET_EXISTS", "Webhook 密钥已存在", details),
    roleNameExists: (name: string): ConflictError =>
      new ConflictError("CONFLICT_ROLE_NAME_EXISTS", `角色 "${name}" 已存在`, { name }),
    ticketStatus: (details?: Record<string, unknown>): ConflictError =>
      new ConflictError("CONFLICT_TICKET_STATUS", "工单状态变更冲突", details)
  },
  limit: {
    exceeded: (details?: Record<string, unknown>): LimitError =>
      new LimitError("LIMIT_EXCEEDED", "超出限制", details),
    tenantUsers: (limit: number): LimitError =>
      new LimitError("LIMIT_TENANT_USERS", `租户用户数量已达上限: ${limit}`, { limit }),
    webhooksPerTenant: (limit: number): LimitError =>
      new LimitError("LIMIT_WEBHOOKS_PER_TENANT", `Webhook 数量已达上限: ${limit}`, { limit }),
    tokensPerUser: (limit: number): LimitError =>
      new LimitError("LIMIT_TOKENS_PER_USER", `Token 数量已达上限: ${limit}`, { limit }),
    ticketsPerTenant: (limit: number): LimitError =>
      new LimitError("LIMIT_TICKETS_PER_TENANT", `工单数量已达上限: ${limit}`, { limit })
  },
  rateLimit: {
    exceeded: (retryAfter?: number): RateLimitError =>
      new RateLimitError("请求过于频繁，请稍后重试", retryAfter)
  },
  tenant: {
    notActive: (tenantId: string): AppError =>
      new AppError("TENANT_NOT_ACTIVE", "租户未激活", 403, { tenantId }),
    seatsExceeded: (tenantId: string, used: number, limit: number): AppError =>
      new AppError("TENANT_SEATS_EXCEEDED", `租户席位已超出限制: ${used}/${limit}`, 403, { tenantId, used, limit }),
    trialExpired: (tenantId: string): AppError =>
      new AppError("TENANT_TRIAL_EXPIRED", "租户试用已过期", 403, { tenantId })
  },
  integration: {
    notConfigured: (type: string): AppError =>
      new AppError("INTEGRATION_NOT_CONFIGURED", `集成 ${type} 未配置`, 400, { type }),
    authFailed: (type: string): AppError =>
      new AppError("INTEGRATION_AUTH_FAILED", `${type} 认证失败`, 401, { type }),
    connectionError: (type: string): AppError =>
      new AppError("INTEGRATION_CONNECTION_ERROR", `${type} 连接失败`, 503, { type })
  },
  feature: {
    disabled: (key: string): AppError =>
      new AppError("FEATURE_DISABLED", `功能 ${key} 未启用`, 400, { key }),
    tenantNotAllowed: (key: string, tenantId: string): AppError =>
      new AppError("FEATURE_TENANT_NOT_ALLOWED", `租户 ${tenantId} 未被授权使用功能 ${key}`, 403, { key, tenantId })
  },
  internal: {
    error: (message: string, details?: Record<string, unknown>): AppError =>
      new AppError("INTERNAL_ERROR", message, 500, details)
  }
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getHttpStatus(error: unknown): number {
  if (isAppError(error)) {
    return error.httpStatus;
  }
  return 500;
}

export function formatErrorResponse(error: unknown): Record<string, unknown> {
  if (isAppError(error)) {
    return error.toJSON();
  }
  if (error instanceof Error) {
    return {
      error: error.message,
      errorCode: "INTERNAL_ERROR" as ErrorCode
    };
  }
  return {
    error: "未知错误",
    errorCode: "INTERNAL_ERROR" as ErrorCode
  };
}
