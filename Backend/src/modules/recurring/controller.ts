import type { Context } from "hono";
import { RecurrenceService, type RecurrenceRule } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const recurrenceService = new RecurrenceService();

export const createRecurringTask = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const { projectId, title, description, priority, assigneeId, dueDate, recurrenceRule, recurrenceEndDate, estimatedHours } = body;

        if (!projectId || !title || !dueDate || !recurrenceRule) {
            return c.json({ error: "projectId, title, dueDate, and recurrenceRule are required" }, 400);
        }

        const task = await recurrenceService.createRecurringTask(projectId, user.id, {
            title,
            description,
            priority,
            assigneeId,
            dueDate: new Date(dueDate),
            recurrenceRule: recurrenceRule as RecurrenceRule,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
            estimatedHours,
        });

        return jsonEncrypted(c, { task });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const generateNextInstance = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const task = await recurrenceService.generateNextInstance(taskId, user.id);

        if (!task) {
            return jsonEncrypted(c, { task: null, message: "No more instances needed (end date reached)" });
        }

        return jsonEncrypted(c, { task });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getRecurringInstances = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const instances = await recurrenceService.getRecurringInstances(taskId);
        return jsonEncrypted(c, { instances });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const stopRecurrence = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        await recurrenceService.stopRecurrence(taskId);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const generateOverdueInstances = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const tasks = await recurrenceService.generateOverdueInstances(user.id);
        return jsonEncrypted(c, { generatedTasks: tasks, count: tasks.length });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
