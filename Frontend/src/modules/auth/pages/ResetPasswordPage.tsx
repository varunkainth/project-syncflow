import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api";
import { encryptPayload } from "@/utils/encryption";

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-destructive">Invalid Link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or missing a token.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link to="/auth/forgot-password">Request a new link</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    async function onSubmit(data: ResetPasswordFormValues) {
        setIsLoading(true);
        try {
            const payload = {
                token,
                newPassword: data.password,
                confirmPassword: data.confirmPassword
            };
            const encryptedData = encryptPayload(payload);
            await api.post("/auth/reset-password", { data: encryptedData });

            toast.success("Password Reset Successfully", {
                description: "You can now login with your new password.",
            });
            navigate("/auth/login");
        } catch (error: any) {
            toast.error("Error", {
                description: error.response?.data?.error || "Failed to reset password",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                    Enter your new password below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
