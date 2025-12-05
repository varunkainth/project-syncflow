import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "../hooks/useNotifications";
import { NotificationIcon } from "../components/NotificationIcon";

export function NotificationsPage() {
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const navigate = useNavigate();

    const { data: notifications = [], isLoading } = useNotifications(50, 0, filter === "unread");
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const handleNotificationClick = (notificationId: string, actionUrl?: string | null, read?: boolean) => {
        if (!read) {
            markAsRead.mutate(notificationId);
        }
        if (actionUrl) {
            navigate(actionUrl);
        }
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead.mutate(undefined, {
            onSuccess: () => {
                toast.success("All notifications marked as read");
            },
        });
    };

    const handleDelete = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        deleteNotification.mutate(notificationId, {
            onSuccess: () => {
                toast.success("Notification deleted");
            },
        });
    };

    const unreadNotifications = notifications.filter(n => !n.read);

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">
                    Stay updated with your project activities
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                    >
                        All {notifications.length > 0 && `(${notifications.length})`}
                    </Button>
                    <Button
                        variant={filter === "unread" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("unread")}
                    >
                        Unread {unreadNotifications.length > 0 && `(${unreadNotifications.length})`}
                    </Button>
                </div>

                {unreadNotifications.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsRead.isPending}
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            <div className="space-y-2">
                {isLoading ? (
                    <Card className="p-8">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    </Card>
                ) : notifications.length === 0 ? (
                    <Card className="p-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-muted">
                                <Bell className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">No notifications</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    {filter === "unread"
                                        ? "You're all caught up! No unread notifications."
                                        : "When you get notifications, they'll show up here."}
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${!notification.read
                                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                                : "hover:bg-accent"
                                }`}
                            onClick={() =>
                                handleNotificationClick(
                                    notification.id,
                                    notification.actionUrl,
                                    notification.read
                                )
                            }
                        >
                            <div className="flex gap-4">
                                <div className="shrink-0 mt-1">
                                    <NotificationIcon type={notification.type} />
                                </div>

                                <div className="flex-1 space-y-2 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold leading-none">
                                                {notification.title}
                                            </h4>
                                            {!notification.read && (
                                                <div className="h-2 w-2 bg-blue-600 rounded-full shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead.mutate(notification.id);
                                                    }}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={(e) => handleDelete(e, notification.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {notification.message}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
