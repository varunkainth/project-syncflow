import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as analyticsController from "./controller";

const analytics = new OpenAPIHono();

const activityLogSchema = z.object({
    id: z.string(),
    action: z.string(),
    entityType: z.string(),
    createdAt: z.string(),
    metadata: z.string().nullable(),
});

const productivityStatsSchema = z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    completionRate: z.number(),
});

const projectProgressSchema = z.object({
    projectId: z.string(),
    progress: z.number(),
});

analytics.openapi(
    createRoute({
        method: "get",
        path: "/activity",
        tags: ["Analytics"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            logs: z.array(activityLogSchema),
                        }),
                    },
                },
                description: "User activity logs",
            },
        },
    }),
    analyticsController.getUserActivity
);

analytics.openapi(
    createRoute({
        method: "get",
        path: "/productivity",
        tags: ["Analytics"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            stats: productivityStatsSchema,
                        }),
                    },
                },
                description: "Productivity stats",
            },
        },
    }),
    analyticsController.getProductivityStats
);

analytics.openapi(
    createRoute({
        method: "get",
        path: "/projects/:id/progress",
        tags: ["Analytics"],
        request: {
            params: z.object({
                id: z.string().openapi({ param: { name: "id", in: "path" } }),
            }),
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            progress: projectProgressSchema,
                        }),
                    },
                },
                description: "Project progress",
            },
        },
    }),
    analyticsController.getProjectProgress
);

analytics.openapi(
    createRoute({
        method: "get",
        path: "/dashboard",
        tags: ["Analytics"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            stats: z.object({
                                totalProjects: z.number(),
                                activeTasks: z.number(),
                                completedTasks: z.number(),
                                teamMembers: z.number(),
                                overdueTasks: z.number(),
                            }),
                            recentActivity: z.array(z.any()),
                            upcomingTasks: z.array(z.any()),
                            myTasks: z.array(z.any()),
                        }),
                    },
                },
                description: "Dashboard statistics",
            },
        },
    }),
    analyticsController.getDashboardStats
);

export default analytics;

