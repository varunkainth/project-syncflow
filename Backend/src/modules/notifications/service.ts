import { db } from "../../db/index";
import { notifications } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export class NotificationService {
    async createNotification(
        userId: string,
        type: string,
        title: string,
        message: string,
        actionUrl?: string,
        entityType?: string,
        entityId?: string
    ) {
        const [notification] = await db.insert(notifications).values({
            userId,
            type,
            title,
            message,
            actionUrl,
            entityType,
            entityId,
        }).returning();

        return notification;
    }

    async getNotifications(userId: string, limit: number = 20, offset: number = 0, unreadOnly: boolean = false) {
        const where = unreadOnly
            ? and(eq(notifications.userId, userId), eq(notifications.read, false))
            : eq(notifications.userId, userId);

        const userNotifications = await db.query.notifications.findMany({
            where,
            orderBy: [desc(notifications.createdAt)],
            limit,
            offset,
        });

        return userNotifications;
    }

    async getUnreadCount(userId: string) {
        const count = await db.query.notifications.findMany({
            where: and(
                eq(notifications.userId, userId),
                eq(notifications.read, false)
            ),
        });

        return count.length;
    }

    async markAsRead(notificationId: string, userId: string) {
        const [updated] = await db.update(notifications)
            .set({ read: true })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId)
                )
            )
            .returning();

        return updated;
    }

    async markAllAsRead(userId: string) {
        await db.update(notifications)
            .set({ read: true })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.read, false)
                )
            );

        return { success: true };
    }

    async deleteNotification(notificationId: string, userId: string) {
        await db.delete(notifications).where(
            and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId)
            )
        );

        return { success: true };
    }
}
