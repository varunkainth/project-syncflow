import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { AuthService } from "./service";
import { signupSchema, loginSchema, verify2faSchema, enable2faSchema, requestResetSchema, resetPasswordSchema } from "./schema";
import { jsonEncrypted } from "../../middleware/encryption";
import { getGoogleAuthURL, getGoogleUser, getGithubAuthURL, getGithubUser } from "./oauth";

const authService = new AuthService();

export const signup = async (c: Context) => {
    try {
        // Get the decrypted body from middleware
        const body = c.get("decryptedBody");

        if (!body) {
            return c.json({ error: "Invalid encrypted payload" }, 400);
        }

        const result = signupSchema.safeParse(body);
        if (!result.success) {
            return c.json({ error: result.error.issues }, 400);
        }

        const user = await authService.signup(result.data);
        const data = await authService.generateTokens(user);

        setCookie(c, "accessToken", data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });

        setCookie(c, "refreshToken", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return jsonEncrypted(c, { user }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const login = async (c: Context) => {
    try {
        const body = c.get("decryptedBody");

        if (!body) {
            return c.json({ error: "Invalid encrypted payload" }, 400);
        }

        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return c.json({ error: result.error.issues }, 400);
        }

        const data = await authService.login(result.data);

        if ('require2fa' in data && data.require2fa) {
            return jsonEncrypted(c, { require2fa: true }, 200);
        }

        // It's a successful login with tokens
        const tokenData = data as any;

        setCookie(c, "accessToken", tokenData.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });

        setCookie(c, "refreshToken", tokenData.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return jsonEncrypted(c, { user: tokenData.user }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 401);
    }
};

export const refresh = async (c: Context) => {
    try {
        const refreshToken = getCookie(c, "refreshToken");

        if (!refreshToken) {
            return c.json({ error: "Refresh token is required" }, 401);
        }

        const data = await authService.refreshAccessToken(refreshToken);

        setCookie(c, "accessToken", data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });

        setCookie(c, "refreshToken", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
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

export const generate2fa = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const secret = await authService.generate2faSecret(user.id);
        return jsonEncrypted(c, { secret, otpauth: `otpauth://totp/AntiGravity:${user.email}?secret=${secret}&issuer=AntiGravity` });
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

        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        const isValid = await authService.verify2fa(user.id, result.data.code);
        if (!isValid) {
            return c.json({ error: "Invalid code" }, 400);
        }
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const disable2fa = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        await authService.disable2fa(user.id);
        return jsonEncrypted(c, { success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const googleAuth = (c: Context) => {
    return c.redirect(getGoogleAuthURL());
};

export const googleCallback = async (c: Context) => {
    const code = c.req.query("code");
    if (!code) return c.json({ error: "No code provided" }, 400);

    try {
        const googleUser = await getGoogleUser(code);
        const data = await authService.oauthLogin({
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            id: googleUser.id,
            provider: "google",
        });

        // For now, return JSON. In real app, redirect with token in cookie/query
        return jsonEncrypted(c, data, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const githubAuth = (c: Context) => {
    return c.redirect(getGithubAuthURL());
};

export const githubCallback = async (c: Context) => {
    const code = c.req.query("code");
    if (!code) return c.json({ error: "No code provided" }, 400);

    try {
        const githubUser = await getGithubUser(code);
        const data = await authService.oauthLogin({
            email: githubUser.email,
            name: githubUser.name || githubUser.login,
            avatar_url: githubUser.avatar_url,
            id: githubUser.id.toString(),
            provider: "github",
        });
        return jsonEncrypted(c, data, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};

export const updateProfile = async (c: Context) => {
    try {
        const user = c.get("user");
        if (!user) return c.json({ error: "Unauthorized" }, 401);

        const body = c.get("decryptedBody");
        if (!body) {
            return c.json({ error: "Invalid encrypted payload" }, 400);
        }

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
        if (!body) {
            return c.json({ error: "Invalid encrypted payload" }, 400);
        }

        if (!body.currentPassword || !body.newPassword) {
            return c.json({ error: "Current password and new password are required" }, 400);
        }

        await authService.changePassword(user.id, body.currentPassword, body.newPassword);
        return jsonEncrypted(c, { success: true }, 200);
    } catch (error: any) {
    }
};

export const requestPasswordReset = async (c: Context) => {
    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const result = requestResetSchema.safeParse(body);

        if (!result.success) {
            return c.json({ error: result.error.issues }, 400);
        }

        await authService.requestPasswordReset(result.data.email);
        return jsonEncrypted(c, { success: true, message: "If an account exists, a reset email has been sent." }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
};

export const resetPassword = async (c: Context) => {
    try {
        const body = c.get("decryptedBody") || await c.req.json();
        const result = resetPasswordSchema.safeParse(body);

        if (!result.success) {
            return c.json({ error: result.error.issues }, 400);
        }

        await authService.resetPassword(result.data.token, result.data.newPassword);
        return jsonEncrypted(c, { success: true, message: "Password has been reset successfully." }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
};
