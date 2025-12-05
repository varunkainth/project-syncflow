import { Hono } from "hono";
import * as notificationController from "./controller";

const notifications = new Hono();

// Get all notifications
notifications.get("/", notificationController.getNotifications);

// Get unread count
notifications.get("/unread-count", notificationController.getUnreadCount);

// Mark notification as read
notifications.patch("/:id/read", notificationController.markAsRead);

// Mark all as read
notifications.patch("/mark-all-read", notificationController.markAllAsRead);

// Delete notification
notifications.delete("/:id", notificationController.deleteNotification);

export default notifications;
