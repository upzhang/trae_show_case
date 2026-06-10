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
    
    return (preferences.preferences as Record<string, boolean>)[type] ?? true;
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
    allUsers.forEach((user: { id: string; tenantId: string }) => {
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
  },

  /**
   * 批量发送通知给多个用户。
   */
  sendBatchNotifications(
    userIds: string[],
    notification: { title: string; message: string; type: string }
  ): { sent: number; failed: number } {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        // 通过通知仓库查找用户所属租户
        const existingNotifs = notifications.findByUserId(userId);
        const tenantId = existingNotifs.length > 0
          ? existingNotifs[0].tenantId
          : "default";

        // 检查用户偏好
        if (!this.shouldNotify(userId, notification.type)) {
          continue;
        }

        notifications.create({
          tenantId,
          userId,
          type: notification.type as Notification["type"],
          title: notification.title,
          message: notification.message,
          isRead: false,
          createdAt: new Date().toISOString()
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  },

  /**
   * 定时调度通知。
   * 返回调度 ID（即通知 ID），通知将在指定时间触发。
   */
  scheduleNotification(
    notification: { tenantId: string; userId: string; type: string; title: string; message: string },
    scheduledAt: string
  ): string {
    const created = notifications.create({
      tenantId: notification.tenantId,
      userId: notification.userId,
      type: notification.type as Notification["type"],
      title: notification.title,
      message: notification.message,
      isRead: false,
      scheduledAt,
      status: "scheduled",
      createdAt: new Date().toISOString()
    });

    return created.id;
  },

  /**
   * 获取预定义的通知模板列表。
   */
  getNotificationTemplates(): {
    id: string;
    name: string;
    title: string;
    body: string;
    type: string;
  }[] {
    return [
      {
        id: "tpl-approval-request",
        name: "审批请求通知",
        title: "有新的审批请求",
        body: "{{requesterName}} 提交了审批请求：{{approvalTitle}}",
        type: "approval_request"
      },
      {
        id: "tpl-approval-approved",
        name: "审批通过通知",
        title: "审批已通过",
        body: "您的审批请求「{{approvalTitle}}」已通过",
        type: "approval_decision"
      },
      {
        id: "tpl-approval-rejected",
        name: "审批拒绝通知",
        title: "审批被拒绝",
        body: "您的审批请求「{{approvalTitle}}」被拒绝，原因：{{reason}}",
        type: "approval_decision"
      },
      {
        id: "tpl-release-deployed",
        name: "发布部署通知",
        title: "发布已部署",
        body: "版本 {{version}} 已成功部署到 {{environment}} 环境",
        type: "release_deployed"
      },
      {
        id: "tpl-release-rolled-back",
        name: "发布回滚通知",
        title: "发布已回滚",
        body: "版本 {{version}} 在 {{environment}} 环境已回滚",
        type: "release_rolled_back"
      },
      {
        id: "tpl-risk-created",
        name: "风险创建通知",
        title: "{{severityLabel}}风险告警",
        body: "检测到新风险：{{riskTitle}}，严重程度：{{severity}}",
        type: "risk_created"
      },
      {
        id: "tpl-risk-updated",
        name: "风险更新通知",
        title: "风险状态更新",
        body: "风险「{{riskTitle}}」状态已更新为：{{newStatus}}",
        type: "risk_updated"
      },
      {
        id: "tpl-invoice-ready",
        name: "发票就绪通知",
        title: "发票已生成",
        body: "您的 {{period}} 发票已生成，金额：{{amount}}",
        type: "invoice_ready"
      },
      {
        id: "tpl-invoice-overdue",
        name: "发票逾期提醒",
        title: "发票逾期提醒",
        body: "您有一张发票已逾期，金额 {{amount}}，请尽快支付",
        type: "invoice_overdue"
      },
      {
        id: "tpl-subscription-renewal",
        name: "订阅续约提醒",
        title: "订阅即将到期",
        body: "您的订阅将于 {{expireDate}} 到期，请及时续约",
        type: "subscription_renewal"
      },
      {
        id: "tpl-system-maintenance",
        name: "系统维护通知",
        title: "系统维护通知",
        body: "系统将于 {{startTime}} 至 {{endTime}} 进行维护升级",
        type: "system_announcement"
      },
      {
        id: "tpl-feature-released",
        name: "功能发布通知",
        title: "新功能上线",
        body: "新功能「{{featureName}}」已上线，{{description}}",
        type: "feature_released"
      }
    ];
  },

  /**
   * 获取通知统计数据。
   */
  getNotificationStats(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    todayCount: number;
  } {
    const allNotifications = notifications.getAll();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let unread = 0;
    let todayCount = 0;
    const byType: Record<string, number> = {};

    for (const notif of allNotifications) {
      if (!notif.isRead) {
        unread++;
      }

      const notifTime = new Date(notif.createdAt).getTime();
      if (notifTime >= todayStart) {
        todayCount++;
      }

      byType[notif.type] = (byType[notif.type] || 0) + 1;
    }

    return {
      total: allNotifications.length,
      unread,
      byType,
      todayCount
    };
  }
};