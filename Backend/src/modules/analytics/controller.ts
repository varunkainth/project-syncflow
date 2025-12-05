import type { Context } from "hono";
import { AnalyticsService } from "./service";
import { jsonEncrypted } from "../../middleware/encryption";

const analyticsService = new AnalyticsService();

export const getUserActivity = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const logs = await analyticsService.getUserActivity(user.id);
        return jsonEncrypted(c, { logs });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getProductivityStats = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const stats = await analyticsService.getProductivityStats(user.id);
        return jsonEncrypted(c, { stats });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getProjectProgress = async (c: Context) => {
    const projectId = c.req.param("id");
    // TODO: Check if user is member of project
    try {
        const progress = await analyticsService.getProjectProgress(projectId);
        return jsonEncrypted(c, { progress });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const getDashboardStats = async (c: Context) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
        const dashboard = await analyticsService.getDashboardStats(user.id);
        return jsonEncrypted(c, dashboard);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
