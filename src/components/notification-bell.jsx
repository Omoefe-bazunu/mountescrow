"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns"; // Ensure this is imported
import {
  getNotifications,
  getNotificationCount,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from "@/services/notification.service";

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(1, 10);
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error loading notifications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const data = await getNotificationCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("❌ Error loading notification count:", err);
    }
  };

  useEffect(() => {
    loadNotificationCount();
    // Auto-refresh unread count every 30 seconds
    const interval = setInterval(() => {
      loadNotificationCount();
      if (dropdownOpen) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dropdownOpen]);

  // Load notifications list when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      loadNotifications();
    }
  }, [dropdownOpen]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (!notifications.find((n) => n.id === notificationId)?.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    let date;
    if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    // Using "MMM dd, p" for shorter format in dropdowns (e.g. "Oct 24, 2:30 PM")
    return date && !isNaN(date) ? format(date, "MMM dd, p") : "N/A";
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
            <span className="font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <Check className="h-3 w-3 inline mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
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
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => {
                      router.push(notification.link || "/notifications");
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {/* FIXED: changed createAt to createdAt */}
                          <p className="text-[10px] text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={(e) =>
                              handleMarkAsRead(notification.id, e)
                            }
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
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
            <button
              onClick={() => {
                router.push("/notifications");
                setDropdownOpen(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
