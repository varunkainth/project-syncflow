import type { Context } from "hono";
import { TimeTrackingService } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const timeTrackingService = new TimeTrackingService();

export const startTimer = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const { taskId, description } = body;

        if (!taskId) {
            return c.json({ error: "taskId is required" }, 400);
        }

        const entry = await timeTrackingService.startTimer(taskId, user.id, description);
        return jsonEncrypted(c, { entry });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const stopTimer = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const entryId = c.req.param("entryId");
        const entry = await timeTrackingService.stopTimer(entryId, user.id);
        return jsonEncrypted(c, { entry });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getRunningTimer = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const entry = await timeTrackingService.getRunningTimer(user.id);
        return jsonEncrypted(c, { entry });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const addManualEntry = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const { taskId, startTime, endTime, description } = body;

        if (!taskId || !startTime || !endTime) {
            return c.json({ error: "taskId, startTime, and endTime are required" }, 400);
        }

        const entry = await timeTrackingService.addManualEntry(
            taskId,
            user.id,
            new Date(startTime),
            new Date(endTime),
            description
        );
        return jsonEncrypted(c, { entry });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getTaskTimeEntries = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const entries = await timeTrackingService.getTaskTimeEntries(taskId);
        const totalTime = await timeTrackingService.getTaskTotalTime(taskId);
        return jsonEncrypted(c, { entries, totalTime });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getUserTodayEntries = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const entries = await timeTrackingService.getUserTodayEntries(user.id);
        return jsonEncrypted(c, { entries });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteEntry = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const entryId = c.req.param("entryId");
        await timeTrackingService.deleteEntry(entryId, user.id);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const updateEntry = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const entryId = c.req.param("entryId");
        const body = c.get("decryptedBody") || await c.req.json();
        const { description, startTime, endTime } = body;

        const entry = await timeTrackingService.updateEntry(entryId, user.id, {
            description,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
        });
        return jsonEncrypted(c, { entry });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
