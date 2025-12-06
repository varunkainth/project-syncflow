import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as dependencyController from "./dependency.controller";

const dependencies = new OpenAPIHono();

// Add Dependency
dependencies.openapi(
    createRoute({
        method: "post",
        path: "/",
        tags: ["Task Dependencies"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            dependentTaskId: z.string(),
                            dependsOnTaskId: z.string(),
                            type: z.enum(["blocks", "related"]).optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Dependency added",
            },
        },
    }),
    dependencyController.addDependency
);

// Remove Dependency
dependencies.openapi(
    createRoute({
        method: "delete",
        path: "/",
        tags: ["Task Dependencies"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            dependentTaskId: z.string(),
                            dependsOnTaskId: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Dependency removed",
            },
        },
    }),
    dependencyController.removeDependency
);

// Get Task Dependencies (what this task depends on)
dependencies.openapi(
    createRoute({
        method: "get",
        path: "/tasks/:taskId",
        tags: ["Task Dependencies"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({
                            dependencies: z.array(z.any()),
                            isBlocked: z.boolean(),
                            blockingTasks: z.array(z.any()),
                        }),
                    },
                },
                description: "Task dependencies",
            },
        },
    }),
    dependencyController.getTaskDependencies
);

// Get Task Dependents (what tasks depend on this task)
dependencies.openapi(
    createRoute({
        method: "get",
        path: "/tasks/:taskId/dependents",
        tags: ["Task Dependencies"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ dependents: z.array(z.any()) }),
                    },
                },
                description: "Tasks that depend on this task",
            },
        },
    }),
    dependencyController.getTaskDependents
);

// Get Project Dependencies (for visualization)
dependencies.openapi(
    createRoute({
        method: "get",
        path: "/projects/:projectId",
        tags: ["Task Dependencies"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ dependencies: z.array(z.any()) }),
                    },
                },
                description: "All dependencies in project",
            },
        },
    }),
    dependencyController.getProjectDependencies
);

export default dependencies;
