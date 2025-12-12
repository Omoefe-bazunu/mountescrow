import { useState, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      console.log("🔄 Loading notifications...");
      const response = await fetch("/api/notifications?page=1&limit=10", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Notifications loaded:", data);

      setNotifications(data.notifications || []);
      setError(null);
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      console.log("🔄 Loading notification count...");
      const response = await fetch("/api/notifications/count", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Notification count:", data);

      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("❌ Error loading notification count:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadNotificationCount();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotificationCount();
      if (dropdownOpen) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dropdownOpen]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      deal: "🤝",
      proposal: "📄",
      wallet: "💰",
      transaction: "💳",
      milestone: "🎯",
      dispute: "⚖️",
    };
    return icons[type] || "🔔";
  };

  function getCsrfToken() {
    const cookies = document.cookie.split("; ");
    const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
    return csrfCookie ? csrfCookie.split("=")[1] : null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative p-2 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                <Check className="h-3 w-3 inline mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500 mb-2">Error: {error}</p>
                <button
                  onClick={loadNotifications}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => (window.location.href = notification.link)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString()}{" "}
                            •{" "}
                            {new Date(
                              notification.createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={(e) =>
                              handleMarkAsRead(notification.id, e)
                            }
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-3 text-center">
            <a
              href="/notifications"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded max-w-xs">
          <div>Unread: {unreadCount}</div>
          <div>Total: {notifications.length}</div>
          <div>Loading: {loading ? "Yes" : "No"}</div>
          {error && <div className="text-red-400">Error: {error}</div>}
        </div>
      )}
    </div>
  );
}
