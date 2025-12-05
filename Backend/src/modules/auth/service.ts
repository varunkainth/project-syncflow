import { db } from "../../db/index";
import { users, sessions, refreshTokens } from "../../db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { sign } from "hono/jwt";
import { sendEmail } from "../notifications/email.service";
import { welcomeEmailTemplate, resetPasswordEmailTemplate } from "../notifications/templates";

export class AuthService {
    async signup(data: { email: string; password?: string; name?: string }) {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, data.email),
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;

        const [newUser] = await db.insert(users).values({
            email: data.email,
            password: hashedPassword,
            name: data.name,
        }).returning();

        if (!newUser) throw new Error("Failed to create user");

        // Send Welcome Email (don't await to avoid blocking)
        sendEmail(newUser.email, "Welcome to AntiGravity!", welcomeEmailTemplate(newUser.name || "User")).catch(console.error);

        return newUser;
    }

    async login(data: { email: string; password?: string; code?: string }) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, data.email),
        });

        if (!user || !user.password) {
            throw new Error("Invalid credentials");
        }

        const isValidPassword = await bcrypt.compare(data.password!, user.password);
        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }

        if (user.isTwoFactorEnabled) {
            if (!data.code) {
                return { require2fa: true };
            }
            const isValidCode = authenticator.check(data.code, user.twoFactorSecret!);
            if (!isValidCode) {
                throw new Error("Invalid 2FA code");
            }
        }

        // Create Session/Token
        return this.generateTokens(user);
    }

    async generateTokens(user: any) {
        const accessToken = await sign({
            id: user.id,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
        }, process.env.JWT_SECRET!);

        // Create Refresh Token
        const refreshToken = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.insert(refreshTokens).values({
            userId: user.id,
            token: refreshToken,
            expiresAt: expiresAt,
        });

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, name: user.name }
        };
    }

    async refreshAccessToken(token: string) {
        const storedToken = await db.query.refreshTokens.findFirst({
            where: and(
                eq(refreshTokens.token, token),
                eq(refreshTokens.revoked, false),
                gt(refreshTokens.expiresAt, new Date())
            ),
            with: {
                user: true
            }
        });

        if (!storedToken) {
            throw new Error("Invalid or expired refresh token");
        }

        // Revoke the used refresh token
        await db.update(refreshTokens)
            .set({ revoked: true })
            .where(eq(refreshTokens.id, storedToken.id));

        // Generate new Access Token
        const accessToken = await sign({
            id: storedToken.userId,
            email: storedToken.user.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
        }, process.env.JWT_SECRET!);

        // Generate new Refresh Token (Rotation)
        const newRefreshToken = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.insert(refreshTokens).values({
            userId: storedToken.userId,
            token: newRefreshToken,
            expiresAt: expiresAt,
        });

        return { accessToken, refreshToken: newRefreshToken };
    }

    async me(userId: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async generate2faSecret(userId: string) {
        const secret = authenticator.generateSecret();
        await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, userId));
        return secret;
    }

    async verify2fa(userId: string, code: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user || !user.twoFactorSecret) {
            throw new Error("2FA not setup");
        }

        const isValid = authenticator.check(code, user.twoFactorSecret);
        if (isValid) {
            await db.update(users).set({ isTwoFactorEnabled: true }).where(eq(users.id, userId));
        }
        return isValid;
    }
    async oauthLogin(profile: { email: string; name: string; avatar_url?: string; id: string; provider: string }) {
        let user = await db.query.users.findFirst({
            where: eq(users.email, profile.email),
        });

        if (!user) {
            // Create new user from OAuth
            [user] = await db.insert(users).values({
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.avatar_url,
                password: null, // OAuth users don't have password
            }).returning();

            if (!user) throw new Error("Failed to create user from OAuth");

            // Send Welcome Email (don't await to avoid blocking)
            sendEmail(user.email, "Welcome to AntiGravity!", welcomeEmailTemplate(user.name || "User")).catch(console.error);
        }

        // Generate Token
        return this.generateTokens(user);
    }

    async updateProfile(userId: string, data: { name?: string; bio?: string; phoneNumber?: string; avatarUrl?: string }) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error("User not found");
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
        if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
        updateData.updatedAt = new Date();

        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        return updatedUser;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.password) {
            throw new Error("Cannot change password for OAuth accounts");
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error("Current password is incorrect");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, userId));

        return true;
    }

    async disable2fa(userId: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error("User not found");
        }

        await db.update(users)
            .set({ isTwoFactorEnabled: false, twoFactorSecret: null })
            .where(eq(users.id, userId));

        return true;
    }

    async requestPasswordReset(email: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            // Return true even if user not found to prevent enumeration
            return true;
        }

        if (!user.password) {
            // OAuth user, cannot reset password
            return true;
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.update(users)
            .set({ resetToken, resetTokenExpiresAt })
            .where(eq(users.id, user.id));

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
        const emailContent = resetPasswordEmailTemplate(resetUrl);

        await sendEmail(user.email, emailContent.subject, emailContent.html);

        return true;
    }

    async resetPassword(token: string, newPassword: string) {
        console.log("Data received : \n Token:" + token + "\n Password:" + newPassword);
        const user = await db.query.users.findFirst({
            where: and(
                eq(users.resetToken, token),
                gt(users.resetTokenExpiresAt, new Date())
            ),
        });

        if (!user) {
            throw new Error("Invalid or expired reset token");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.update(users)
            .set({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiresAt: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        return true;
    }
}

