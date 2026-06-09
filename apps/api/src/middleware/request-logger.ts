import type { Request, Response, NextFunction } from "express";
import { createLogger } from "../lib/tracing";
import { getClientIp, getRequestDuration } from "../lib/http";

export function requestLogger() {
  return function (req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const reqRecord = req as unknown as Record<string, unknown>;
    const traceId = String(reqRecord.traceId ?? "");
    const requestId = String(reqRecord.requestId ?? "");

    const logger = createLogger(traceId, requestId);

    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    res.send = function (body?: unknown): Response {
      logRequest(req, res, startTime, logger);
      return originalSend(body);
    };

    res.json = function (body?: unknown): Response {
      logRequest(req, res, startTime, logger);
      return originalJson(body);
    };

    res.on("finish", () => {
      logRequest(req, res, startTime, logger);
    });

    next();
  };
}

function logRequest(
  req: Request,
  res: Response,
  startTime: number,
  logger: ReturnType<typeof createLogger>
): void {
  const duration = getRequestDuration(startTime);
  const ip = getClientIp(req);

  const logData = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip,
    userAgent: req.get("user-agent"),
    contentType: req.get("content-type"),
    contentLength: req.get("content-length")
  };

  if (res.statusCode >= 500) {
    logger.error("Request failed", logData);
  } else if (res.statusCode >= 400) {
    logger.warn("Request error", logData);
  } else if (duration > 1000) {
    logger.warn("Slow request", { ...logData, durationMs: duration });
  } else {
    logger.info("Request completed", logData);
  }
}

export function traceMiddleware() {
  return function (req: Request, res: Response, next: NextFunction): void {
    const { generateTraceId, generateRequestId } = require("../lib/tracing");

    const traceId = req.header("x-trace-id") ?? generateTraceId();
    const requestId = req.header("x-request-id") ?? generateRequestId();

    const reqRecord = req as unknown as Record<string, unknown>;
    reqRecord.traceId = traceId;
    reqRecord.requestId = requestId;

    res.setHeader("x-trace-id", traceId);
    res.setHeader("x-request-id", requestId);

    next();
  };
}

export function healthCheckMiddleware() {
  return function (req: Request, res: Response): void {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  };
}

export function corsMiddleware(
  allowedOrigins: string[] = ["*"],
  allowedMethods: string[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: string[] = ["*"]
) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const origin = req.header("origin");
    const isAllowedOrigin = allowedOrigins.includes("*") || allowedOrigins.includes(origin ?? "");

    if (isAllowedOrigin && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", allowedMethods.join(","));
    res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(","));
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  };
}

export function jsonMiddleware() {
  return function (req: Request, res: Response, next: NextFunction): void {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
  };
}
