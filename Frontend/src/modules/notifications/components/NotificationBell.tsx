import { useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { useNotifications, useUnreadCount, useMarkAsRead } from "../hooks/useNotifications";
import { NotificationIcon } from "./NotificationIcon";

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const { data: unreadCount = 0 } = useUnreadCount();
    const { data: notifications = [] } = useNotifications(5, 0, false);
    const markAsRead = useMarkAsRead();

    const handleNotificationClick = (notificationId: string, actionUrl?: string | null, read?: boolean) => {
        if (!read) {
            markAsRead.mutate(notificationId);
        }
        if (actionUrl) {
            navigate(actionUrl);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Badge variant="secondary">{unreadCount} new</Badge>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-accent cursor-pointer transition-colors ${!notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                                        }`}
                                    onClick={() => handleNotificationClick(notification.id, notification.actionUrl, notification.read)}
                                >
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            <NotificationIcon type={notification.type} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium leading-none">
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <div className="h-2 w-2 bg-blue-600 rounded-full shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                navigate("/notifications");
                                setOpen(false);
                            }}
                        >
                            View all notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
