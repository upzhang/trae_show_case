import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { tokenSchema } from "../lib/validators";
import { tokens } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("token:manage"), (req, res) => {
  const { tenantId } = req.user;
  const tokenList = tokens.findByTenantId(tenantId);
  res.json(tokenList);
});

router.get("/:id", requirePermission("token:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const token = tokens.get(id);
  
  if (!token) {
    throw new NotFoundError("API Token 不存在");
  }
  
  if (token.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  res.json(token);
});

router.post("/", requirePermission("token:manage"), validate(tokenSchema), (req, res) => {
  const { tenantId } = req.user;
  const { name, scopes, expiresAt } = req.body;
  
  const tokenValue = tokens.generateToken();
  const newToken = tokens.create({
    tenantId,
    userId: req.user.id,
    name,
    token: tokenValue,
    scopes,
    expiresAt,
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json({ token: tokenValue, ...newToken });
});

router.put("/:id", requirePermission("token:manage"), validate(tokenSchema), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { name, scopes, expiresAt } = req.body;
  
  const token = tokens.get(id);
  
  if (!token) {
    throw new NotFoundError("API Token 不存在");
  }
  
  if (token.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = tokens.update(id, {
    name,
    scopes,
    expiresAt,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.delete("/:id", requirePermission("token:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const token = tokens.get(id);
  
  if (!token) {
    throw new NotFoundError("API Token 不存在");
  }
  
  if (token.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权删除该资源");
  }
  
  tokens.delete(id);
  res.status(204).send();
});

router.post("/:id/rotate", requirePermission("token:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const token = tokens.get(id);
  
  if (!token) {
    throw new NotFoundError("API Token 不存在");
  }
  
  if (token.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const newToken = tokens.generateToken();
  const updated = tokens.update(id, {
    token: newToken,
    updatedAt: new Date().toISOString()
  });
  
  res.json({ token: newToken, ...updated });
});

export default router;