import { Hono } from "hono";
import * as authController from "./controller";
import { authMiddleware } from "../../middleware/auth";

const auth = new Hono();

// Public routes
auth.post("/signup", authController.signup);
auth.post("/login", authController.login);
auth.post("/refresh", authController.refresh);
auth.post("/logout", authController.logout);

// Email verification
auth.get("/verify-email", authController.verifyEmail);
auth.post("/resend-verification", authController.resendVerification);

// Password reset
auth.post("/forgot-password", authController.requestPasswordReset);
auth.post("/reset-password", authController.resetPassword);

// OAuth
auth.get("/google", authController.googleAuth);
auth.get("/google/callback", authController.googleCallback);
auth.get("/github", authController.githubAuth);
auth.get("/github/callback", authController.githubCallback);
auth.post("/oauth/exchange", authController.exchangeOAuthCode);

// Cleanup (for cron jobs)
auth.post("/cleanup-tokens", authController.cleanupTokens);

// Protected routes
auth.get("/me", authMiddleware, authController.me);
auth.put("/profile", authMiddleware, authController.updateProfile);
auth.put("/password", authMiddleware, authController.changePassword);
auth.post("/set-password", authMiddleware, authController.setPassword);
auth.delete("/account", authMiddleware, authController.deleteAccount);

// 2FA
auth.post("/2fa/generate", authMiddleware, authController.generate2fa);
auth.post("/2fa/verify", authMiddleware, authController.verify2fa);
auth.post("/2fa/disable", authMiddleware, authController.disable2fa);

// Session management
auth.get("/sessions", authMiddleware, authController.getSessions);
auth.delete("/sessions/:sessionId", authMiddleware, authController.revokeSession);
auth.delete("/sessions", authMiddleware, authController.revokeAllSessions);

// Audit logs
auth.get("/audit-logs", authMiddleware, authController.getAuditLogs);

// OAuth account linking
auth.get("/linked-accounts", authMiddleware, authController.getLinkedAccounts);
auth.delete("/linked-accounts/:provider", authMiddleware, authController.unlinkOAuthAccount);

export default auth;
