import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as timeTrackingController from "./controller";

const timeTracking = new OpenAPIHono();

// Start Timer
timeTracking.openapi(
    createRoute({
        method: "post",
        path: "/timer/start",
        tags: ["Time Tracking"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            taskId: z.string(),
                            description: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ entry: z.any() }),
                    },
                },
                description: "Timer started",
            },
        },
    }),
    timeTrackingController.startTimer
);

// Stop Timer
timeTracking.openapi(
    createRoute({
        method: "post",
        path: "/timer/:entryId/stop",
        tags: ["Time Tracking"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ entry: z.any() }),
                    },
                },
                description: "Timer stopped",
            },
        },
    }),
    timeTrackingController.stopTimer
);

// Get Running Timer
timeTracking.openapi(
    createRoute({
        method: "get",
        path: "/timer/running",
        tags: ["Time Tracking"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ entry: z.any().nullable() }),
                    },
                },
                description: "Running timer or null",
            },
        },
    }),
    timeTrackingController.getRunningTimer
);

// Add Manual Entry
timeTracking.openapi(
    createRoute({
        method: "post",
        path: "/entries",
        tags: ["Time Tracking"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            taskId: z.string(),
                            startTime: z.string(),
                            endTime: z.string(),
                            description: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ entry: z.any() }),
                    },
                },
                description: "Manual entry added",
            },
        },
    }),
    timeTrackingController.addManualEntry
);

// Get Task Time Entries
timeTracking.openapi(
    createRoute({
        method: "get",
        path: "/tasks/:taskId",
        tags: ["Time Tracking"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            entries: z.array(z.any()),
                            totalTime: z.number(),
                        }),
                    },
                },
                description: "Task time entries",
            },
        },
    }),
    timeTrackingController.getTaskTimeEntries
);

// Get User Today Entries
timeTracking.openapi(
    createRoute({
        method: "get",
        path: "/today",
        tags: ["Time Tracking"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ entries: z.array(z.any()) }),
                    },
                },
                description: "User's today time entries",
            },
        },
    }),
    timeTrackingController.getUserTodayEntries
);

// Delete Entry
timeTracking.openapi(
    createRoute({
        method: "delete",
        path: "/entries/:entryId",
        tags: ["Time Tracking"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Entry deleted",
            },
        },
    }),
    timeTrackingController.deleteEntry
);

// Update Entry
timeTracking.openapi(
    createRoute({
        method: "patch",
        path: "/entries/:entryId",
        tags: ["Time Tracking"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            description: z.string().optional(),
                            startTime: z.string().optional(),
                            endTime: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ entry: z.any() }),
                    },
                },
                description: "Entry updated",
            },
        },
    }),
    timeTrackingController.updateEntry
);

export default timeTracking;
