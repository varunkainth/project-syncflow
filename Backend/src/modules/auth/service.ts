import { db } from "../../db/index";
import { users, sessions, refreshTokens, projects, projectMembers, tasks, comments, subTasks, attachments, oauthAccounts, auditLogs } from "../../db/schema";
import { eq, and, gt, lt, or } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { sign } from "hono/jwt";
import { sendEmail } from "../notifications/email.service";
import { welcomeEmailTemplate, resetPasswordEmailTemplate, emailVerificationTemplate } from "../notifications/templates";
import { CacheService } from "../../common/cache.service";

const cacheService = new CacheService();

interface RequestInfo {
    ipAddress?: string;
    userAgent?: string;
}

export class AuthService {
    // Audit logging helper
    async logAudit(userId: string | null, action: string, requestInfo: RequestInfo, metadata?: object) {
        await db.insert(auditLogs).values({
            userId,
            action,
            ipAddress: requestInfo.ipAddress,
            userAgent: requestInfo.userAgent,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });
    }

    async signup(data: { email: string; password?: string; name?: string }, requestInfo: RequestInfo = {}) {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, data.email),
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const [newUser] = await db.insert(users).values({
            email: data.email,
            password: hashedPassword,
            name: data.name,
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpires,
        }).returning();

        if (!newUser) throw new Error("Failed to create user");

        // Send verification email
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/verify-email?token=${verificationToken}`;
        sendEmail(newUser.email, "Verify your email - SyncFlow", emailVerificationTemplate(newUser.name || "User", verifyUrl)).catch(console.error);

        await this.logAudit(newUser.id, "signup", requestInfo);

        return newUser;
    }

    async verifyEmail(token: string) {
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.emailVerificationToken, token),
                gt(users.emailVerificationExpiresAt, new Date())
            ),
        });

        if (!user) {
            throw new Error("Invalid or expired verification token");
        }

        await db.update(users).set({
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpiresAt: null,
        }).where(eq(users.id, user.id));

        // Send welcome email after verification
        sendEmail(user.email, "Welcome to SyncFlow!", welcomeEmailTemplate(user.name || "User")).catch(console.error);

        return true;
    }

    async resendVerificationEmail(email: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user || user.emailVerified) {
            return true; // Don't reveal if user exists
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.update(users).set({
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpires,
        }).where(eq(users.id, user.id));

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/verify-email?token=${verificationToken}`;
        sendEmail(user.email, "Verify your email - SyncFlow", emailVerificationTemplate(user.name || "User", verifyUrl)).catch(console.error);

