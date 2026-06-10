import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success" | "system_announcement" | "approval" | "release" | "risk" | "billing";
  status: "read" | "unread";
  createdAt: string;
  readAt?: string;
  resourceType?: string;
  resourceId?: string;
  link?: string;
}

interface NotificationPreference {
  type: string;
  label: string;
  enabled: boolean;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all" as "all" | "read" | "unread");
  const [typeFilter, setTypeFilter] = useState("all" as "all" | "system_announcement" | "approval" | "release" | "risk" | "billing");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    { type: "system_announcement", label: "系统公告", enabled: true },
    { type: "approval", label: "审批通知", enabled: true },
    { type: "release", label: "发布通知", enabled: true },
    { type: "risk", label: "风险通知", enabled: true },
    { type: "billing", label: "计费通知", enabled: true },
    { type: "info", label: "一般信息", enabled: true },
    { type: "warning", label: "警告通知", enabled: true },
    { type: "error", label: "错误通知", enabled: false },
    { type: "success", label: "成功通知", enabled: true },
  ]);

  const typeNames: Record<string, string> = {
    info: "信息", warning: "警告", error: "错误", success: "成功",
    system_announcement: "系统公告", approval: "审批", release: "发布", risk: "风险", billing: "计费"
  };
  const typeIcons: Record<string, string> = {
    info: "ℹ️", warning: "⚠️", error: "❌", success: "✅",
    system_announcement: "📢", approval: "📋", release: "🚀", risk: "🔴", billing: "💰"
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const queryString = params.toString();
      const response = await api.get(`/notifications${queryString ? `?${queryString}` : ""}`);
      setNotifications(response || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter]);

  async function handleMarkAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.post("/notifications/mark-all-read");
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }

  async function handleDeleteAllRead() {
    if (confirm("确定要删除所有已读通知吗？")) {
      try {
        await api.delete("/notifications/read");
        fetchNotifications();
      } catch (error) {
        console.error("Failed to delete read notifications:", error);
      }
    }
  }

  function handleShowDetail(notification: Notification) {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }
  }

  function togglePreference(type: string) {
    setPreferences((prev) =>
      prev.map((p) => (p.type === type ? { ...p, enabled: !p.enabled } : p))
    );
  }

  async function savePreferences() {
    try {
      const prefsMap: Record<string, boolean> = {};
      preferences.forEach((p) => { prefsMap[p.type] = p.enabled; });
      await api.put("/notifications/preferences", { preferences: prefsMap });
      setShowPreferencesModal(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  }

  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const todayNotifications = notifications.filter((n) => {
    const today = new Date();
    const created = new Date(n.createdAt);
    return created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear();
  }).length;

  function getTypeClass(type: string) {
    return `type-${type}`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>通知管理</h1>
        <div className="page-header-actions">
          {can("notification:manage") && (
            <button onClick={() => setShowPreferencesModal(true)} className="btn-secondary">
              偏好设置
            </button>
          )}
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn-secondary">
              全部标为已读 ({unreadCount})
            </button>
          )}
          <button onClick={handleDeleteAllRead} className="btn-danger">
            删除已读通知
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">未读数</div>
          <div className="value">{unreadCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">今日新增</div>
          <div className="value">{todayNotifications}</div>
        </div>
        <div className="stat-card">
          <div className="label">总通知数</div>
          <div className="value">{notifications.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">已读数</div>
          <div className="value">{notifications.length - unreadCount}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>阅读状态</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">全部</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
          </select>
        </div>
        <div className="filter-group">
          <label>通知类型</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          >
            <option value="all">全部类型</option>
            <option value="system_announcement">系统公告</option>
            <option value="approval">审批通知</option>
            <option value="release">发布通知</option>
            <option value="risk">风险通知</option>
            <option value="billing">计费通知</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${notification.status} ${getTypeClass(notification.type)}`}
              onClick={() => handleShowDetail(notification)}
              style={{ cursor: "pointer" }}
            >
              <div className="notification-icon">{typeIcons[notification.type] || "📌"}</div>
              <div className="notification-content">
                <h3>
                  {notification.title}
                  {notification.status === "unread" && (
                    <span className="status-dot status-dot-pulse" style={{
                      display: "inline-block", width: "8px", height: "8px",
                      background: "#2563eb", borderRadius: "50%", marginLeft: "8px", verticalAlign: "middle"
                    }} />
                  )}
                </h3>
                <p>{notification.message}</p>
                <div className="notification-meta">
                  <span className={`badge ${notification.type === "error" ? "badge-danger" : notification.type === "warning" ? "badge-warning" : notification.type === "success" ? "badge-success" : "badge-info"}`}>
                    {typeNames[notification.type] || notification.type}
                  </span>
                  <span className="time">{new Date(notification.createdAt).toLocaleString()}</span>
                  {notification.readAt && (
                    <span className="read-time">已读于 {new Date(notification.readAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                {notification.status === "unread" && (
                  <button onClick={() => handleMarkAsRead(notification.id)} className="btn-secondary btn-sm">
                    标为已读
                  </button>
                )}
                <button onClick={() => handleDelete(notification.id)} className="btn-danger btn-sm">
                  删除
                </button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="empty-state">暂无通知</div>
          )}
        </div>
      )}

      {showDetailModal && selectedNotification && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">通知详情</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item detail-full">
                  <span className="detail-label">标题</span>
                  <span className="detail-value" style={{ fontSize: "16px", fontWeight: 600 }}>
                    {typeIcons[selectedNotification.type]} {selectedNotification.title}
                  </span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">类型</span>
                  <span className={`badge ${selectedNotification.type === "error" ? "badge-danger" : selectedNotification.type === "warning" ? "badge-warning" : selectedNotification.type === "success" ? "badge-success" : "badge-info"}`}>
                    {typeNames[selectedNotification.type] || selectedNotification.type}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">发送时间</span>
                  <span className="detail-value">{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">阅读状态</span>
                  <span className="detail-value">
                    {selectedNotification.status === "read" ? "已读" : "未读"}
                    {selectedNotification.readAt && ` (${new Date(selectedNotification.readAt).toLocaleString()})`}
                  </span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">完整内容</span>
                  <div className="detail-value" style={{
                    background: "#f9fafb", padding: "12px", borderRadius: "8px",
                    marginTop: "4px", lineHeight: "1.6", whiteSpace: "pre-wrap"
                  }}>
                    {selectedNotification.message}
                  </div>
                </div>
                {selectedNotification.resourceType && (
                  <div className="detail-item">
                    <span className="detail-label">关联资源类型</span>
                    <span className="detail-value">{selectedNotification.resourceType}</span>
                  </div>
                )}
                {selectedNotification.resourceId && (
                  <div className="detail-item">
                    <span className="detail-label">关联资源 ID</span>
                    <span className="detail-value mono">{selectedNotification.resourceId}</span>
                  </div>
                )}
                {selectedNotification.link && (
                  <div className="detail-item detail-full">
                    <span className="detail-label">关联操作</span>
                    <a href={selectedNotification.link} className="btn-link" style={{ fontSize: "14px" }}>
                      查看详情 →
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      )}

      {showPreferencesModal && (
        <div className="modal-overlay" onClick={() => setShowPreferencesModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">通知偏好设置</h2>
              <button className="modal-close" onClick={() => setShowPreferencesModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                选择您希望接收的通知类型。关闭某类通知后，将不再接收该类型的推送。
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {preferences.map((pref) => (
                  <div
                    key={pref.type}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", background: "#f9fafb", borderRadius: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{typeIcons[pref.type] || "📌"}</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{pref.label}</span>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        className="toggle-input"
                        checked={pref.enabled}
                        onChange={() => togglePreference(pref.type)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPreferencesModal(false)} className="btn-secondary">取消</button>
              <button onClick={savePreferences} className="btn-primary">保存设置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
