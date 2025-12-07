import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { AuthService } from "./service";
import { signupSchema, loginSchema, verify2faSchema } from "./schema";
import { jsonEncrypted } from "../../middleware/encryption";
import { getGoogleAuthURL, getGoogleUser, getGithubAuthURL, getGithubUser } from "./oauth";
import { CacheService } from "../../common/cache.service";

const authService = new AuthService();
const cacheService = new CacheService();

// Helper to extract request info
const getRequestInfo = (c: Context) => ({
    ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    userAgent: c.req.header("user-agent") || "unknown",
});

export const signup = async (c: Context) => {
    try {
        const body = c.get("decryptedBody");
        if (!body) return c.json({ error: "Invalid encrypted payload" }, 400);

        const result = signupSchema.safeParse(body);
        if (!result.success) return c.json({ error: result.error.issues }, 400);

        const requestInfo = getRequestInfo(c);
        const user = await authService.signup(result.data, requestInfo);
        const data = await authService.generateTokens(user, requestInfo);

        setCookie(c, "accessToken", data.accessToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 15, path: "/",
        });
        setCookie(c, "refreshToken", data.refreshToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 60 * 24 * 7, path: "/",
        });

        return jsonEncrypted(c, { user: data.user }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const login = async (c: Context) => {
    try {
        const body = c.get("decryptedBody");
        if (!body) return c.json({ error: "Invalid encrypted payload" }, 400);

        const result = loginSchema.safeParse(body);
        if (!result.success) return c.json({ error: result.error.issues }, 400);

        const requestInfo = getRequestInfo(c);
        const data = await authService.login(result.data, requestInfo);

        if ('require2fa' in data && data.require2fa) {
            return jsonEncrypted(c, { require2fa: true }, 200);
        }

        const tokenData = data as any;
        setCookie(c, "accessToken", tokenData.accessToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 15, path: "/",
        });
        setCookie(c, "refreshToken", tokenData.refreshToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 60 * 24 * 7, path: "/",
        });

        return jsonEncrypted(c, { user: tokenData.user }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 401);
    }
};

export const refresh = async (c: Context) => {
    try {
        const refreshToken = getCookie(c, "refreshToken");
        if (!refreshToken) return c.json({ error: "Refresh token is required" }, 401);

        const requestInfo = getRequestInfo(c);
        const data = await authService.refreshAccessToken(refreshToken, requestInfo);

        setCookie(c, "accessToken", data.accessToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 15, path: "/",
        });
        setCookie(c, "refreshToken", data.refreshToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 60 * 24 * 7, path: "/",
        });

        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 401);
    }
};

export const logout = async (c: Context) => {
    deleteCookie(c, "accessToken");
    deleteCookie(c, "refreshToken");
    return c.json({ success: true });
};

export const me = async (c: Context) => {
    try {
        const user = await authService.me(c.get("user")!.id);
        return jsonEncrypted(c, { user }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 401);
    }
};

