import type { Context } from "hono";
import { DependencyService, type DependencyType } from "./dependency.service";
import { jsonEncrypted } from "../../middleware/encryption";

const dependencyService = new DependencyService();

export const addDependency = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const { dependentTaskId, dependsOnTaskId, type } = body;

        if (!dependentTaskId || !dependsOnTaskId) {
            return c.json({ error: "dependentTaskId and dependsOnTaskId are required" }, 400);
        }

        await dependencyService.addDependency(
            dependentTaskId,
            dependsOnTaskId,
            (type as DependencyType) || "blocks"
        );

        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const removeDependency = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const { dependentTaskId, dependsOnTaskId } = body;

        if (!dependentTaskId || !dependsOnTaskId) {
            return c.json({ error: "dependentTaskId and dependsOnTaskId are required" }, 400);
        }

        await dependencyService.removeDependency(dependentTaskId, dependsOnTaskId);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getTaskDependencies = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const dependencies = await dependencyService.getTaskDependencies(taskId);
        const isBlocked = await dependencyService.isTaskBlocked(taskId);
        const blockingTasks = await dependencyService.getBlockingTasks(taskId);

        return jsonEncrypted(c, {
            dependencies,
            isBlocked,
            blockingTasks
        });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getTaskDependents = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const taskId = c.req.param("taskId");
        const dependents = await dependencyService.getTaskDependents(taskId);
        return jsonEncrypted(c, { dependents });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getProjectDependencies = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const projectId = c.req.param("projectId");
        const dependencies = await dependencyService.getProjectDependencies(projectId);
        return jsonEncrypted(c, { dependencies });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