        return true;
    }

    async login(data: { email: string; password?: string; code?: string }, requestInfo: RequestInfo = {}) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, data.email),
        });

        if (!user || !user.password) {
            await this.logAudit(null, "login_failed", requestInfo, { email: data.email, reason: "invalid_credentials" });
            throw new Error("Invalid credentials");
        }

        const isValidPassword = await bcrypt.compare(data.password!, user.password);
        if (!isValidPassword) {
            await this.logAudit(user.id, "login_failed", requestInfo, { reason: "wrong_password" });
            throw new Error("Invalid credentials");
        }

        // Check email verification (optional - can be enforced)
        // if (!user.emailVerified) {
        //     throw new Error("Please verify your email first");
        // }

        if (user.isTwoFactorEnabled) {
            if (!data.code) {
                return { require2fa: true };
            }
            const isValidCode = authenticator.check(data.code, user.twoFactorSecret!);
            if (!isValidCode) {
                await this.logAudit(user.id, "login_failed", requestInfo, { reason: "invalid_2fa" });
                throw new Error("Invalid 2FA code");
            }
        }

        await this.logAudit(user.id, "login", requestInfo);
        return this.generateTokens(user, requestInfo);
    }

    async generateTokens(user: any, requestInfo: RequestInfo = {}) {
        const accessToken = await sign({
            id: user.id,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
        }, process.env.JWT_SECRET!);

        const refreshToken = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.insert(refreshTokens).values({
            userId: user.id,
            token: refreshToken,
            expiresAt,
            userAgent: requestInfo.userAgent,
            ipAddress: requestInfo.ipAddress,
        });

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified }
        };
    }

    async refreshAccessToken(token: string, requestInfo: RequestInfo = {}) {
        const storedToken = await db.query.refreshTokens.findFirst({
            where: and(
                eq(refreshTokens.token, token),
                eq(refreshTokens.revoked, false),
                gt(refreshTokens.expiresAt, new Date())
            ),
            with: { user: true }
        });

        if (!storedToken) {
            throw new Error("Invalid or expired refresh token");
        }

        // Revoke the used refresh token (rotation)
        await db.update(refreshTokens)
            .set({ revoked: true })
            .where(eq(refreshTokens.id, storedToken.id));

        const accessToken = await sign({
            id: storedToken.userId,
            email: storedToken.user.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 15,
        }, process.env.JWT_SECRET!);

        const newRefreshToken = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.insert(refreshTokens).values({
            userId: storedToken.userId,
            token: newRefreshToken,
            expiresAt,
            userAgent: requestInfo.userAgent,
            ipAddress: requestInfo.ipAddress,
        });

        return { accessToken, refreshToken: newRefreshToken };
    }

    async me(userId: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) throw new Error("User not found");
        return user;
    }

    // Session Management
    async getSessions(userId: string) {
        return db.query.refreshTokens.findMany({
            where: and(
                eq(refreshTokens.userId, userId),
                eq(refreshTokens.revoked, false),
                gt(refreshTokens.expiresAt, new Date())
            ),
            columns: {
                id: true,
                userAgent: true,
                ipAddress: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
    }

    async revokeSession(userId: string, sessionId: string, requestInfo: RequestInfo = {}) {
        const session = await db.query.refreshTokens.findFirst({
            where: and(
                eq(refreshTokens.id, sessionId),
                eq(refreshTokens.userId, userId)
            ),
        });

        if (!session) throw new Error("Session not found");

        await db.update(refreshTokens)
            .set({ revoked: true })
            .where(eq(refreshTokens.id, sessionId));

        await this.logAudit(userId, "session_revoked", requestInfo, { sessionId });
        return true;
    }

    async revokeAllSessions(userId: string, exceptToken?: string, requestInfo: RequestInfo = {}) {
        if (exceptToken) {
            await db.update(refreshTokens)
                .set({ revoked: true })
                .where(and(
                    eq(refreshTokens.userId, userId),
                    eq(refreshTokens.revoked, false)
                ));
        } else {
            await db.update(refreshTokens)
                .set({ revoked: true })
                .where(eq(refreshTokens.userId, userId));
        }

        await this.logAudit(userId, "all_sessions_revoked", requestInfo);
        return true;
    }

    // 2FA
    async generate2faSecret(userId: string) {
        const secret = authenticator.generateSecret();
        await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, userId));
        return secret;
    }

    async verify2fa(userId: string, code: string, requestInfo: RequestInfo = {}) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user || !user.twoFactorSecret) throw new Error("2FA not setup");

        const isValid = authenticator.check(code, user.twoFactorSecret);
        if (isValid) {
            await db.update(users).set({ isTwoFactorEnabled: true }).where(eq(users.id, userId));
            await this.logAudit(userId, "2fa_enabled", requestInfo);
        }
        return isValid;
    }

    async disable2fa(userId: string, requestInfo: RequestInfo = {}) {
        await db.update(users)
            .set({ isTwoFactorEnabled: false, twoFactorSecret: null })
            .where(eq(users.id, userId));
        await this.logAudit(userId, "2fa_disabled", requestInfo);
        return true;
    }

    // OAuth with account linking
    async oauthLogin(profile: { email: string; name: string; avatar_url?: string; id: string; provider: string }, requestInfo: RequestInfo = {}) {
        // Check if OAuth account already linked
        const existingOAuth = await db.query.oauthAccounts.findFirst({
            where: and(
                eq(oauthAccounts.provider, profile.provider),
                eq(oauthAccounts.providerAccountId, profile.id)
            ),
            with: { user: true }
        });

        if (existingOAuth) {
            await this.logAudit(existingOAuth.userId, "oauth_login", requestInfo, { provider: profile.provider });
            return this.generateTokens(existingOAuth.user, requestInfo);
        }

        // Check if user with email exists
        let user = await db.query.users.findFirst({
            where: eq(users.email, profile.email),
        });

        if (user) {
            // Link OAuth to existing account
            await db.insert(oauthAccounts).values({
                userId: user.id,
                provider: profile.provider,
                providerAccountId: profile.id,
            });
            await this.logAudit(user.id, "oauth_linked", requestInfo, { provider: profile.provider });
        } else {
            // Create new user
            [user] = await db.insert(users).values({
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.avatar_url,
                password: null,
                emailVerified: true, // OAuth emails are pre-verified
            }).returning();

            if (!user) throw new Error("Failed to create user from OAuth");

            await db.insert(oauthAccounts).values({
                userId: user.id,
                provider: profile.provider,
                providerAccountId: profile.id,
            });

            sendEmail(user.email, "Welcome to SyncFlow!", welcomeEmailTemplate(user.name || "User")).catch(console.error);
            await this.logAudit(user.id, "oauth_signup", requestInfo, { provider: profile.provider });
        }

        return this.generateTokens(user, requestInfo);
    }

    async getLinkedAccounts(userId: string) {
        return db.query.oauthAccounts.findMany({
            where: eq(oauthAccounts.userId, userId),
            columns: { id: true, provider: true, createdAt: true },
        });
    }

    async unlinkOAuthAccount(userId: string, provider: string, requestInfo: RequestInfo = {}) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        // Ensure user has password or another OAuth before unlinking
        const linkedAccounts = await this.getLinkedAccounts(userId);
        if (!user?.password && linkedAccounts.length <= 1) {
            throw new Error("Cannot unlink the only login method. Set a password first.");
        }

        await db.delete(oauthAccounts).where(and(
            eq(oauthAccounts.userId, userId),
            eq(oauthAccounts.provider, provider)
        ));

        await this.logAudit(userId, "oauth_unlinked", requestInfo, { provider });
        return true;
    }

    // Profile
    async updateProfile(userId: string, data: { name?: string; bio?: string; phoneNumber?: string; avatarUrl?: string }) {
        const updateData: any = { updatedAt: new Date() };
        if (data.name !== undefined) updateData.name = data.name;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
        if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        return updatedUser;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string, requestInfo: RequestInfo = {}) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) throw new Error("User not found");
        if (!user.password) throw new Error("Cannot change password for OAuth-only accounts. Set a password first.");

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            await this.logAudit(userId, "password_change_failed", requestInfo);
            throw new Error("Current password is incorrect");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, userId));

        await this.logAudit(userId, "password_changed", requestInfo);
        return true;
    }

    async setPassword(userId: string, newPassword: string, requestInfo: RequestInfo = {}) {
        // For OAuth users who want to add password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, userId));

        await this.logAudit(userId, "password_set", requestInfo);
        return true;
    }

    // Password Reset
    async requestPasswordReset(email: string, requestInfo: RequestInfo = {}) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user || !user.password) return true; // Don't reveal user existence

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.update(users)
            .set({ resetToken, resetTokenExpiresAt })
            .where(eq(users.id, user.id));

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
        const emailContent = resetPasswordEmailTemplate(resetUrl);
        await sendEmail(user.email, emailContent.subject, emailContent.html);

        await this.logAudit(user.id, "password_reset_requested", requestInfo);
        return true;
    }

    async resetPassword(token: string, newPassword: string, requestInfo: RequestInfo = {}) {
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.resetToken, token),
                gt(users.resetTokenExpiresAt, new Date())
            ),
        });

        if (!user) throw new Error("Invalid or expired reset token");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users)
            .set({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiresAt: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        // Revoke all sessions for security
        await this.revokeAllSessions(user.id);
        await this.logAudit(user.id, "password_reset", requestInfo);
        return true;
    }

    // Audit Logs
    async getAuditLogs(userId: string, limit = 50) {
        return db.query.auditLogs.findMany({
            where: eq(auditLogs.userId, userId),
            orderBy: (t, { desc }) => [desc(t.createdAt)],
            limit,
        });
    }

    // Cleanup expired tokens (call via cron job)
    async cleanupExpiredTokens() {
        const now = new Date();
        await db.delete(refreshTokens).where(
            or(
                lt(refreshTokens.expiresAt, now),
                eq(refreshTokens.revoked, true)
            )
        );
        return true;
    }

    // Delete Account (optimized with cascading)
    async deleteAccount(userId: string, requestInfo: RequestInfo = {}) {
        await this.logAudit(userId, "account_deleted", requestInfo);

        // Get owned projects
        const userProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, userId));

        for (const project of userProjects) {
            // Delete tasks and related data (cascade handles subtasks, comments, attachments via FK)
            await db.delete(tasks).where(eq(tasks.projectId, project.id));
            await db.delete(projectMembers).where(eq(projectMembers.projectId, project.id));
            await db.delete(projects).where(eq(projects.id, project.id));
        }

        // Delete tasks created by user in other projects
        await db.delete(tasks).where(eq(tasks.creatorId, userId));

        // Delete user (cascades: refreshTokens, oauthAccounts, auditLogs, sessions, comments, projectMembers)
        await db.delete(users).where(eq(users.id, userId));

        return true;
    }
}
