import type { Request, Response, NextFunction } from "express";
import { z, type ZodType } from "zod";
import { errorFactory } from "../lib/errors";

export interface ValidationOptions {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

export function validateSchema(options: ValidationOptions) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    const errors: Record<string, string[]> = {};

    if (options.params) {
      try {
        await options.params.parseAsync(req.params);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.params = error.errors.map((e) => e.message);
        }
      }
    }

    if (options.query) {
      try {
        const parsed = await options.query.parseAsync(req.query);
        const reqRecord = req as unknown as Record<string, unknown>;
        reqRecord.validatedQuery = parsed;
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.query = error.errors.map((e) => e.message);
        }
      }
    }

    if (options.body) {
      try {
        const parsed = await options.body.parseAsync(req.body);
        const reqRecord = req as unknown as Record<string, unknown>;
        reqRecord.validatedBody = parsed;
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.body = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw errorFactory.validation.error("请求参数验证失败", errors);
    }

    next();
  };
}

export function validateParams(schema: ZodType) {
  return validateSchema({ params: schema });
}

export function validateQuery(schema: ZodType) {
  return validateSchema({ query: schema });
}

export function validateBody(schema: ZodType) {
  return validateSchema({ body: schema });
}

export function validate(schema: ZodType) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = await schema.parseAsync({
        params: req.params,
        query: req.query,
        body: req.body
      });

      const reqRecord = req as unknown as Record<string, unknown>;
      reqRecord.validated = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message
        }));
        throw errorFactory.validation.error("验证失败", { errors });
      }
      throw errorFactory.validation.error("验证失败");
    }
  };
}

export function requireParams(...paramNames: string[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const missing = paramNames.filter((name) => !req.params[name]);

    if (missing.length > 0) {
      throw errorFactory.validation.error(`缺少必需参数: ${missing.join(", ")}`);
    }

    next();
  };
}

export function requireBodyFields(...fieldNames: string[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.body) {
      throw errorFactory.validation.error("请求体不能为空");
    }

    const missing = fieldNames.filter((name) => !req.body[name]);

    if (missing.length > 0) {
      throw errorFactory.validation.error(`缺少必需字段: ${missing.join(", ")}`);
    }

    next();
  };
}

export function requireQueryParams(...paramNames: string[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const missing = paramNames.filter((name) => !req.query[name]);

    if (missing.length > 0) {
      throw errorFactory.validation.error(`缺少必需查询参数: ${missing.join(", ")}`);
    }

    next();
  };
}

export function validateArrayLength(
  field: string,
  min?: number,
  max?: number
) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const value = req.body?.[field];

    if (!Array.isArray(value)) {
      throw errorFactory.validation.error(`${field} 必须是数组`);
    }

    if (min !== undefined && value.length < min) {
      throw errorFactory.validation.error(`${field} 至少需要 ${min} 个元素`);
    }

    if (max !== undefined && value.length > max) {
      throw errorFactory.validation.error(`${field} 最多允许 ${max} 个元素`);
    }

    next();
  };
}

export function validateStringLength(
  field: string,
  min?: number,
  max?: number
) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const value = req.body?.[field];

    if (typeof value !== "string") {
      throw errorFactory.validation.error(`${field} 必须是字符串`);
    }

    if (min !== undefined && value.length < min) {
      throw errorFactory.validation.error(`${field} 长度不能少于 ${min} 个字符`);
    }

    if (max !== undefined && value.length > max) {
      throw errorFactory.validation.error(`${field} 长度不能超过 ${max} 个字符`);
    }

    next();
  };
}
