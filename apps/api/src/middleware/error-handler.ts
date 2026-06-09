import type { Request, Response, NextFunction } from "express";
import { isAppError, formatErrorResponse, getHttpStatus } from "../lib/errors";
import { createLogger } from "../lib/tracing";

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqRecord = req as unknown as Record<string, unknown>;
  const traceId = String(reqRecord.traceId ?? "");
  const requestId = String(reqRecord.requestId ?? "");

  const logger = createLogger(traceId, requestId);

  const statusCode = getHttpStatus(error);
  const response = formatErrorResponse(error);

  logger.error("Request error", {
    error: response,
    statusCode,
    method: req.method,
    path: req.path,
    traceId,
    requestId
  });

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response = {
    error: "Not Found",
    errorCode: "NOT_FOUND",
    path: req.path,
    method: req.method
  };

  res.status(404).json(response);
}

export function wrapAsync(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return function (req: Request, res: Response, next: NextFunction): void {
    fn(req, res, next).catch(next);
  };
}

export function validateRequest(
  validator: (req: Request) => Promise<void> | void
) {
  return function (req: Request, res: Response, next: NextFunction): void {
    try {
      const result = validator(req);
      if (result instanceof Promise) {
        result.then(() => next()).catch(next);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}
