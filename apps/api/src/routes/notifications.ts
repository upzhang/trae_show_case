import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { notifications, notificationPreferences } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

function serializeNotification(notification: unknown) {
  const item = notification as Record<string, unknown>;
  return { ...item, read: item.isRead };
}

router.get("/", requirePermission("notification:view"), (req, res) => {
  const { tenantId, id: userId } = req.user;
  const { isRead, read, type, page, pageSize, q } = req.query as Record<string, string>;
  
  let notificationList = notifications.findByTenantId(tenantId);
  
  if (userId) {
    notificationList = notificationList.filter(n => n.userId === userId || !n.userId);
  }
  const readFilter = isRead ?? read;
  if (readFilter !== undefined) {
    notificationList = notificationList.filter(n => n.isRead === (readFilter === "true"));
  }
  if (type) {
    notificationList = notificationList.filter(n => n.type === type);
  }
  if (q) {
    const keyword = q.toLowerCase();
    notificationList = notificationList.filter(n => n.title.toLowerCase().includes(keyword) || n.message.toLowerCase().includes(keyword));
  }

  const serialized = notificationList.map((notification) => serializeNotification(notification));
  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: serialized.slice(start, start + currentPageSize),
      total: serialized.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }
  
  res.json(serialized);
});

router.get("/unread", requirePermission("notification:view"), (req, res) => {
  const { id: userId } = req.user;
  const unread = notifications.findUnread(userId);
  res.json(unread.map((notification) => serializeNotification(notification)));
});

router.get("/me", requirePermission("notification:view"), (req, res) => {
  res.json(notifications.findByUserId(req.user.id).map((notification) => serializeNotification(notification)));
});

router.get("/count/unread", requirePermission("notification:view"), (req, res) => {
  res.json({ count: notifications.findUnread(req.user.id).length });
});

router.get("/statistics", requirePermission("notification:view"), (req, res) => {
  const list = notifications.findByTenantId(req.user.tenantId);
  res.json({
    total: list.length,
    unread: list.filter((notification) => !notification.isRead).length,
    read: list.filter((notification) => notification.isRead).length
  });
});

router.get("/statistics/type", requirePermission("notification:view"), (req, res) => {
  const list = notifications.findByTenantId(req.user.tenantId);
  const count = (type: string) => list.filter((notification) => notification.type === type).length;
  res.json({
    info: count("info"),
    warning: count("warning"),
    error: count("error"),
    success: count("success"),
    system: count("system")
  });
});

router.get("/scheduled", requirePermission("notification:view"), (req, res) => {
  res.json(notifications.findByTenantId(req.user.tenantId).filter((notification) => (notification as never as { status?: string }).status === "scheduled"));
});

router.get("/search", requirePermission("notification:view"), (req, res) => {
  const { q } = req.query as { q?: string };
  const keyword = (q ?? "").toLowerCase();
  res.json(notifications.findByTenantId(req.user.tenantId)
    .filter((notification) => notification.title.toLowerCase().includes(keyword) || notification.message.toLowerCase().includes(keyword))
    .map((notification) => serializeNotification(notification)));
});

router.post("/", requirePermission("notification:manage"), (req, res) => {
  const { userId, title, message, type } = req.body ?? {};

  if (!title || !message) {
    throw new BadRequestError("通知参数无效");
  }

  const notification = notifications.create({
    tenantId: req.user.tenantId,
    userId,
    title,
    message,
    type: type ?? "info",
    isRead: false,
    createdAt: new Date().toISOString()
  } as never);

  res.status(201).json(serializeNotification(notification));
});

router.post("/broadcast", requirePermission("notification:manage"), (req, res) => {
  const notification = notifications.create({
    tenantId: req.user.tenantId,
    title: req.body.title,
    message: req.body.message,
    type: req.body.type ?? "info",
    isRead: false,
    createdAt: new Date().toISOString()
  } as never);
  res.json({ sentCount: 1, notification: serializeNotification(notification) });
});

router.post("/batch", requirePermission("notification:manage"), (req, res) => {
  const { userIds = [], title, message, type } = req.body ?? {};
  const created = userIds.map((userId: string) => notifications.create({
    tenantId: req.user.tenantId,
    userId,
    title,
    message,
    type: type ?? "info",
    isRead: false,
    createdAt: new Date().toISOString()
  } as never));
  res.status(201).json({ count: created.length, data: created.map((notification: unknown) => serializeNotification(notification)) });
});

router.post("/schedule", requirePermission("notification:manage"), (req, res) => {
  const { userId, title, message, type, scheduledAt } = req.body ?? {};
  const notification = notifications.create({
    tenantId: req.user.tenantId,
    userId,
    title,
    message,
    type: type ?? "info",
    scheduledAt,
    status: "scheduled",
    isRead: false,
    createdAt: new Date().toISOString()
  } as never);
  res.status(201).json(serializeNotification(notification));
});

router.delete("/scheduled/:id", requirePermission("notification:manage"), (req, res) => {
  const notification = notifications.get(req.params.id);

  if (!notification) {
    throw new NotFoundError("通知不存在");
  }

  const updated = notifications.update(req.params.id, { status: "cancelled" } as never);
  res.json(serializeNotification(updated as never));
});

router.post("/read-all", requirePermission("notification:manage"), (req, res) => {
  const unread = notifications.findUnread(req.user.id);
  notifications.markAllAsRead(req.user.id);
  res.json({ count: unread.length });
});

router.delete("/user/:userId", requirePermission("notification:manage"), (req, res) => {
  const userNotifications = notifications.findByUserId(req.params.userId);
  userNotifications.forEach((notification) => notifications.delete(notification.id));
  res.json({ deletedCount: userNotifications.length });
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
  
  res.json(serializeNotification(notification));
});

router.put("/:id", requirePermission("notification:manage"), (req, res) => {
  const notification = notifications.get(req.params.id);

  if (!notification) {
    throw new NotFoundError("通知不存在");
  }

  const updated = notifications.update(req.params.id, req.body);
  res.json(serializeNotification(updated as never));
});

router.put("/:id/read", requirePermission("notification:manage"), (req, res) => {
  const { id } = req.params;
  
  const notification = notifications.get(id);
  
  if (!notification) {
    throw new NotFoundError("通知不存在");
  }
  
  const updated = notifications.markAsRead(id);
  res.json(serializeNotification(updated as never));
});

router.patch("/:id/read", requirePermission("notification:manage"), (req, res) => {
  const notification = notifications.get(req.params.id);

  if (!notification) {
    throw new NotFoundError("通知不存在");
  }

  const updated = notifications.markAsRead(req.params.id);
  res.json(serializeNotification(updated as never));
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
