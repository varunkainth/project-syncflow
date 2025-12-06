import type { Context } from "hono";
import { LabelService } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const labelService = new LabelService();

export const createLabel = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const { projectId, name, color } = body;

        if (!projectId || !name || !color) {
            return c.json({ error: "projectId, name, and color are required" }, 400);
        }

        const label = await labelService.createLabel(projectId, name, color);
        return jsonEncrypted(c, { label });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getProjectLabels = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const projectId = c.req.param("projectId");
        const labels = await labelService.getProjectLabels(projectId);
        return jsonEncrypted(c, { labels });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const updateLabel = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const labelId = c.req.param("labelId");
        const body = c.get("decryptedBody") || await c.req.json();
        const { name, color } = body;

        const label = await labelService.updateLabel(labelId, { name, color });
        return jsonEncrypted(c, { label });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const deleteLabel = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const labelId = c.req.param("labelId");
        await labelService.deleteLabel(labelId);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getTaskLabels = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const labels = await labelService.getTaskLabels(taskId);
        return jsonEncrypted(c, { labels });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const assignLabelToTask = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const labelId = c.req.param("labelId");
        await labelService.assignLabelToTask(taskId, labelId);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const removeLabelFromTask = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const labelId = c.req.param("labelId");
        await labelService.removeLabelFromTask(taskId, labelId);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const setTaskLabels = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const body = c.get("decryptedBody") || await c.req.json();
        const { labelIds } = body;

        await labelService.setTaskLabels(taskId, labelIds || []);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
