// app/(dashboard)/notifications/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const { toast } = useToast();

  const loadNotifications = async (pageNum = 1, reset = false) => {
    try {
      const data = await getNotifications(pageNum, 20);
      if (reset) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
      }
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

  useEffect(() => {
    loadNotifications(1, true);
  }, [filter]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      });
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

    return date && !isNaN(date) ? format(date, "PPP") : "N/A";
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notification",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all as read",
      });
    }
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

  const getNotificationTypeLabel = (type) => {
    const labels = {
      deal: "Deal",
      proposal: "Proposal",
      wallet: "Wallet",
      transaction: "Transaction",
      milestone: "Milestone",
      dispute: "Dispute",
    };
    return labels[type] || "General";
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("unread")}
                >
                  Unread
                </Button>
                <Button
                  variant={filter === "read" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("read")}
                >
                  Read
                </Button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground mt-2">
                {filter === "all"
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications.`}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      !notification.read
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl">
                            {getNotificationTypeIcon(notification.type)}
                          </span>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = notification.link)
                              }
                            >
                              View Details
                            </Button>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      loadNotifications(nextPage);
                    }}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
