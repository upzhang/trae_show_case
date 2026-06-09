import { notifications, notificationPreferences } from "../store";
import type { Notification, NotificationPreference } from "@trae/shared";

export const notificationService = {
  createNotification(tenantId: string, userId: string, type: Notification["type"], title: string, message: string, resourceType?: string, resourceId?: string): Notification {
    return notifications.create({
      tenantId,
      userId,
      type,
      title,
      message,
      isRead: false,
      resourceType,
      resourceId,
      createdAt: new Date().toISOString()
    });
  },

  getNotification(id: string): Notification | undefined {
    return notifications.get(id);
  },

  getNotificationsByTenant(tenantId: string, filters?: { isRead?: boolean; type?: Notification["type"] }): Notification[] {
    let result = notifications.findByTenantId(tenantId);
    
    if (filters?.isRead !== undefined) {
      result = result.filter(n => n.isRead === filters.isRead);
    }
    if (filters?.type) {
      result = result.filter(n => n.type === filters.type);
    }
    
    return result;
  },

  getNotificationsByUser(userId: string, filters?: { isRead?: boolean; type?: Notification["type"] }): Notification[] {
    let result = notifications.findByUserId(userId);
    
    if (filters?.isRead !== undefined) {
      result = result.filter(n => n.isRead === filters.isRead);
    }
    if (filters?.type) {
      result = result.filter(n => n.type === filters.type);
    }
    
    return result;
  },

  markAsRead(id: string): Notification | undefined {
    return notifications.markAsRead(id);
  },

  markAllAsRead(userId: string): void {
    notifications.markAllAsRead(userId);
  },

  deleteNotification(id: string): boolean {
    return notifications.delete(id);
  },

  deleteUserNotifications(userId: string): void {
    notifications.findByUserId(userId).forEach(n => notifications.delete(n.id));
  },

  getUnreadCount(userId: string): number {
    return notifications.findUnread(userId).length;
  },

  getPreferences(userId: string): NotificationPreference | undefined {
    return notificationPreferences.findByUserId(userId);
  },

  setPreferences(userId: string, preferences: Record<string, boolean>): NotificationPreference {
    let existing = notificationPreferences.findByUserId(userId);
    
    if (existing) {
      return notificationPreferences.update(existing.id, {
        preferences,
        updatedAt: new Date().toISOString()
      })!;
    }
    
    return notificationPreferences.create({
      userId,
      preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  updatePreferences(userId: string, updates: Record<string, boolean>): NotificationPreference | undefined {
    const existing = notificationPreferences.findByUserId(userId);
    if (!existing) return undefined;
    
    return notificationPreferences.update(existing.id, {
      preferences: { ...existing.preferences, ...updates },
      updatedAt: new Date().toISOString()
    });
  },

  shouldNotify(userId: string, type: string): boolean {
    const preferences = notificationPreferences.findByUserId(userId);
    if (!preferences) return true;
    
    return preferences.preferences[type] ?? true;
  },

  sendApprovalRequestNotification(tenantId: string, userId: string, approvalId: string, title: string): void {
    if (!this.shouldNotify(userId, "approval_request")) return;
    
    this.createNotification(
      tenantId,
      userId,
      "approval_request",
      "有新的审批请求",
      title,
      "approval",
      approvalId
    );
  },

  sendApprovalDecisionNotification(tenantId: string, userId: string, approvalId: string, title: string, decision: "approved" | "rejected"): void {
    if (!this.shouldNotify(userId, "approval_decision")) return;
    
    const action = decision === "approved" ? "已通过" : "被拒绝";
    this.createNotification(
      tenantId,
      userId,
      "approval_decision",
      `审批${action}`,
      title,
      "approval",
      approvalId
    );
  },

  sendReleaseNotification(tenantId: string, userId: string, releaseId: string, version: string, status: "deployed" | "rolled_back"): void {
    if (!this.shouldNotify(userId, `release_${status}`)) return;
    
    const action = status === "deployed" ? "已部署" : "已回滚";
    this.createNotification(
      tenantId,
      userId,
      "release_deployed",
      `发布${action}`,
      `版本 ${version} 已${action}`,
      "release",
      releaseId
    );
  },

  sendRiskNotification(tenantId: string, userId: string, riskId: string, title: string, severity: string): void {
    if (!this.shouldNotify(userId, "risk_created")) return;
    
    this.createNotification(
      tenantId,
      userId,
      "risk_created",
      `${severity === "critical" ? "高危" : severity === "high" ? "高" : severity === "medium" ? "中" : "低"}风险告警`,
      title,
      "risk",
      riskId
    );
  },

  sendSystemAnnouncement(title: string, message: string): void {
    const allUsers = require("./user-service").userService.getAllUsers();
    allUsers.forEach(user => {
      if (this.shouldNotify(user.id, "system_announcement")) {
        this.createNotification(
          user.tenantId,
          user.id,
          "system_announcement",
          title,
          message
        );
      }
    });
  }
};