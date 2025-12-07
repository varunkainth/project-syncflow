import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { encryptionMiddleware, jsonEncrypted } from "./middleware/encryption";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { websocketHandler } from "./modules/chat/gateway";

// Routes
import authRoutes from "./modules/auth/routes";
import rbacRoutes from "./modules/rbac/routes";
import projectRoutes from "./modules/projects/routes";
import taskRoutes from "./modules/tasks/routes";
import analyticsRoutes from "./modules/analytics/routes";
import calendarRoutes from "./modules/calendar/routes";
import notificationRoutes from "./modules/notifications/routes";
import uploadRoutes from "./modules/upload/routes";
import timeTrackingRoutes from "./modules/time-tracking/routes";
import labelRoutes from "./modules/labels/routes";
import recurringRoutes from "./modules/recurring/routes";
import dependencyRoutes from "./modules/tasks/dependency.routes";
console.time("Loading API");

const app = new OpenAPIHono();

// Documentation
app.doc("/doc", {
    openapi: "3.0.0",
    info: {
        version: "1.0.0",
        title: "SyncFlow API",
    },
});

app.get(
    "/ui",
    apiReference({
        url: "/doc",
    })
);

// WebSocket Setup
const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket<any>>();

// Global Middleware
console.time("Loading Middleware");

app.use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://192.168.1.13:5173", "http://192.168.1.13:5174", "https://project-syncflow.vercel.app"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
}));
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", encryptionMiddleware);
app.use("*", rateLimitMiddleware);

// CORS Preflight

app.options("*", cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://192.168.1.13:5173", "http://192.168.1.13:5174", "https://project-syncflow.vercel.app"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}))

app.options("*", (c) => {
    return new Response(null, { status: 204 })
})

// Health Check
app.get("/health", (c) => {
    return c.json({ status: "ok", uptime: process.uptime() });
});

// Encrypted Response Example
app.get("/secure-health", (c) => {
    return jsonEncrypted(c, { status: "secure-ok", secret: "hidden" });
});

console.timeEnd("Loading Middleware")

console.time("Importing Modules")
// Mount Routes
app.route("/auth", authRoutes);

// Protected Routes
app.use("/projects/*", authMiddleware);
app.use("/tasks/*", authMiddleware);
app.use("/rbac/*", authMiddleware);
app.use("/analytics/*", authMiddleware);
app.use("/calendar/*", authMiddleware);
app.use("/notifications/*", authMiddleware);
app.use("/upload/*", authMiddleware);
app.use("/time-tracking/*", authMiddleware);
app.use("/labels/*", authMiddleware);
app.use("/recurring/*", authMiddleware);
app.use("/dependencies/*", authMiddleware);

app.route("/rbac", rbacRoutes);
app.route("/projects", projectRoutes);
app.route("/tasks", taskRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/calendar", calendarRoutes);
app.route("/notifications", notificationRoutes);
app.route("/upload", uploadRoutes);
app.route("/time-tracking", timeTrackingRoutes);
app.route("/labels", labelRoutes);
app.route("/recurring", recurringRoutes);
app.route("/dependencies", dependencyRoutes);

console.timeEnd("Mounting Routes")

console.time("Loading Websocket")
// WebSocket Route
app.get("/ws", upgradeWebSocket((c) => {
    return {
        onOpen: (evt, ws) => websocketHandler.open(ws.raw as ServerWebSocket<any>),
        onMessage: (evt, ws) => websocketHandler.message(ws.raw as ServerWebSocket<any>, evt.data),
        onClose: (evt, ws) => websocketHandler.close(ws.raw as ServerWebSocket<any>),
    };
}));

console.timeEnd("Loading Websocket")

export default {
    port: process.env.PORT || 3000,
    fetch: app.fetch,
    websocket,
};

console.timeEnd("Loading API");
