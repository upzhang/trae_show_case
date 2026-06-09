import type { Request } from "express";

export function headerAsString(req: Request, name: string): string | undefined {
  const value = req.header(name);
  if (Array.isArray(value)) return value[0];
  return value;
}

export function paramAsString(req: Request, name: string): string | undefined {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function paramAsNumber(req: Request, name: string): number | undefined {
  const value = paramAsString(req, name);
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

export function paramAsUuid(req: Request, name: string): string | undefined {
  const value = paramAsString(req, name);
  if (!value) return undefined;
  if (!isValidUuid(value)) return undefined;
  return value;
}

export function queryAsString(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (Array.isArray(value)) {
    const firstValue = value[0];
    if (firstValue === null || firstValue === undefined || typeof firstValue === "object") {
      return undefined;
    }
    return String(firstValue);
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "object") {
    return undefined;
  }
  return String(value);
}

export function queryAsNumber(req: Request, name: string): number | undefined {
  const value = queryAsString(req, name);
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

export function queryAsBoolean(req: Request, name: string): boolean | undefined {
  const value = queryAsString(req, name);
  if (value === undefined) return undefined;
  return value.toLowerCase() === "true";
}

export function queryAsArray<T extends string = string>(
  req: Request,
  name: string
): T[] {
  const value = req.query[name];
  if (Array.isArray(value)) {
    return value.map(String) as T[];
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [String(value)] as T[];
}

export function isValidUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isValidEmail(value: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function getClientIp(req: Request): string | undefined {
  const forwarded = headerAsString(req, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headerAsString(req, "x-real-ip");
  if (realIp) {
    return realIp;
  }
  return (req.socket?.remoteAddress) ?? undefined;
}

export function getRequestPath(req: Request): string {
  return `${req.method} ${req.path}`;
}

export function getRequestDuration(startTime: number): number {
  return Date.now() - startTime;
}

export function sendJsonResponse<T>(
  data: T,
  statusCode: number = 200
): { statusCode: number; body: string } {
  return {
    statusCode,
    body: JSON.stringify(data)
  };
}

export function sendErrorResponse(
  error: Error,
  statusCode: number = 500
): { statusCode: number; body: string } {
  return {
    statusCode,
    body: JSON.stringify({
      error: error.message,
      errorCode: "INTERNAL_ERROR"
    })
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(
  errorCode: string,
  message: string
): ApiResponse {
  return {
    success: false,
    error: message,
    errorCode
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    message: undefined,
    ...{
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  };
}
