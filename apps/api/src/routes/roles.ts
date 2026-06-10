import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { roleDefinitions } from "../store";
import * as roleService from "../services/role-service";

const router = Router();

/** GET /api/permissions — 获取所有权限码 */
router.get("/api/permissions", requirePermission("role:read"), (_req, res) => {
  const permissions = roleService.getAllPermissions();
  const groups = roleService.getPermissionGroups();
  res.json({ permissions, groups });
});

/** GET /api/roles — 角色列表 */
router.get("/api/roles", requirePermission("role:read"), (_req, res) => {
  const allRoles = roleDefinitions.getAll();
  res.json(allRoles);
});

/** POST /api/roles — 创建角色 */
router.post("/api/roles", requirePermission("role:write"), (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({ error: "缺少必要参数：name, permissions" });
      return;
    }
    const role = roleService.createRole({ name, description, permissions });
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
});

/** GET /api/roles/:id — 角色详情 */
router.get("/api/roles/:id", requirePermission("role:read"), (req, res) => {
  const role = roleDefinitions.get(req.params.id);
  if (!role) {
    res.status(404).json({ error: "角色不存在" });
    return;
  }
  res.json(role);
});

/** PUT /api/roles/:id — 更新角色 */
router.put("/api/roles/:id", requirePermission("role:write"), (req, res, next) => {
  try {
    const role = roleService.updateRole(req.params.id as string, req.body);
    res.json(role);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/roles/:id — 删除角色 */
router.delete("/api/roles/:id", requirePermission("role:delete"), (req, res, next) => {
  try {
    roleService.deleteRole(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** POST /api/roles/:id/clone — 克隆角色 */
router.post("/api/roles/:id/clone", requirePermission("role:write"), (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "缺少克隆角色名称" });
      return;
    }
    const role = roleService.cloneRole(req.params.id as string, name);
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
});

export default router;
