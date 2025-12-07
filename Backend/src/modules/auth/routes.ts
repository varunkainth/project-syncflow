import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Hono } from "hono";
import * as authController from "./controller";
import { signupSchema, loginSchema, verify2faSchema, userSchema } from "./schema";
import { encryptedSchema } from "../shared/schema";
import { authMiddleware } from "../../middleware/auth";

const auth = new Hono();

// Use regular Hono routes for encrypted endpoints to bypass OpenAPI validation
auth.post("/signup", authController.signup);
auth.post("/login", authController.login);
auth.post("/refresh", authController.refresh);
auth.post("/logout", authController.logout);
auth.get("/me", authMiddleware, authController.me);

// Profile routes
auth.put("/profile", authMiddleware, authController.updateProfile);
auth.put("/password", authMiddleware, authController.changePassword);
auth.delete("/account", authMiddleware, authController.deleteAccount);

// Password Reset routes
auth.post("/forgot-password", authController.requestPasswordReset);
auth.post("/reset-password", authController.resetPassword);

// 2FA routes
auth.post("/2fa/generate", authMiddleware, authController.generate2fa);
auth.post("/2fa/verify", authMiddleware, authController.verify2fa);
auth.post("/2fa/disable", authMiddleware, authController.disable2fa);

// OAuth (Standard Hono routes for now as they are redirects/callbacks)
auth.get("/google", authController.googleAuth);
auth.get("/google/callback", authController.googleCallback);
auth.get("/github", authController.githubAuth);
auth.get("/github/callback", authController.githubCallback);
auth.post("/set-tokens", authController.setTokens);

export default auth;

