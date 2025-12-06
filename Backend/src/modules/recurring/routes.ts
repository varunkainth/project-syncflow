import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as recurringController from "./controller";

const recurring = new OpenAPIHono();

// Create Recurring Task
recurring.openapi(
    createRoute({
        method: "post",
        path: "/tasks",
        tags: ["Recurring Tasks"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            projectId: z.string(),
                            title: z.string(),
                            description: z.string().optional(),
                            priority: z.string().optional(),
                            assigneeId: z.string().optional(),
                            dueDate: z.string(),
                            recurrenceRule: z.object({
                                pattern: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
                                interval: z.number().default(1),
                                endDate: z.string().optional(),
                                occurrences: z.number().optional(),
                            }),
                            recurrenceEndDate: z.string().optional(),
                            estimatedHours: z.number().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ task: z.any() }),
                    },
                },
                description: "Recurring task created",
            },
        },
    }),
    recurringController.createRecurringTask
);

// Generate Next Instance
recurring.openapi(
    createRoute({
        method: "post",
        path: "/tasks/:taskId/generate",
        tags: ["Recurring Tasks"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ task: z.any().nullable(), message: z.string().optional() }),
                    },
                },
                description: "Next recurring instance generated",
            },
        },
    }),
    recurringController.generateNextInstance
);

// Get Recurring Instances
recurring.openapi(
    createRoute({
        method: "get",
        path: "/tasks/:taskId/instances",
        tags: ["Recurring Tasks"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ instances: z.array(z.any()) }),
                    },
                },
                description: "Recurring task instances",
            },
        },
    }),
    recurringController.getRecurringInstances
);

// Stop Recurrence
recurring.openapi(
    createRoute({
        method: "post",
        path: "/tasks/:taskId/stop",
        tags: ["Recurring Tasks"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Recurrence stopped",
            },
        },
    }),
    recurringController.stopRecurrence
);

// Generate Overdue Instances (bulk operation)
recurring.openapi(
    createRoute({
        method: "post",
        path: "/generate-overdue",
        tags: ["Recurring Tasks"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            generatedTasks: z.array(z.any()),
                            count: z.number()
                        }),
                    },
                },
                description: "Overdue recurring instances generated",
            },
        },
    }),
    recurringController.generateOverdueInstances
);

export default recurring;
