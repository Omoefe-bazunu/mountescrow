// app/(dashboard)/notifications/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notification.service";
import { format } from "date-fns";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10; // Kept small for neatness

  const loadNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getNotifications(pageNum, ITEMS_PER_PAGE);
      // Replace data instead of appending for pagination
      setNotifications(data.notifications || []);
      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notifications",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
    loadNotifications(1);
  }, [filter]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadNotifications(newPage);
    // Scroll to top of card on page change for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      toast({ title: "Success", description: "Marked as read" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Action failed",
      });
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast({ title: "Success", description: "Notification deleted" });

      // If page becomes empty after delete, go back one page
      if (notifications.length === 1 && page > 1) {
        handlePageChange(page - 1);
      } else if (notifications.length === 1 && page === 1) {
        loadNotifications(1); // Reload to potentially get new items or show empty state
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Delete failed",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "Success", description: "All marked as read" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Action failed",
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    let date;
    if (timestamp._seconds) date = new Date(timestamp._seconds * 1000);
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else if (timestamp.toDate) date = timestamp.toDate();
    else date = new Date(timestamp);
    return date && !isNaN(date) ? format(date, "MMM dd, p") : "N/A";
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const getNotificationTypeIcon = (type) => {
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
    <div className="container mx-auto p-4 max-w-full">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-gray-50/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl text-primary-blue">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filter Tabs */}
              <div className="flex bg-muted/30 p-1 rounded-lg">
                {["all", "unread", "read"].map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="flex-1 capitalize text-xs sm:text-sm"
                  >
                    {f}
                  </Button>
                ))}
              </div>

              {/* Mark All Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs bg-orange-600 text-white hover:bg-orange-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {filter === "all"
                  ? "No notifications yet."
                  : `No ${filter} notifications.`}
              </p>
            </div>
          ) : (
            <div>
              {/* List */}
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? "bg-blue-50/40" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-xl bg-white p-2 rounded-full shadow-sm border border-gray-100 block">
                          {getNotificationTypeIcon(notification.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <h4
                            className={`text-sm ${!notification.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-1 mb-3 leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-6">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs bg-primary-blue hover:bg-primary-blue/90"
                            onClick={() =>
                              (window.location.href = notification.link)
                            }
                          >
                            View
                          </Button>
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <button
                            className=" flex items-center px-2 text-xs bg-red-500 text-white hover:bg-red-700 rounded-full ml-auto sm:ml-0"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-3 w-3 " />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="w-24"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>

                <span className="text-sm font-medium text-gray-600">
                  Page {page}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasMore || loading}
                  className="w-24"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
