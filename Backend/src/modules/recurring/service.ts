import { db } from "../../db/index";
import { tasks } from "../../db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    isBefore,
    isAfter,
    startOfDay,
} from "date-fns";

export type RecurrencePattern = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface RecurrenceRule {
    pattern: RecurrencePattern;
    interval: number; // e.g., every 2 weeks
    endDate?: Date;
    occurrences?: number; // max number of occurrences
}

export class RecurrenceService {
    // Parse recurrence rule from string (stored in DB)
    parseRecurrenceRule(rule: string): RecurrenceRule {
        try {
            return JSON.parse(rule) as RecurrenceRule;
        } catch {
            // Default to weekly if parsing fails
            return { pattern: "weekly", interval: 1 };
        }
    }

    // Serialize recurrence rule to string for storage
    serializeRecurrenceRule(rule: RecurrenceRule): string {
        return JSON.stringify(rule);
    }

    // Calculate the next due date based on the recurrence pattern
    calculateNextDueDate(currentDueDate: Date, rule: RecurrenceRule): Date {
        const { pattern, interval } = rule;

        switch (pattern) {
            case "daily":
                return addDays(currentDueDate, interval);
            case "weekly":
                return addWeeks(currentDueDate, interval);
            case "biweekly":
                return addWeeks(currentDueDate, 2 * interval);
            case "monthly":
                return addMonths(currentDueDate, interval);
            case "quarterly":
                return addMonths(currentDueDate, 3 * interval);
            case "yearly":
                return addYears(currentDueDate, interval);
            default:
                return addWeeks(currentDueDate, interval);
        }
    }

    // Generate the next recurring task instance
    async generateNextInstance(parentTaskId: string, userId: string) {
        // Get the parent task
        const parentTask = await db.query.tasks.findFirst({
            where: eq(tasks.id, parentTaskId),
        });

        if (!parentTask || !parentTask.recurrenceRule || !parentTask.dueDate) {
            throw new Error("Invalid recurring task");
        }

        const rule = this.parseRecurrenceRule(parentTask.recurrenceRule);
        const nextDueDate = this.calculateNextDueDate(parentTask.dueDate, rule);

        // Check if we've passed the end date
        if (rule.endDate && isAfter(nextDueDate, new Date(rule.endDate))) {
            return null; // No more instances needed
        }

        // Check recurrence end date on task
        if (parentTask.recurrenceEndDate && isAfter(nextDueDate, parentTask.recurrenceEndDate)) {
            return null;
        }

        // Create the new task instance
        const [newTask] = await db
            .insert(tasks)
            .values({
                projectId: parentTask.projectId,
                title: parentTask.title,
                description: parentTask.description,
                status: "todo",
                priority: parentTask.priority,
                assigneeId: parentTask.assigneeId,
                creatorId: userId,
                dueDate: nextDueDate,
                estimatedHours: parentTask.estimatedHours,
                parentRecurringTaskId: parentTaskId,
                // Don't copy recurrence rule to child tasks
            })
            .returning();

        // Update parent task's due date to next occurrence (for future generation)
        await db
            .update(tasks)
            .set({ dueDate: nextDueDate })
            .where(eq(tasks.id, parentTaskId));

        return newTask;
    }

    // Get all recurring task instances for a parent
    async getRecurringInstances(parentTaskId: string) {
        return await db.query.tasks.findMany({
            where: eq(tasks.parentRecurringTaskId, parentTaskId),
            orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
        });
    }

    // Create a recurring task
    async createRecurringTask(
        projectId: string,
        creatorId: string,
        data: {
            title: string;
            description?: string;
            priority?: string;
            assigneeId?: string;
            dueDate: Date;
            recurrenceRule: RecurrenceRule;
            recurrenceEndDate?: Date;
            estimatedHours?: number;
        }
    ) {
        const [task] = await db
            .insert(tasks)
            .values({
                projectId,
                creatorId,
                title: data.title,
                description: data.description,
                priority: data.priority,
                assigneeId: data.assigneeId,
                dueDate: data.dueDate,
                recurrenceRule: this.serializeRecurrenceRule(data.recurrenceRule),
                recurrenceEndDate: data.recurrenceEndDate,
                estimatedHours: data.estimatedHours,
                status: "todo",
            })
            .returning();

        return task;
    }

    // Stop recurrence (remove rule from task)
    async stopRecurrence(taskId: string) {
        await db
            .update(tasks)
            .set({
                recurrenceRule: null,
                recurrenceEndDate: null,
            })
            .where(eq(tasks.id, taskId));
    }

    // Get all active recurring tasks (for cron job or on-demand generation)
    async getActiveRecurringTasks() {
        return await db.query.tasks.findMany({
            where: and(
                isNotNull(tasks.recurrenceRule),
                sql`${tasks.status} != 'done'`
            ),
        });
    }

    // Generate instances for all overdue recurring tasks
    async generateOverdueInstances(userId: string) {
        const today = startOfDay(new Date());
        const recurringTasks = await this.getActiveRecurringTasks();

        const generatedTasks = [];

        for (const task of recurringTasks) {
            if (task.dueDate && isBefore(task.dueDate, today)) {
                // Task is overdue, generate next instance
                const newTask = await this.generateNextInstance(task.id, userId);
                if (newTask) {
                    generatedTasks.push(newTask);
                }
            }
        }

        return generatedTasks;
    }
}
