import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  status: "read" | "unread";
  createdAt: string;
  readAt?: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all" as "all" | "read" | "unread");

  const typeNames = { info: "信息", warning: "警告", error: "错误", success: "成功" };
  const typeIcons = { info: "ℹ️", warning: "⚠️", error: "❌", success: "✅" };

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const response = await api.get(`/notifications${params}`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

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

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>通知管理</h1>
        <div className="header-actions">
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

      <div className="filter-bar">
        <div className="filter-group">
          <label>状态</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">全部</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
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
              className={`notification-card ${notification.status} ${notification.type}`}
            >
              <div className="notification-icon">{typeIcons[notification.type]}</div>
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <div className="notification-meta">
                  <span className="type-tag">{typeNames[notification.type]}</span>
                  <span className="time">{new Date(notification.createdAt).toLocaleString()}</span>
                  {notification.readAt && (
                    <span className="read-time">已读于 {new Date(notification.readAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="notification-actions">
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
    </div>
  );
}