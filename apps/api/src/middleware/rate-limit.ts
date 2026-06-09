import type { Request, Response, NextFunction } from "express";
import { errorFactory } from "../lib/errors";
import { SimpleCache } from "../lib/cache";
import { getClientIp } from "../lib/http";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

interface RateLimitState {
  count: number;
  startTime: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000,
  max: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const options = { ...defaultConfig, ...config };
  const cache = new SimpleCache<RateLimitState>(options.windowMs);

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const key = getKey(req);

    const existingState = cache.get(key);
    const now = Date.now();

    let state: RateLimitState;

    if (!existingState || now - existingState.startTime >= options.windowMs) {
      state = {
        count: 1,
        startTime: now
      };
    } else {
      state = {
        count: existingState.count + 1,
        startTime: existingState.startTime
      };
    }

    cache.set(key, state, options.windowMs);

    if (state.count > options.max) {
      const retryAfter = Math.ceil((options.windowMs - (now - state.startTime)) / 1000);

      if (options.standardHeaders) {
        res.setHeader("Retry-After", String(retryAfter));
        res.setHeader("X-RateLimit-Limit", String(options.max));
        res.setHeader("X-RateLimit-Remaining", "0");
        res.setHeader("X-RateLimit-Reset", String(Math.floor((state.startTime + options.windowMs) / 1000)));
      }

      if (options.legacyHeaders) {
        res.setHeader("X-RateLimit-Limit", String(options.max));
        res.setHeader("X-RateLimit-Remaining", "0");
      }

      throw errorFactory.rateLimit.exceeded(retryAfter);
    }

    if (options.standardHeaders) {
      res.setHeader("X-RateLimit-Limit", String(options.max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(options.max - state.count, 0)));
      res.setHeader("X-RateLimit-Reset", String(Math.floor((state.startTime + options.windowMs) / 1000)));
    }

    if (options.skipSuccessfulRequests || options.skipFailedRequests) {
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      res.send = function (body?: unknown): Response {
        handleResponse(res, key, cache, options);
        return originalSend(body);
      };

      res.json = function (body?: unknown): Response {
        handleResponse(res, key, cache, options);
        return originalJson(body);
      };
    }

    next();
  };
}

function getKey(req: Request): string {
  const reqRecord = req as unknown as Record<string, unknown>;
  const userId = String(reqRecord.userId ?? "");
  const ip = getClientIp(req) ?? "unknown";

  if (userId) {
    return `rate-limit:user:${userId}`;
  }

  return `rate-limit:ip:${ip}`;
}

function handleResponse(
  res: Response,
  key: string,
  cache: SimpleCache<RateLimitState>,
  options: RateLimitConfig
): void {
  const state = cache.get(key);
  if (!state) return;

  if (options.skipSuccessfulRequests && res.statusCode >= 200 && res.statusCode < 400) {
    state.count = Math.max(0, state.count - 1);
    cache.set(key, state);
  }

  if (options.skipFailedRequests && res.statusCode >= 400) {
    state.count = Math.max(0, state.count - 1);
    cache.set(key, state);
  }
}

export const apiRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
  standardHeaders: true
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  standardHeaders: true
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 5,
  standardHeaders: true,
  skipFailedRequests: true
});
