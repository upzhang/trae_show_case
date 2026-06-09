import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { notifications, notificationPreferences } from "../store";
import { NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("notification:view"), (req, res) => {
  const { tenantId, id: userId } = req.user;
  const { isRead, type } = req.query as Record<string, string>;
  
  let notificationList = notifications.findByTenantId(tenantId);
  
  if (userId) {
    notificationList = notificationList.filter(n => n.userId === userId || !n.userId);
  }
  if (isRead !== undefined) {
    notificationList = notificationList.filter(n => n.isRead === (isRead === "true"));
  }
  if (type) {
    notificationList = notificationList.filter(n => n.type === type);
  }
  
  res.json(notificationList);
});

router.get("/unread", requirePermission("notification:view"), (req, res) => {
  const { id: userId } = req.user;
  const unread = notifications.findUnread(userId);
  res.json(unread);
});

router.get("/:id", requirePermission("notification:view"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const notification = notifications.get(id);
  
  if (!notification) {
    throw new NotFoundError("通知不存在");
  }
  
  if (notification.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    return res.status(403).json({ message: "无权访问该资源" });
  }
  
  res.json(notification);
});

router.put("/:id/read", requirePermission("notification:manage"), (req, res) => {
  const { id } = req.params;
  
  const notification = notifications.get(id);
  
  if (!notification) {
    throw new NotFoundError("通知不存在");
  }
  
  const updated = notifications.markAsRead(id);
  res.json(updated);
});

router.put("/read-all", requirePermission("notification:manage"), (req, res) => {
  const { id: userId } = req.user;
  notifications.markAllAsRead(userId);
  res.json({ message: "所有通知已标记为已读" });
});

router.delete("/:id", requirePermission("notification:manage"), (req, res) => {
  const { id } = req.params;
  
  const notification = notifications.get(id);
  
  if (!notification) {
    throw new NotFoundError("通知不存在");
  }
  
  notifications.delete(id);
  res.status(204).send();
});

router.get("/preferences", requirePermission("notification:manage"), (req, res) => {
  const { id: userId } = req.user;
  const preferences = notificationPreferences.findByUserId(userId);
  
  if (!preferences) {
    res.json({ userId, preferences: {} });
  } else {
    res.json(preferences);
  }
});

router.put("/preferences", requirePermission("notification:manage"), (req, res) => {
  const { id: userId } = req.user;
  const { preferences } = req.body;
  
  let existing = notificationPreferences.findByUserId(userId);
  
  if (existing) {
    const updated = notificationPreferences.update(existing.id, {
      preferences,
      updatedAt: new Date().toISOString()
    });
    res.json(updated);
  } else {
    const newPreferences = notificationPreferences.create({
      userId,
      preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    res.status(201).json(newPreferences);
  }
});

export default router;