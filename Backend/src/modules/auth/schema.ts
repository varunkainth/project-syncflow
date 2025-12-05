import { z } from "zod";

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    code: z.string().optional(), // For 2FA
});

export const verify2faSchema = z.object({
    code: z.string().length(6),
});

export const enable2faSchema = z.object({
    // No input needed to generate secret, but maybe password for confirmation
    password: z.string(),
});

export const userSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().optional().nullable(),
});

export const requestResetSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