// Email Verification
export const verifyEmail = async (c: Context) => {
    try {
        const { token } = c.req.query();
        if (!token) return c.json({ error: "Token required" }, 400);

        await authService.verifyEmail(token);
        return jsonEncrypted(c, { success: true, message: "Email verified successfully" }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const resendVerification = async (c: Context) => {
    try {
        const body = c.get("decryptedBody") || await c.req.json();
        if (!body.email) return c.json({ error: "Email required" }, 400);

        await authService.resendVerificationEmail(body.email);
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

// 2FA
export const generate2fa = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const secret = await authService.generate2faSecret(user.id);
        return jsonEncrypted(c, { 
            secret, 
            otpauth: `otpauth://totp/SyncFlow:${user.email}?secret=${secret}&issuer=SyncFlow` 
        });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const verify2fa = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const body = c.get("decryptedBody") || await c.req.json();
        const result = verify2faSchema.safeParse(body);
        if (!result.success) return c.json({ error: result.error }, 400);

        const requestInfo = getRequestInfo(c);
        const isValid = await authService.verify2fa(user.id, result.data.code, requestInfo);
        if (!isValid) return c.json({ error: "Invalid code" }, 400);

        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const disable2fa = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const requestInfo = getRequestInfo(c);
        await authService.disable2fa(user.id, requestInfo);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

// Session Management
export const getSessions = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const sessions = await authService.getSessions(user.id);
        return jsonEncrypted(c, { sessions }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const revokeSession = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const sessionId = c.req.param("sessionId");
        if (!sessionId) return c.json({ error: "Session ID required" }, 400);
        
        const requestInfo = getRequestInfo(c);
        await authService.revokeSession(user.id, sessionId, requestInfo);
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const revokeAllSessions = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const requestInfo = getRequestInfo(c);
        await authService.revokeAllSessions(user.id, undefined, requestInfo);

        deleteCookie(c, "accessToken");
        deleteCookie(c, "refreshToken");
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

// Audit Logs
export const getAuditLogs = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const logs = await authService.getAuditLogs(user.id);
        return jsonEncrypted(c, { logs }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

// OAuth Account Linking
export const getLinkedAccounts = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const accounts = await authService.getLinkedAccounts(user.id);
        return jsonEncrypted(c, { accounts }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const unlinkOAuthAccount = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const provider = c.req.param("provider");
        if (!provider) return c.json({ error: "Provider required" }, 400);
        
        const requestInfo = getRequestInfo(c);
        await authService.unlinkOAuthAccount(user.id, provider, requestInfo);
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

// OAuth Routes
export const googleAuth = (c: Context) => c.redirect(getGoogleAuthURL());

export const googleCallback = async (c: Context) => {
    const code = c.req.query("code");
    if (!code) return c.json({ error: "No code provided" }, 400);

    try {
        const googleUser = await getGoogleUser(code);
        const requestInfo = getRequestInfo(c);
        const data = await authService.oauthLogin({
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            id: googleUser.id,
            provider: "google",
        }, requestInfo);

        const tokenData = data as any;
        
        // Store tokens in cache with short-lived code
        const oauthCode = crypto.randomUUID();
        await cacheService.set(`oauth:${oauthCode}`, {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
        }, 60); // 60 seconds TTL

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return c.redirect(`${frontendUrl}/auth/oauth-callback?code=${oauthCode}`);
    } catch (error: any) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return c.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error.message)}`);
    }
};

export const githubAuth = (c: Context) => c.redirect(getGithubAuthURL());

export const githubCallback = async (c: Context) => {
    const code = c.req.query("code");
    if (!code) return c.json({ error: "No code provided" }, 400);

    try {
        const githubUser = await getGithubUser(code);
        const requestInfo = getRequestInfo(c);
        const data = await authService.oauthLogin({
            email: githubUser.email,
            name: githubUser.name || githubUser.login,
            avatar_url: githubUser.avatar_url,
            id: githubUser.id.toString(),
            provider: "github",
        }, requestInfo);

        const tokenData = data as any;
        
        // Store tokens in cache with short-lived code
        const oauthCode = crypto.randomUUID();
        await cacheService.set(`oauth:${oauthCode}`, {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
        }, 60);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return c.redirect(`${frontendUrl}/auth/oauth-callback?code=${oauthCode}`);
    } catch (error: any) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return c.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error.message)}`);
    }
};

export const exchangeOAuthCode = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { code } = body;

        if (!code) return c.json({ error: "Code required" }, 400);

        const tokens = await cacheService.get<{ accessToken: string; refreshToken: string }>(`oauth:${code}`);
        if (!tokens) return c.json({ error: "Invalid or expired code" }, 400);

        // Delete the code after use
        await cacheService.del(`oauth:${code}`);

        setCookie(c, "accessToken", tokens.accessToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 15, path: "/",
        });
        setCookie(c, "refreshToken", tokens.refreshToken, {
            httpOnly: true, secure: true, sameSite: "None", maxAge: 60 * 60 * 24 * 7, path: "/",
        });

        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

// Profile
export const updateProfile = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const body = c.get("decryptedBody");
        if (!body) return c.json({ error: "Invalid encrypted payload" }, 400);

        const updatedUser = await authService.updateProfile(user.id, {
            name: body.name,
            bio: body.bio,
            phoneNumber: body.phoneNumber,
            avatarUrl: body.avatarUrl,
        });

        return jsonEncrypted(c, { user: updatedUser }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const changePassword = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const body = c.get("decryptedBody");
        if (!body || !body.currentPassword || !body.newPassword) {
            return c.json({ error: "Current password and new password are required" }, 400);
        }

        const requestInfo = getRequestInfo(c);
        await authService.changePassword(user.id, body.currentPassword, body.newPassword, requestInfo);
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const setPassword = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const body = c.get("decryptedBody");
        if (!body || !body.newPassword) {
            return c.json({ error: "New password is required" }, 400);
        }

        const requestInfo = getRequestInfo(c);
        await authService.setPassword(user.id, body.newPassword, requestInfo);
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

// Password Reset
export const requestPasswordReset = async (c: Context) => {
    try {
        const body = c.get("decryptedBody") || await c.req.json();
        if (!body.email) return c.json({ error: "Email required" }, 400);

        const requestInfo = getRequestInfo(c);
        await authService.requestPasswordReset(body.email, requestInfo);
        return jsonEncrypted(c, { success: true, message: "If an account exists, a reset email has been sent." }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const resetPassword = async (c: Context) => {
    try {
        const body = c.get("decryptedBody") || await c.req.json();
        if (!body.token || !body.newPassword) {
            return c.json({ error: "Token and new password required" }, 400);
        }

        const requestInfo = getRequestInfo(c);
        await authService.resetPassword(body.token, body.newPassword, requestInfo);
        return jsonEncrypted(c, { success: true, message: "Password has been reset successfully." }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

// Delete Account
export const deleteAccount = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const requestInfo = getRequestInfo(c);
        await authService.deleteAccount(user.id, requestInfo);

        deleteCookie(c, "accessToken");
        deleteCookie(c, "refreshToken");

        return c.json({ success: true, message: "Account deleted successfully" }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

// Cleanup (for cron job)
export const cleanupTokens = async (c: Context) => {
    try {
        // Add API key check for cron jobs
        const apiKey = c.req.header("x-api-key");
        if (apiKey !== process.env.CRON_API_KEY) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        await authService.cleanupExpiredTokens();
        return c.json({ success: true }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};
