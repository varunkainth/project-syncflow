import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as labelController from "./controller";

const labels = new OpenAPIHono();

// Create Label
labels.openapi(
    createRoute({
        method: "post",
        path: "/",
        tags: ["Labels"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            projectId: z.string(),
                            name: z.string(),
                            color: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ label: z.any() }),
                    },
                },
                description: "Label created",
            },
        },
    }),
    labelController.createLabel
);

// Get Project Labels
labels.openapi(
    createRoute({
        method: "get",
        path: "/project/:projectId",
        tags: ["Labels"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ labels: z.array(z.any()) }),
                    },
                },
                description: "Project labels",
            },
        },
    }),
    labelController.getProjectLabels
);

// Update Label
labels.openapi(
    createRoute({
        method: "patch",
        path: "/:labelId",
        tags: ["Labels"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            name: z.string().optional(),
                            color: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ label: z.any() }),
                    },
                },
                description: "Label updated",
            },
        },
    }),
    labelController.updateLabel
);

// Delete Label
labels.openapi(
    createRoute({
        method: "delete",
        path: "/:labelId",
        tags: ["Labels"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Label deleted",
            },
        },
    }),
    labelController.deleteLabel
);

// Get Task Labels
labels.openapi(
    createRoute({
        method: "get",
        path: "/tasks/:taskId",
        tags: ["Labels"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ labels: z.array(z.any()) }),
                    },
                },
                description: "Task labels",
            },
        },
    }),
    labelController.getTaskLabels
);

// Assign Label to Task
labels.openapi(
    createRoute({
        method: "post",
        path: "/tasks/:taskId/labels/:labelId",
        tags: ["Labels"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Label assigned",
            },
        },
    }),
    labelController.assignLabelToTask
);

// Remove Label from Task
labels.openapi(
    createRoute({
        method: "delete",
        path: "/tasks/:taskId/labels/:labelId",
        tags: ["Labels"],
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: z.object({ success: z.boolean() }),
                    },
                },
                description: "Label removed",
            },
        },
    }),
    labelController.removeLabelFromTask
);

// Set Task Labels (replace all)
labels.openapi(
    createRoute({
        method: "put",
        path: "/tasks/:taskId",
        tags: ["Labels"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            labelIds: z.array(z.string()),
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
                description: "Task labels set",
            },
        },
    }),
    labelController.setTaskLabels
);

export default labels;
