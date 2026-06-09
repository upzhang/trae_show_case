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
