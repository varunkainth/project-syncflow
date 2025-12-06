import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as calendarController from "./controller";

const calendar = new OpenAPIHono();

calendar.openapi(
    createRoute({
        method: "get",
        path: "/ical",
        tags: ["Calendar"],
        responses: {
            200: {
                content: {
                    "text/calendar": {
                        schema: z.string(),
                    },
                },
                description: "iCal file",
            },
        },
    }),
    calendarController.getICal
);

// Single task iCal export
calendar.openapi(
    createRoute({
        method: "get",
        path: "/ical/tasks/:taskId",
        tags: ["Calendar"],
        responses: {
            200: {
                content: {
                    "text/calendar": {
                        schema: z.string(),
                    },
                },
                description: "iCal file for single task",
            },
        },
    }),
    calendarController.getTaskICal
);

calendar.openapi(
    createRoute({
        method: "get",
        path: "/tasks",
        tags: ["Calendar"],
        request: {
            query: z.object({
                startDate: z.string().describe("Start date in ISO format"),
                endDate: z.string().describe("End date in ISO format"),
                projectId: z.string().optional().describe("Filter by project ID"),
            }),
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            tasks: z.array(z.any()),
                        }),
                    },
                },
                description: "Tasks for the date range",
            },
        },
    }),
    calendarController.getTasksForDateRange
);

calendar.openapi(
    createRoute({
        method: "get",
        path: "/google/connect",
        tags: ["Calendar"],
        responses: {
            302: {
                description: "Redirect to Google Auth",
            },
        },
    }),
    calendarController.connectGoogle
);

calendar.openapi(
    createRoute({
        method: "post",
        path: "/google/sync",
        tags: ["Calendar"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            code: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            count: z.number(),
                        }),
                    },
                },
                description: "Sync successful",
            },
        },
    }),
    calendarController.syncGoogle
);

export default calendar;

