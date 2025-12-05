import { Context } from "hono";
import { NotificationService } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const notificationService = new NotificationService();

export const getNotifications = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const limit = Number.parseInt(c.req.query("limit") || "20");
    const offset = Number.parseInt(c.req.query("offset") || "0");
    const unreadOnly = c.req.query("unreadOnly") === "true";

    try {
        const notifications = await notificationService.getNotifications(user.id, limit, offset, unreadOnly);
        return jsonEncrypted(c, { notifications });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getUnreadCount = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const count = await notificationService.getUnreadCount(user.id);
        return jsonEncrypted(c, { count });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const markAsRead = async (c: Context) => {
    const user = c.get("user");
    const notificationId = c.req.param("id");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const notification = await notificationService.markAsRead(notificationId, user.id);
        return jsonEncrypted(c, { notification });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const markAllAsRead = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const result = await notificationService.markAllAsRead(user.id);
        return jsonEncrypted(c, { result });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteNotification = async (c: Context) => {
    const user = c.get("user");
    const notificationId = c.req.param("id");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const result = await notificationService.deleteNotification(notificationId, user.id);
        return c.json({ result });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
