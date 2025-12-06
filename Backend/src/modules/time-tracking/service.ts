import { db } from "../../db/index";
import { timeEntries, tasks } from "../../db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export class TimeTrackingService {
    // Start a new time entry (timer)
    async startTimer(taskId: string, userId: string, description?: string) {
        // Check for any running timers and stop them first
        const runningTimer = await this.getRunningTimer(userId);
        if (runningTimer) {
            await this.stopTimer(runningTimer.id, userId);
        }

        const [entry] = await db
            .insert(timeEntries)
            .values({
                taskId,
                userId,
                description,
                startTime: new Date(),
            })
            .returning();

        return entry;
    }

    // Stop a running timer
    async stopTimer(entryId: string, userId: string) {
        const entry = await db.query.timeEntries.findFirst({
            where: and(
                eq(timeEntries.id, entryId),
                eq(timeEntries.userId, userId),
                isNull(timeEntries.endTime)
            ),
        });

        if (!entry) {
            throw new Error("No running timer found");
        }

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

        const [updatedEntry] = await db
            .update(timeEntries)
            .set({
                endTime,
                duration,
            })
            .where(eq(timeEntries.id, entryId))
            .returning();

        return updatedEntry;
    }

    // Get the current running timer for a user
    async getRunningTimer(userId: string) {
        return await db.query.timeEntries.findFirst({
            where: and(
                eq(timeEntries.userId, userId),
                isNull(timeEntries.endTime)
            ),
            with: {
                task: { columns: { id: true, title: true, projectId: true } },
            },
        });
    }

    // Add a manual time entry
    async addManualEntry(
        taskId: string,
        userId: string,
        startTime: Date,
        endTime: Date,
        description?: string
    ) {
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        if (duration <= 0) {
            throw new Error("End time must be after start time");
        }

        const [entry] = await db
            .insert(timeEntries)
            .values({
                taskId,
                userId,
                description,
                startTime,
                endTime,
                duration,
                isManual: true,
            })
            .returning();

        return entry;
    }

    // Get all time entries for a task
    async getTaskTimeEntries(taskId: string) {
        return await db.query.timeEntries.findMany({
            where: eq(timeEntries.taskId, taskId),
            with: {
                user: { columns: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: [desc(timeEntries.startTime)],
        });
    }

    // Get total time spent on a task (in seconds)
    async getTaskTotalTime(taskId: string) {
        const entries = await db.query.timeEntries.findMany({
            where: and(
                eq(timeEntries.taskId, taskId),
                // Only count completed entries
                eq(timeEntries.endTime, null) === false
            ),
        });

        return entries.reduce((total, entry) => total + (entry.duration || 0), 0);
    }

    // Get user's time entries for today
    async getUserTodayEntries(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entries = await db.query.timeEntries.findMany({
            where: eq(timeEntries.userId, userId),
            with: {
                task: { columns: { id: true, title: true, projectId: true } },
            },
            orderBy: [desc(timeEntries.startTime)],
        });

        return entries.filter((entry) => entry.startTime >= today);
    }

    // Delete a time entry
    async deleteEntry(entryId: string, userId: string) {
        const entry = await db.query.timeEntries.findFirst({
            where: and(
                eq(timeEntries.id, entryId),
                eq(timeEntries.userId, userId)
            ),
        });

        if (!entry) {
            throw new Error("Time entry not found or not authorized");
        }

        await db.delete(timeEntries).where(eq(timeEntries.id, entryId));

        return { success: true };
    }

    // Update a time entry
    async updateEntry(
        entryId: string,
        userId: string,
        data: { description?: string; startTime?: Date; endTime?: Date }
    ) {
        const entry = await db.query.timeEntries.findFirst({
            where: and(
                eq(timeEntries.id, entryId),
                eq(timeEntries.userId, userId)
            ),
        });

        if (!entry) {
            throw new Error("Time entry not found or not authorized");
        }

        const updateData: any = {};
        if (data.description !== undefined) updateData.description = data.description;
        if (data.startTime) updateData.startTime = data.startTime;
        if (data.endTime) updateData.endTime = data.endTime;

        // Recalculate duration if times changed
        if (data.startTime || data.endTime) {
            const start = data.startTime || entry.startTime;
            const end = data.endTime || entry.endTime;
            if (start && end) {
                updateData.duration = Math.floor((end.getTime() - start.getTime()) / 1000);
            }
        }

        const [updatedEntry] = await db
            .update(timeEntries)
            .set(updateData)
            .where(eq(timeEntries.id, entryId))
            .returning();

        return updatedEntry;
    }
}
